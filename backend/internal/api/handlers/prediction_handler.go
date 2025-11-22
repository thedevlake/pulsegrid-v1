package handlers

import (
	"log"
	"net/http"
	"time"

	"pulsegrid/backend/internal/ai"
	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PredictionHandler struct {
	predictor        *ai.Predictor
	serviceRepo      *repository.ServiceRepository
	healthCheckRepo  *repository.HealthCheckRepository
	cfg              *config.Config
}

func NewPredictionHandler(
	serviceRepo *repository.ServiceRepository,
	healthCheckRepo *repository.HealthCheckRepository,
	cfg *config.Config,
	openAIClient *ai.OpenAIClient,
) *PredictionHandler {
	return &PredictionHandler{
		predictor:       ai.NewPredictor(openAIClient),
		serviceRepo:     serviceRepo,
		healthCheckRepo: healthCheckRepo,
		cfg:             cfg,
	}
}

// GetPredictions returns AI-driven predictions for all services
func (h *PredictionHandler) GetPredictions(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Convert user_id to string first, then parse as UUID
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type"})
		return
	}

	userUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Get user's organization
	userRepo := repository.NewUserRepository(h.healthCheckRepo.GetDB())
	user, err := userRepo.GetByID(userUUID)
	if err != nil {
		log.Printf("Error fetching user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}

	if user.OrganizationID == nil {
		c.JSON(http.StatusOK, gin.H{"predictions": []interface{}{}})
		return
	}

	// Get all services for the organization
	services, err := h.serviceRepo.ListByOrganization(*user.OrganizationID)
	if err != nil {
		log.Printf("Error fetching services: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
		return
	}

	var predictions []*ai.Prediction

	// Analyze each service
	for _, service := range services {
		if !service.IsActive {
			continue
		}

		// Get historical health checks (last 7 days)
		since := time.Now().UTC().Add(-7 * 24 * time.Hour)
		healthChecks, err := h.healthCheckRepo.GetByServiceID(service.ID, 1000)
		if err != nil {
			continue
		}

		// Filter by time window
		var recentChecks []*models.HealthCheck
		for _, check := range healthChecks {
			if check.CheckedAt.After(since) {
				recentChecks = append(recentChecks, check)
			}
		}

		if len(recentChecks) < 10 {
			continue
		}

		// Generate prediction
		prediction := h.predictor.AnalyzeService(service, recentChecks)
		if prediction != nil && prediction.RiskLevel != "low" {
			predictions = append(predictions, prediction)
		}
	}

	c.JSON(http.StatusOK, gin.H{"predictions": predictions})
}

// GetServicePrediction returns prediction for a specific service
func (h *PredictionHandler) GetServicePrediction(c *gin.Context) {
	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	// Get service
	service, err := h.serviceRepo.GetByID(serviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	// Get historical health checks
	healthChecks, err := h.healthCheckRepo.GetByServiceID(serviceID, 1000)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch health checks"})
		return
	}

	if len(healthChecks) < 10 {
		c.JSON(http.StatusOK, gin.H{
			"prediction": nil,
			"message":    "Not enough historical data for prediction",
		})
		return
	}

	// Generate prediction
	prediction := h.predictor.AnalyzeService(service, healthChecks)

	c.JSON(http.StatusOK, gin.H{"prediction": prediction})
}

