package handlers

import (
	"net/http"
	"os"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/repository"
	"pulsegrid/backend/internal/scheduler"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ServiceHandler struct {
	serviceRepo *repository.ServiceRepository
	scheduler   *scheduler.Scheduler
	cfg         *config.Config
}

func NewServiceHandler(serviceRepo *repository.ServiceRepository, cfg *config.Config) *ServiceHandler {
	var sched *scheduler.Scheduler
	// Initialize scheduler if AWS credentials are available
	if cfg.AWS.AccessKeyID != "" && cfg.AWS.SecretAccessKey != "" {
		lambdaARN := getEnv("LAMBDA_FUNCTION_ARN", "")
		if lambdaARN != "" {
			var err error
			sched, err = scheduler.NewScheduler(serviceRepo.GetDB(), lambdaARN, "pulsegrid")
			if err != nil {
				// Log error but don't fail - scheduler is optional for local dev
				// log.Printf("Warning: Failed to initialize scheduler: %v", err)
			}
		}
	}

	return &ServiceHandler{
		serviceRepo: serviceRepo,
		scheduler:   sched,
		cfg:         cfg,
	}
}

type CreateServiceRequest struct {
	Name              string   `json:"name" binding:"required"`
	URL               string   `json:"url" binding:"required"`
	Type              string   `json:"type" binding:"required,oneof=http tcp ping"`
	CheckInterval     int      `json:"check_interval"`
	Timeout           int      `json:"timeout"`
	ExpectedStatusCode *int     `json:"expected_status_code"`
	LatencyThresholdMs *int     `json:"latency_threshold_ms"`
	Tags              []string `json:"tags"`
}

type UpdateServiceRequest struct {
	Name              string   `json:"name"`
	URL               string   `json:"url"`
	Type              string   `json:"type"`
	CheckInterval     int      `json:"check_interval"`
	Timeout           int      `json:"timeout"`
	ExpectedStatusCode *int     `json:"expected_status_code"`
	LatencyThresholdMs *int     `json:"latency_threshold_ms"`
	Tags              []string `json:"tags"`
	IsActive          *bool    `json:"is_active"`
}

// CreateService creates a new service (Organization Admin and Super Admin only)
// Standard Users cannot create services - they have read-only access
func (h *ServiceHandler) CreateService(c *gin.Context) {
	// Check role - only admin and super_admin can create services
	role, exists := c.Get("role")
	if !exists || (role != "admin" && role != "super_admin") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Organization Admin or Super Admin can create services"})
		return
	}

	var req CreateServiceRequest
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

	service := &models.Service{
		OrganizationID:    orgUUID,
		Name:              req.Name,
		URL:               req.URL,
		Type:              req.Type,
		CheckInterval:     req.CheckInterval,
		Timeout:           req.Timeout,
		ExpectedStatusCode: req.ExpectedStatusCode,
		LatencyThresholdMs: req.LatencyThresholdMs,
		Tags:              req.Tags,
		IsActive:          true,
	}

	if service.CheckInterval == 0 {
		service.CheckInterval = h.cfg.HealthCheck.Interval
	}
	if service.Timeout == 0 {
		service.Timeout = h.cfg.HealthCheck.Timeout
	}

	if err := h.serviceRepo.Create(service); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service"})
		return
	}

	// Schedule health checks if scheduler is available
	if h.scheduler != nil && service.IsActive {
		if err := h.scheduler.ScheduleService(service.ID.String(), service.CheckInterval); err != nil {
			// Log error but don't fail the request
			// log.Printf("Warning: Failed to schedule service %s: %v", service.ID, err)
		}
	}

	c.JSON(http.StatusCreated, service)
}

func (h *ServiceHandler) ListServices(c *gin.Context) {
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

	services, err := h.serviceRepo.ListByOrganization(orgUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
		return
	}

	// Ensure services is always an array, never null
	if services == nil {
		services = []*models.Service{}
	}

	c.JSON(http.StatusOK, services)
}

func (h *ServiceHandler) GetService(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	service, err := h.serviceRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	// Verify organization access
	orgID, _ := c.Get("organization_id")
	if service.OrganizationID.String() != orgID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(http.StatusOK, service)
}

// UpdateService updates an existing service (Organization Admin and Super Admin only)
// Standard Users cannot update services - they have read-only access
func (h *ServiceHandler) UpdateService(c *gin.Context) {
	// Check role - only admin and super_admin can update services
	role, exists := c.Get("role")
	if !exists || (role != "admin" && role != "super_admin") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Organization Admin or Super Admin can update services"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	service, err := h.serviceRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	// Verify organization access
	orgID, _ := c.Get("organization_id")
	if service.OrganizationID.String() != orgID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var req UpdateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	oldInterval := service.CheckInterval
	oldIsActive := service.IsActive

	// Update fields
	if req.Name != "" {
		service.Name = req.Name
	}
	if req.URL != "" {
		service.URL = req.URL
	}
	if req.Type != "" {
		service.Type = req.Type
	}
	if req.CheckInterval > 0 {
		service.CheckInterval = req.CheckInterval
	}
	if req.Timeout > 0 {
		service.Timeout = req.Timeout
	}
	if req.ExpectedStatusCode != nil {
		service.ExpectedStatusCode = req.ExpectedStatusCode
	}
	if req.LatencyThresholdMs != nil {
		service.LatencyThresholdMs = req.LatencyThresholdMs
	}
	if req.Tags != nil {
		service.Tags = req.Tags
	}
	if req.IsActive != nil {
		service.IsActive = *req.IsActive
	}

	if err := h.serviceRepo.Update(service); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service"})
		return
	}

	// Update scheduler if interval or active status changed
	if h.scheduler != nil {
		if oldIsActive != service.IsActive || oldInterval != service.CheckInterval {
			// Unschedule old rule
			if oldIsActive {
				h.scheduler.UnscheduleService(service.ID.String())
			}
			// Schedule new rule if active
			if service.IsActive {
				h.scheduler.ScheduleService(service.ID.String(), service.CheckInterval)
			}
		}
	}

	c.JSON(http.StatusOK, service)
}

// DeleteService deletes a service (Organization Admin and Super Admin only)
// Standard Users cannot delete services - they have read-only access
func (h *ServiceHandler) DeleteService(c *gin.Context) {
	// Check role - only admin and super_admin can delete services
	role, exists := c.Get("role")
	if !exists || (role != "admin" && role != "super_admin") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Organization Admin or Super Admin can delete services"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	service, err := h.serviceRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service not found"})
		return
	}

	// Verify organization access
	orgID, _ := c.Get("organization_id")
	if service.OrganizationID.String() != orgID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Unschedule before deleting
	if h.scheduler != nil {
		h.scheduler.UnscheduleService(service.ID.String())
	}

	if err := h.serviceRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service deleted successfully"})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
