package handlers

import (
	"log"
	"net/http"
	"time"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StatsHandler struct {
	serviceRepo     *repository.ServiceRepository
	healthCheckRepo *repository.HealthCheckRepository
	cfg             *config.Config
}

func NewStatsHandler(serviceRepo *repository.ServiceRepository, healthCheckRepo *repository.HealthCheckRepository, cfg *config.Config) *StatsHandler {
	return &StatsHandler{
		serviceRepo:     serviceRepo,
		healthCheckRepo: healthCheckRepo,
		cfg:             cfg,
	}
}

func (h *StatsHandler) GetServiceStats(c *gin.Context) {
	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	// Default to last 7 days
	since := time.Now().AddDate(0, 0, -7)
	if sinceStr := c.Query("since"); sinceStr != "" {
		if t, err := time.Parse(time.RFC3339, sinceStr); err == nil {
			since = t
		}
	}

	stats, err := h.healthCheckRepo.GetStatsByServiceID(serviceID, since)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}

	// Get service name
	service, err := h.serviceRepo.GetByID(serviceID)
	if err == nil {
		stats.ServiceName = service.Name
	}

	c.JSON(http.StatusOK, stats)
}

func (h *StatsHandler) GetOverview(c *gin.Context) {
	orgID, exists := c.Get("organization_id")
	if !exists || orgID == nil {
		log.Printf("GetOverview: No organization_id in context")
		// Return empty overview if no organization
		c.JSON(http.StatusOK, gin.H{
			"average_uptime": 0,
			"total_services": 0,
			"services":       []interface{}{},
		})
		return
	}

	orgIDStr, ok := orgID.(string)
	if !ok || orgIDStr == "" {
		log.Printf("GetOverview: Invalid organization_id type or empty: %v", orgID)
		// Return empty overview if organization ID is invalid
		c.JSON(http.StatusOK, gin.H{
			"average_uptime": 0,
			"total_services": 0,
			"services":       []interface{}{},
		})
		return
	}

	log.Printf("GetOverview: Parsing organization_id: %s", orgIDStr)
	orgUUID, err := uuid.Parse(orgIDStr)
	if err != nil {
		log.Printf("GetOverview: Failed to parse organization_id: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	services, err := h.serviceRepo.ListByOrganization(orgUUID)
	if err != nil {
		// Log the actual error for debugging
		log.Printf("Error fetching services for org %s: %v", orgUUID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch services",
			"details": err.Error(),
		})
		return
	}

	since := time.Now().AddDate(0, 0, -7)
	var totalUptime, totalServices float64
	allStats := make([]interface{}, 0) // Initialize as empty slice, not nil

	for _, service := range services {
		stats, err := h.healthCheckRepo.GetStatsByServiceID(service.ID, since)
		if err != nil {
			continue
		}
		stats.ServiceName = service.Name

		if stats.TotalChecks > 0 {
			totalUptime += stats.UptimePercent
			totalServices++
		}

		allStats = append(allStats, stats)
	}

	avgUptime := 0.0
	if totalServices > 0 {
		avgUptime = totalUptime / totalServices
	}

	c.JSON(http.StatusOK, gin.H{
		"average_uptime": avgUptime,
		"total_services": len(services),
		"services":       allStats, // allStats is initialized as empty slice, never nil
	})
}

