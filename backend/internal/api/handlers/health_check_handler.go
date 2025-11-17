package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"pulsegrid/backend/internal/checker"
	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/notifier"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HealthCheckHandler struct {
	healthCheckRepo *repository.HealthCheckRepository
	serviceRepo     *repository.ServiceRepository
	alertRepo       *repository.AlertRepository
	notifier        *notifier.NotifierService
	cfg             *config.Config
}

func NewHealthCheckHandler(
	healthCheckRepo *repository.HealthCheckRepository,
	serviceRepo *repository.ServiceRepository,
	alertRepo *repository.AlertRepository,
	notifierService *notifier.NotifierService,
	cfg *config.Config,
) *HealthCheckHandler {
	return &HealthCheckHandler{
		healthCheckRepo: healthCheckRepo,
		serviceRepo:     serviceRepo,
		alertRepo:       alertRepo,
		notifier:        notifierService,
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

	// Evaluate alert conditions similar to scheduler (manual checks should also notify)
	prevCheck, err := h.healthCheckRepo.GetPreviousCheckBefore(service.ID, healthCheck.CheckedAt)
	if err != nil {
		log.Printf("Failed to fetch previous health check: %v", err)
	}

	h.evaluateAlerts(service, healthCheck, prevCheck)

	c.JSON(http.StatusOK, healthCheck)
}

func (h *HealthCheckHandler) evaluateAlerts(service *models.Service, currentCheck *models.HealthCheck, prevCheck *models.HealthCheck) {
	// Downtime alert
	if currentCheck.Status == "down" {
		shouldAlert := prevCheck == nil || prevCheck.Status == "up"
		if shouldAlert {
			alert := &models.Alert{
				ServiceID:  service.ID,
				Type:       "downtime",
				Message:    buildDowntimeMessage(service.Name, currentCheck.ErrorMessage),
				Severity:   "high",
				IsResolved: false,
			}

			if err := h.alertRepo.Create(alert); err != nil {
				log.Printf("Failed to create downtime alert: %v", err)
			} else {
				h.dispatchAlert(alert)
			}
		}
	}

	// Latency alert
	if service.LatencyThresholdMs != nil && currentCheck.ResponseTimeMs != nil {
		if *currentCheck.ResponseTimeMs > *service.LatencyThresholdMs {
			shouldAlert := true
			if prevCheck != nil && prevCheck.ResponseTimeMs != nil {
				if *prevCheck.ResponseTimeMs > *service.LatencyThresholdMs {
					shouldAlert = false
				}
			}

			if shouldAlert {
				alert := &models.Alert{
					ServiceID:  service.ID,
					Type:       "latency",
					Message:    fmt.Sprintf("Service latency threshold breached: %s (Response time: %dms, Threshold: %dms)", service.Name, *currentCheck.ResponseTimeMs, *service.LatencyThresholdMs),
					Severity:   "medium",
					IsResolved: false,
				}
				if err := h.alertRepo.Create(alert); err != nil {
					log.Printf("Failed to create latency alert: %v", err)
				} else {
					h.dispatchAlert(alert)
				}
			}
		}
	}
}

func (h *HealthCheckHandler) dispatchAlert(alert *models.Alert) {
	if h.notifier == nil {
		return
	}

	go func() {
		if err := h.notifier.SendAlertNotifications(alert); err != nil {
			log.Printf("Error sending alert notifications: %v", err)
		}
	}()
}

func buildDowntimeMessage(serviceName string, errorMessage *string) string {
	message := "Service is down: " + serviceName
	if errorMessage != nil {
		message += " - " + *errorMessage
	}
	return message
}
