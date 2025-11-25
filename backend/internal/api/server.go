package api

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"strings"

	"pulsegrid/backend/internal/ai"
	"pulsegrid/backend/internal/api/handlers"
	"pulsegrid/backend/internal/api/middleware"
	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/notifier"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type Server struct {
	router *gin.Engine
	db     *sql.DB
	cfg    *config.Config
}

func NewServer(cfg *config.Config, db *sql.DB) *Server {
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	if cfg.Server.Env == "production" {
		router.SetTrustedProxies([]string{"127.0.0.1", "::1"})
	} else {
		router.SetTrustedProxies([]string{"127.0.0.1", "::1"})
	}

	server := &Server{
		router: router,
		db:     db,
		cfg:    cfg,
	}

	server.setupRoutes()
	return server
}

func (s *Server) setupRoutes() {
	s.router.Use(middleware.SecurityHeaders())
	s.router.Use(middleware.CORS(s.cfg.CORS.Origin))
	s.router.Use(middleware.InputValidation())
	s.router.Use(middleware.ValidateContentType())
	
	if s.cfg.Server.Env == "production" {
		s.router.Use(middleware.JSONLogger())
	} else {
		s.router.Use(middleware.Logger())
	}
	
	s.router.Use(gin.Recovery())

	userRepo := repository.NewUserRepository(s.db)
	orgRepo := repository.NewOrganizationRepository(s.db)
	serviceRepo := repository.NewServiceRepository(s.db)
	healthCheckRepo := repository.NewHealthCheckRepository(s.db)
	alertRepo := repository.NewAlertRepository(s.db)

	// Initialize supporting services
	notifierService := notifier.NewNotifierService(alertRepo)

	// Initialize AI client (OpenAI or Ollama) if configured
	var aiClient ai.AIClient
	if s.cfg.Ollama.Enabled {
		ollamaClient := ai.NewOllamaClient(
			s.cfg.Ollama.BaseURL,
			s.cfg.Ollama.Model,
			s.cfg.Ollama.Timeout,
		)
		if ollamaClient != nil {
			aiClient = ollamaClient
			log.Printf("✅ Ollama client initialized for AI predictions (model: %s, baseURL: %s)", s.cfg.Ollama.Model, s.cfg.Ollama.BaseURL)
		} else {
			log.Println("⚠️ Ollama configuration found but client initialization failed")
		}
	} else if s.cfg.OpenAI.Enabled {
		openAIClient := ai.NewOpenAIClient(
			s.cfg.OpenAI.APIKey,
			s.cfg.OpenAI.Model,
			s.cfg.OpenAI.Timeout,
		)
		if openAIClient != nil {
			aiClient = openAIClient
			log.Println("✅ OpenAI client initialized for AI predictions")
		} else {
			log.Println("⚠️ OpenAI configuration found but client initialization failed")
		}
	} else {
		log.Println("ℹ️ No AI provider configured - predictions will use statistical analysis only")
	}

	authHandler := handlers.NewAuthHandler(userRepo, orgRepo, s.cfg)
	serviceHandler := handlers.NewServiceHandler(serviceRepo, s.cfg)
	healthCheckHandler := handlers.NewHealthCheckHandler(healthCheckRepo, serviceRepo, alertRepo, notifierService, s.cfg)
	alertHandler := handlers.NewAlertHandler(alertRepo, serviceRepo, notifierService, s.cfg)
	statsHandler := handlers.NewStatsHandler(serviceRepo, healthCheckRepo, s.cfg)
	reportHandler := handlers.NewReportHandler(serviceRepo, healthCheckRepo, s.cfg)
	adminHandler := handlers.NewAdminHandler(userRepo, orgRepo, serviceRepo, healthCheckRepo, alertRepo, s.cfg)
	predictionHandler := handlers.NewPredictionHandler(serviceRepo, healthCheckRepo, s.cfg, aiClient)
	metricsHandler := handlers.NewMetricsHandler(healthCheckRepo, s.cfg)

	api := s.router.Group("/api/v1")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.GET("/health", handlers.HealthCheck)
		api.GET("/health/detailed", handlers.DetailedHealthCheck(s.db))
		api.GET("/public/status", handlers.CheckPublicStatus)
		api.GET("/public/info", handlers.GetPublicInfo)
		// Serve OpenAPI specification with dynamic server URL
		api.GET("/openapi.yaml", func(c *gin.Context) {
			// Determine the server URL from request or environment
			serverURL := getServerURL(c)
			
			// Try multiple possible paths relative to common working directories
			paths := []string{
				"./api/openapi.yaml",                    // From backend/ directory
				"../api/openapi.yaml",                   // From backend/cmd/api/ directory
				filepath.Join("backend", "api", "openapi.yaml"), // From project root
			}
			
			var filePath string
			for _, path := range paths {
				if _, err := os.Stat(path); err == nil {
					filePath = path
					break
				}
			}
			
			if filePath == "" {
				c.JSON(404, gin.H{"error": "OpenAPI specification not found"})
				return
			}
			
			// Read the file
			content, err := os.ReadFile(filePath)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to read OpenAPI specification"})
				return
			}
			
			// Replace server URL dynamically based on environment
			contentStr := string(content)
			
			// Always replace the production URL placeholder with actual server URL
			contentStr = strings.ReplaceAll(contentStr, 
				"  - url: http://pulsegrid.duckdns.org:8080/api/v1",
				"  - url: "+serverURL)
			
			// In production, remove localhost server entry entirely
			if s.cfg.Server.Env == "production" {
				// Remove localhost server and its description
				lines := strings.Split(contentStr, "\n")
				var newLines []string
				skipNext := false
				for _, line := range lines {
					if skipNext {
						skipNext = false
						continue
					}
					if strings.Contains(line, "http://localhost:8080/api/v1") {
						// Skip this line (server URL) and next line (description)
						skipNext = true
						continue
					}
					newLines = append(newLines, line)
				}
				contentStr = strings.Join(newLines, "\n")
			}
			
			c.Data(200, "application/x-yaml", []byte(contentStr))
		})
	}

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(s.cfg.JWT.Secret))
	{
		protected.GET("/auth/me", authHandler.Me)

		protected.GET("/services", serviceHandler.ListServices)
		protected.POST("/services", serviceHandler.CreateService)
		protected.GET("/services/:id", serviceHandler.GetService)
		protected.PUT("/services/:id", serviceHandler.UpdateService)
		protected.DELETE("/services/:id", serviceHandler.DeleteService)

		protected.GET("/services/:id/health-checks", healthCheckHandler.GetHealthChecks)
		protected.POST("/services/:id/health-checks/trigger", healthCheckHandler.TriggerHealthCheck)

		protected.GET("/services/:id/stats", statsHandler.GetServiceStats)
		protected.GET("/stats/overview", statsHandler.GetOverview)

		protected.GET("/alerts", alertHandler.ListAlerts)
		protected.GET("/alerts/:id", alertHandler.GetAlert)
		protected.PUT("/alerts/:id/resolve", alertHandler.ResolveAlert)
		protected.POST("/alerts/subscriptions", alertHandler.CreateSubscription)
		protected.GET("/alerts/subscriptions", alertHandler.ListSubscriptions)
		protected.DELETE("/alerts/subscriptions/:id", alertHandler.DeleteSubscription)

		protected.GET("/services/:id/reports/csv", reportHandler.ExportCSV)
		protected.GET("/services/:id/reports/pdf", reportHandler.ExportPDF)

		wsHandler := handlers.NewWebSocketHandler()
		protected.GET("/ws", wsHandler.HandleWebSocket)

		protected.GET("/predictions", predictionHandler.GetPredictions)
		protected.GET("/services/:id/prediction", predictionHandler.GetServicePrediction)
	}

	api.GET("/metrics", metricsHandler.GetPrometheusMetrics)

	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.cfg.JWT.Secret))
	admin.Use(middleware.AdminMiddleware())
	{
		admin.GET("/metrics", adminHandler.GetSystemMetrics)
		admin.GET("/users", adminHandler.ListUsers)
		admin.POST("/users", adminHandler.CreateUser)
		admin.PUT("/users/:id", adminHandler.UpdateUser)
		admin.DELETE("/users/:id", adminHandler.DeleteUser)
		admin.GET("/organizations", adminHandler.ListOrganizations)
		admin.PUT("/organizations/:id", adminHandler.UpdateOrganization)
		admin.DELETE("/organizations/:id", adminHandler.DeleteOrganization)
	}

	superAdmin := api.Group("/admin/super")
	superAdmin.Use(middleware.AuthMiddleware(s.cfg.JWT.Secret))
	superAdmin.Use(middleware.SuperAdminMiddleware())
	{
		superAdmin.POST("/users/:id/promote", adminHandler.PromoteToSuperAdmin)
		superAdmin.POST("/users/:id/demote", adminHandler.DemoteFromSuperAdmin)
	}
}

func (s *Server) Start(addr string) error {
	return s.router.Run(addr)
}

// getServerURL determines the server URL from request or environment
func getServerURL(c *gin.Context) string {
	// First, try BACKEND_URL environment variable (set in ECS)
	if backendURL := os.Getenv("BACKEND_URL"); backendURL != "" {
		return backendURL + "/api/v1"
	}
	
	// Use the request's scheme and host
	scheme := "http"
	if c.GetHeader("X-Forwarded-Proto") == "https" || c.Request.TLS != nil {
		scheme = "https"
	}
	
	host := c.Request.Host
	if host == "" {
		host = c.GetHeader("Host")
	}
	if host == "" {
		host = "localhost:8080"
	}
	
	// Remove port if it's the default for the scheme
	if scheme == "https" && strings.HasSuffix(host, ":443") {
		host = strings.TrimSuffix(host, ":443")
	} else if scheme == "http" && strings.HasSuffix(host, ":80") {
		host = strings.TrimSuffix(host, ":80")
	}
	
	return scheme + "://" + host + "/api/v1"
}
