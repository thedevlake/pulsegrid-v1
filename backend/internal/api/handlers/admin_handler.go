package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	userRepo         *repository.UserRepository
	orgRepo          *repository.OrganizationRepository
	serviceRepo      *repository.ServiceRepository
	healthCheckRepo  *repository.HealthCheckRepository
	alertRepo        *repository.AlertRepository
	cfg              *config.Config
}

func NewAdminHandler(
	userRepo *repository.UserRepository,
	orgRepo *repository.OrganizationRepository,
	serviceRepo *repository.ServiceRepository,
	healthCheckRepo *repository.HealthCheckRepository,
	alertRepo *repository.AlertRepository,
	cfg *config.Config,
) *AdminHandler {
	return &AdminHandler{
		userRepo:        userRepo,
		orgRepo:         orgRepo,
		serviceRepo:     serviceRepo,
		healthCheckRepo: healthCheckRepo,
		alertRepo:       alertRepo,
		cfg:             cfg,
	}
}

type SystemMetrics struct {
	TotalUsers         int     `json:"total_users"`
	TotalOrganizations int     `json:"total_organizations"`
	TotalServices      int     `json:"total_services"`
	ActiveServices     int     `json:"active_services"`
	TotalHealthChecks  int     `json:"total_health_checks"`
	TotalAlerts        int     `json:"total_alerts"`
	UnresolvedAlerts   int     `json:"unresolved_alerts"`
	SystemUptime       float64 `json:"system_uptime"`
}

type CreateUserRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=8"`
	Name       string `json:"name" binding:"required"`
	Role       string `json:"role" binding:"required,oneof=user admin"`
	OrgID      string `json:"org_id"`
}

type UpdateUserRequest struct {
	Name  string `json:"name"`
	Role  string `json:"role"`
	Email string `json:"email"`
}

func (h *AdminHandler) GetSystemMetrics(c *gin.Context) {
	// Get total users
	userCountQuery := `SELECT COUNT(*) FROM users`
	var totalUsers int
	if err := h.userRepo.GetDB().QueryRow(userCountQuery).Scan(&totalUsers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user count"})
		return
	}

	// Get total organizations
	orgCountQuery := `SELECT COUNT(*) FROM organizations`
	var totalOrgs int
	if err := h.orgRepo.GetDB().QueryRow(orgCountQuery).Scan(&totalOrgs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization count"})
		return
	}

	// Get total services
	serviceCountQuery := `SELECT COUNT(*) FROM services`
	var totalServices int
	if err := h.serviceRepo.GetDB().QueryRow(serviceCountQuery).Scan(&totalServices); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service count"})
		return
	}

	// Get active services
	activeServiceQuery := `SELECT COUNT(*) FROM services WHERE is_active = TRUE`
	var activeServices int
	if err := h.serviceRepo.GetDB().QueryRow(activeServiceQuery).Scan(&activeServices); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active service count"})
		return
	}

	// Get total health checks
	healthCheckQuery := `SELECT COUNT(*) FROM health_checks`
	var totalHealthChecks int
	if err := h.healthCheckRepo.GetDB().QueryRow(healthCheckQuery).Scan(&totalHealthChecks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch health check count"})
		return
	}

	// Get total alerts
	alertQuery := `SELECT COUNT(*) FROM alerts`
	var totalAlerts int
	if err := h.alertRepo.GetDB().QueryRow(alertQuery).Scan(&totalAlerts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alert count"})
		return
	}

	// Get unresolved alerts
	unresolvedQuery := `SELECT COUNT(*) FROM alerts WHERE is_resolved = FALSE`
	var unresolvedAlerts int
	if err := h.alertRepo.GetDB().QueryRow(unresolvedQuery).Scan(&unresolvedAlerts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch unresolved alert count"})
		return
	}

	// Calculate system uptime (last 24 hours)
	since := time.Now().AddDate(0, 0, -1)
	uptimeQuery := `
		SELECT 
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'up' THEN 1 END) as up
		FROM health_checks
		WHERE checked_at >= $1
	`
	var total, up int
	if err := h.healthCheckRepo.GetDB().QueryRow(uptimeQuery, since).Scan(&total, &up); err == nil && total > 0 {
		systemUptime := (float64(up) / float64(total)) * 100
		metrics := SystemMetrics{
			TotalUsers:         totalUsers,
			TotalOrganizations: totalOrgs,
			TotalServices:      totalServices,
			ActiveServices:     activeServices,
			TotalHealthChecks:  totalHealthChecks,
			TotalAlerts:        totalAlerts,
			UnresolvedAlerts:   unresolvedAlerts,
			SystemUptime:       systemUptime,
		}
		c.JSON(http.StatusOK, metrics)
		return
	}

	metrics := SystemMetrics{
		TotalUsers:         totalUsers,
		TotalOrganizations: totalOrgs,
		TotalServices:      totalServices,
		ActiveServices:     activeServices,
		TotalHealthChecks:  totalHealthChecks,
		TotalAlerts:        totalAlerts,
		UnresolvedAlerts:   unresolvedAlerts,
		SystemUptime:       0,
	}
	c.JSON(http.StatusOK, metrics)
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	query := `
		SELECT id, email, name, role, organization_id, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`

	rows, err := h.userRepo.GetDB().Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		var orgID sql.NullString

		err := rows.Scan(
			&user.ID, &user.Email, &user.Name, &user.Role,
			&orgID, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			continue
		}

		if orgID.Valid {
			id, _ := uuid.Parse(orgID.String)
			user.OrganizationID = &id
		}

		user.PasswordHash = "" // Don't send password hash
		users = append(users, user)
	}

	c.JSON(http.StatusOK, users)
}

func (h *AdminHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	_, err := h.userRepo.GetByEmail(req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
		Role:         req.Role,
	}

	if req.OrgID != "" {
		orgUUID, err := uuid.Parse(req.OrgID)
		if err == nil {
			user.OrganizationID = &orgUUID
		}
	}

	if err := h.userRepo.Create(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	user.PasswordHash = ""
	c.JSON(http.StatusCreated, user)
}

func (h *AdminHandler) UpdateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.Email != "" {
		user.Email = req.Email
	}

	// Update in database
	updateQuery := `
		UPDATE users
		SET name = $2, role = $3, email = $4, updated_at = $5
		WHERE id = $1
	`
	_, err = h.userRepo.GetDB().Exec(updateQuery, user.ID, user.Name, user.Role, user.Email, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	user.PasswordHash = ""
	c.JSON(http.StatusOK, user)
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	deleteQuery := `DELETE FROM users WHERE id = $1`
	_, err = h.userRepo.GetDB().Exec(deleteQuery, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func (h *AdminHandler) ListOrganizations(c *gin.Context) {
	query := `SELECT id, name, slug, created_at, updated_at FROM organizations ORDER BY created_at DESC`

	rows, err := h.orgRepo.GetDB().Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organizations"})
		return
	}
	defer rows.Close()

	var orgs []models.Organization
	for rows.Next() {
		var org models.Organization
		err := rows.Scan(&org.ID, &org.Name, &org.Slug, &org.CreatedAt, &org.UpdatedAt)
		if err != nil {
			continue
		}
		orgs = append(orgs, org)
	}

	c.JSON(http.StatusOK, orgs)
}

