package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/notifier"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AlertHandler struct {
	alertRepo   *repository.AlertRepository
	serviceRepo *repository.ServiceRepository
	notifier    *notifier.NotifierService
	cfg         *config.Config
}

func NewAlertHandler(alertRepo *repository.AlertRepository, serviceRepo *repository.ServiceRepository, notifierService *notifier.NotifierService, cfg *config.Config) *AlertHandler {
	return &AlertHandler{
		alertRepo:   alertRepo,
		serviceRepo: serviceRepo,
		notifier:    notifierService,
		cfg:         cfg,
	}
}

type CreateSubscriptionRequest struct {
	ServiceID   *string `json:"service_id"`
	Destination string  `json:"destination" binding:"required,email"`
}

func (h *AlertHandler) ListAlerts(c *gin.Context) {
	orgID, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	orgUUID, err := uuid.Parse(orgID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 200 {
			limit = l
		}
	}

	alerts, err := h.alertRepo.ListByOrganization(orgUUID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alerts"})
		return
	}

	// Ensure alerts is always an array, never null
	if alerts == nil {
		alerts = []*models.Alert{}
	}

	c.JSON(http.StatusOK, alerts)
}

func (h *AlertHandler) GetAlert(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	alert, err := h.alertRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	c.JSON(http.StatusOK, alert)
}

func (h *AlertHandler) ResolveAlert(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	if err := h.alertRepo.Resolve(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resolve alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert resolved successfully"})
}

func (h *AlertHandler) CreateSubscription(c *gin.Context) {
	var req CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	orgID, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	orgUUID, err := uuid.Parse(orgID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var serviceUUID *uuid.UUID
	if req.ServiceID != nil && *req.ServiceID != "" {
		id, err := uuid.Parse(*req.ServiceID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
			return
		}
		serviceUUID = &id
	}

	sub := &models.AlertSubscription{
		OrganizationID: orgUUID,
		ServiceID:      serviceUUID,
		Channel:        "email",
		Destination:    req.Destination,
		IsActive:       true,
	}

	if err := h.alertRepo.CreateSubscription(sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription"})
		return
	}

	go h.sendSubscriptionConfirmation(sub)

	c.JSON(http.StatusCreated, sub)
}

func (h *AlertHandler) ListSubscriptions(c *gin.Context) {
	orgID, exists := c.Get("organization_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

	orgUUID, err := uuid.Parse(orgID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	subscriptions, err := h.alertRepo.GetSubscriptionsByOrganization(orgUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch subscriptions"})
		return
	}

	c.JSON(http.StatusOK, subscriptions)
}

func (h *AlertHandler) DeleteSubscription(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription ID"})
		return
	}

	if err := h.alertRepo.DeleteSubscription(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Subscription deleted successfully"})
}

func (h *AlertHandler) sendSubscriptionConfirmation(sub *models.AlertSubscription) {
	if h.notifier == nil {
		return
	}

	scope := "all services"
	if sub.ServiceID != nil && h.serviceRepo != nil {
		if service, err := h.serviceRepo.GetByID(*sub.ServiceID); err == nil {
			scope = fmt.Sprintf("service \"%s\"", service.Name)
		} else {
			scope = "the selected service"
		}
	}

	subject := "PulseGrid Alerts: Subscription Confirmed"
	body := fmt.Sprintf(`You’re all set! This email address (%s) will now receive PulseGrid alert notifications for %s.

To trigger a test alert, you can run a manual health check on a service that’s intentionally down or has a low latency threshold.

If this wasn’t you, please delete the subscription from the Alert Subscriptions page.`, sub.Destination, scope)

	if err := h.notifier.SendCustomEmail(sub.Destination, subject, body); err != nil {
		log.Printf("Failed to send subscription confirmation: %v", err)
	}
}
