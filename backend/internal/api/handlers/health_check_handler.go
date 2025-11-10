package handlers

import (
	"net/http"
	"strconv"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HealthCheckHandler struct {
	healthCheckRepo *repository.HealthCheckRepository
	cfg             *config.Config
}

func NewHealthCheckHandler(healthCheckRepo *repository.HealthCheckRepository, cfg *config.Config) *HealthCheckHandler {
	return &HealthCheckHandler{
		healthCheckRepo: healthCheckRepo,
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

