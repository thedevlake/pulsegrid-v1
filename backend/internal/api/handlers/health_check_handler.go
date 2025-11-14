package handlers

import (
	"net/http"
	"strconv"
	"time"

	"pulsegrid/backend/internal/checker"
	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HealthCheckHandler struct {
	healthCheckRepo *repository.HealthCheckRepository
	serviceRepo     *repository.ServiceRepository
	cfg             *config.Config
}

func NewHealthCheckHandler(healthCheckRepo *repository.HealthCheckRepository, serviceRepo *repository.ServiceRepository, cfg *config.Config) *HealthCheckHandler {
	return &HealthCheckHandler{
		healthCheckRepo: healthCheckRepo,
		serviceRepo:     serviceRepo,
		cfg:             cfg,
	}
}

func (h *HealthCheckHandler) GetHealthChecks(c *gin.Context) {
	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	limit := 100
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 1000 {
			limit = l
		}
	}

	checks, err := h.healthCheckRepo.GetByServiceID(serviceID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch health checks"})
		return
	}

	// Ensure checks is always an array, never null
	if checks == nil {
		checks = []*models.HealthCheck{}
	}

	c.JSON(http.StatusOK, checks)
}

func (h *HealthCheckHandler) TriggerHealthCheck(c *gin.Context) {
	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	// Get the service
	service, err := h.serviceRepo.GetByID(serviceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	// Check if service is active
	if !service.IsActive {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Service is not active"})
		return
	}

	// Perform health check
	timeout := time.Duration(service.Timeout) * time.Second
	var result *checker.HealthCheckResult

	switch service.Type {
	case "http", "https":
		result = checker.CheckHTTP(service.URL, timeout, service.ExpectedStatusCode)
	case "tcp":
		result = checker.CheckTCP(service.URL, timeout)
	case "ping":
		result = checker.CheckPing(service.URL, timeout)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown service type"})
		return
	}

	// Save health check
	healthCheck := &models.HealthCheck{
		ServiceID:      service.ID,
		Status:         result.Status,
		ResponseTimeMs: result.ResponseTimeMs,
		StatusCode:     result.StatusCode,
		ErrorMessage:   result.ErrorMessage,
	}

	if err := h.healthCheckRepo.Create(healthCheck); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save health check"})
		return
	}

	c.JSON(http.StatusOK, healthCheck)
}

