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

	authHandler := handlers.NewAuthHandler(userRepo, orgRepo, s.cfg)
	serviceHandler := handlers.NewServiceHandler(serviceRepo, s.cfg)
	healthCheckHandler := handlers.NewHealthCheckHandler(healthCheckRepo, serviceRepo, alertRepo, notifierService, s.cfg)
	alertHandler := handlers.NewAlertHandler(alertRepo, serviceRepo, notifierService, s.cfg)
	statsHandler := handlers.NewStatsHandler(serviceRepo, healthCheckRepo, s.cfg)
	reportHandler := handlers.NewReportHandler(serviceRepo, healthCheckRepo, s.cfg)
	adminHandler := handlers.NewAdminHandler(userRepo, orgRepo, serviceRepo, healthCheckRepo, alertRepo, s.cfg)
	predictionHandler := handlers.NewPredictionHandler(serviceRepo, healthCheckRepo, s.cfg, openAIClient)
	metricsHandler := handlers.NewMetricsHandler(healthCheckRepo, s.cfg)

	api := s.router.Group("/api/v1")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.GET("/health", handlers.HealthCheck)
		api.GET("/health/detailed", handlers.DetailedHealthCheck(s.db))
		api.GET("/public/status", handlers.CheckPublicStatus)
		api.GET("/public/info", handlers.GetPublicInfo)
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
