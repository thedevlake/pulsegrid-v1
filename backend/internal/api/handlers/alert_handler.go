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

type AlertHandler struct {
	alertRepo *repository.AlertRepository
	cfg       *config.Config
}

func NewAlertHandler(alertRepo *repository.AlertRepository, cfg *config.Config) *AlertHandler {
	return &AlertHandler{
		alertRepo: alertRepo,
		cfg:       cfg,
	}
}

type CreateSubscriptionRequest struct {
	ServiceID   *uuid.UUID `json:"service_id"`
	Channel     string     `json:"channel" binding:"required,oneof=email sms slack"`
	Destination string     `json:"destination" binding:"required"`
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

	sub := &models.AlertSubscription{
		OrganizationID: orgUUID,
		ServiceID:      req.ServiceID,
		Channel:        req.Channel,
		Destination:    req.Destination,
		IsActive:       true,
	}

	if err := h.alertRepo.CreateSubscription(sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription"})
		return
	}

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

