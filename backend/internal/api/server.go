package api

import (
	"database/sql"
	"log"

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

	// Set trusted proxies to avoid warning
	// In production, set this to your actual proxy IPs
	if cfg.Server.Env == "production" {
		router.SetTrustedProxies([]string{"127.0.0.1", "::1"})
	} else {
		// For development, trust localhost only
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
	// Middleware
	s.router.Use(middleware.CORS(s.cfg.CORS.Origin))
	s.router.Use(middleware.Logger())
	s.router.Use(gin.Recovery())

	// Initialize repositories
	userRepo := repository.NewUserRepository(s.db)
	orgRepo := repository.NewOrganizationRepository(s.db)
	serviceRepo := repository.NewServiceRepository(s.db)
	healthCheckRepo := repository.NewHealthCheckRepository(s.db)
	alertRepo := repository.NewAlertRepository(s.db)

	// Initialize supporting services
	notifierService := notifier.NewNotifierService(alertRepo)

	// Initialize OpenAI client if configured
	var openAIClient *ai.OpenAIClient
	if s.cfg.OpenAI.Enabled {
		openAIClient = ai.NewOpenAIClient(
			s.cfg.OpenAI.APIKey,
			s.cfg.OpenAI.Model,
			s.cfg.OpenAI.Timeout,
		)
		if openAIClient != nil {
			log.Println("✅ OpenAI client initialized for AI predictions")
		} else {
			log.Println("⚠️ OpenAI configuration found but client initialization failed")
		}
	} else {
		log.Println("ℹ️ OpenAI not configured - predictions will use statistical analysis only")
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo, orgRepo, s.cfg)
	serviceHandler := handlers.NewServiceHandler(serviceRepo, s.cfg)
	healthCheckHandler := handlers.NewHealthCheckHandler(healthCheckRepo, serviceRepo, alertRepo, notifierService, s.cfg)
	alertHandler := handlers.NewAlertHandler(alertRepo, serviceRepo, notifierService, s.cfg)
	statsHandler := handlers.NewStatsHandler(serviceRepo, healthCheckRepo, s.cfg)
	reportHandler := handlers.NewReportHandler(serviceRepo, healthCheckRepo, s.cfg)
	adminHandler := handlers.NewAdminHandler(userRepo, orgRepo, serviceRepo, healthCheckRepo, alertRepo, s.cfg)
	predictionHandler := handlers.NewPredictionHandler(serviceRepo, healthCheckRepo, s.cfg, openAIClient)
	metricsHandler := handlers.NewMetricsHandler(healthCheckRepo, s.cfg)

	// Public routes
	api := s.router.Group("/api/v1")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.GET("/health", handlers.HealthCheck)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(s.cfg.JWT.Secret))
	{
		// Auth
		protected.GET("/auth/me", authHandler.Me)

		// Services
		protected.GET("/services", serviceHandler.ListServices)
		protected.POST("/services", serviceHandler.CreateService)
		protected.GET("/services/:id", serviceHandler.GetService)
		protected.PUT("/services/:id", serviceHandler.UpdateService)
		protected.DELETE("/services/:id", serviceHandler.DeleteService)

		// Health Checks
		protected.GET("/services/:id/health-checks", healthCheckHandler.GetHealthChecks)
		protected.POST("/services/:id/health-checks/trigger", healthCheckHandler.TriggerHealthCheck)

		// Stats
		protected.GET("/services/:id/stats", statsHandler.GetServiceStats)
		protected.GET("/stats/overview", statsHandler.GetOverview)

		// Alerts
		protected.GET("/alerts", alertHandler.ListAlerts)
		protected.GET("/alerts/:id", alertHandler.GetAlert)
		protected.PUT("/alerts/:id/resolve", alertHandler.ResolveAlert)
		protected.POST("/alerts/subscriptions", alertHandler.CreateSubscription)
		protected.GET("/alerts/subscriptions", alertHandler.ListSubscriptions)
		protected.DELETE("/alerts/subscriptions/:id", alertHandler.DeleteSubscription)

		// Reports
		protected.GET("/services/:id/reports/csv", reportHandler.ExportCSV)
		protected.GET("/services/:id/reports/pdf", reportHandler.ExportPDF)

		// WebSocket for real-time updates
		wsHandler := handlers.NewWebSocketHandler()
		protected.GET("/ws", wsHandler.HandleWebSocket)

		// AI Predictions
		protected.GET("/predictions", predictionHandler.GetPredictions)
		protected.GET("/services/:id/prediction", predictionHandler.GetServicePrediction)
	}

	// Public metrics endpoint (Prometheus format)
	api.GET("/metrics", metricsHandler.GetPrometheusMetrics)

	// Admin routes (require admin role)
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.cfg.JWT.Secret))
	admin.Use(middleware.AdminMiddleware())
	{
		// System metrics
		admin.GET("/metrics", adminHandler.GetSystemMetrics)

		// User management
		admin.GET("/users", adminHandler.ListUsers)
		admin.POST("/users", adminHandler.CreateUser)
		admin.PUT("/users/:id", adminHandler.UpdateUser)
		admin.DELETE("/users/:id", adminHandler.DeleteUser)

		// Organization management
		admin.GET("/organizations", adminHandler.ListOrganizations)
		admin.PUT("/organizations/:id", adminHandler.UpdateOrganization)
		admin.DELETE("/organizations/:id", adminHandler.DeleteOrganization)
	}

	// Super admin routes (require super_admin role)
	superAdmin := api.Group("/admin/super")
	superAdmin.Use(middleware.AuthMiddleware(s.cfg.JWT.Secret))
	superAdmin.Use(middleware.SuperAdminMiddleware())
	{
		// Super admin user management
		superAdmin.POST("/users/:id/promote", adminHandler.PromoteToSuperAdmin)
		superAdmin.POST("/users/:id/demote", adminHandler.DemoteFromSuperAdmin)
	}
}

func (s *Server) Start(addr string) error {
	return s.router.Run(addr)
}
