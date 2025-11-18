package handlers

import (
	"database/sql"
	"net/http"
	"strings"
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

// GetSystemMetrics returns system-wide metrics for Super Admin,
// or organization-scoped metrics for Organization Admin
// Standard Users cannot access this endpoint (requires admin role)
func (h *AdminHandler) GetSystemMetrics(c *gin.Context) {
	role, _ := c.Get("role")
	orgID, orgExists := c.Get("organization_id")
	
	isSuperAdmin := role == "super_admin" // Super Admin: all organizations
	// Organization Admin: their organization only
	
	var orgUUID *uuid.UUID
	
	// For admin role, filter by their organization
	if !isSuperAdmin && orgExists {
		if orgIDStr, ok := orgID.(string); ok && orgIDStr != "" {
			parsed, err := uuid.Parse(orgIDStr)
			if err == nil {
				orgUUID = &parsed
			}
		}
	}

	// Get total users
	var totalUsers int
	var userCountQuery string
	if isSuperAdmin {
		userCountQuery = `SELECT COUNT(*) FROM users`
		if err := h.userRepo.GetDB().QueryRow(userCountQuery).Scan(&totalUsers); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user count"})
			return
		}
	} else if orgUUID != nil {
		userCountQuery = `SELECT COUNT(*) FROM users WHERE organization_id = $1`
		if err := h.userRepo.GetDB().QueryRow(userCountQuery, orgUUID).Scan(&totalUsers); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user count"})
			return
		}
	} else {
		totalUsers = 0
	}

	// Get total organizations
	var totalOrgs int
	if isSuperAdmin {
		orgCountQuery := `SELECT COUNT(*) FROM organizations`
		if err := h.orgRepo.GetDB().QueryRow(orgCountQuery).Scan(&totalOrgs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch organization count"})
			return
		}
	} else {
		// Admin only sees their own organization
		totalOrgs = 1
	}

	// Get total services
	var totalServices int
	var serviceCountQuery string
	if isSuperAdmin {
		serviceCountQuery = `SELECT COUNT(*) FROM services`
		if err := h.serviceRepo.GetDB().QueryRow(serviceCountQuery).Scan(&totalServices); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service count"})
			return
		}
	} else if orgUUID != nil {
		serviceCountQuery = `SELECT COUNT(*) FROM services WHERE organization_id = $1`
		if err := h.serviceRepo.GetDB().QueryRow(serviceCountQuery, orgUUID).Scan(&totalServices); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service count"})
			return
		}
	} else {
		totalServices = 0
	}

	// Get active services
	var activeServices int
	if isSuperAdmin {
		activeServiceQuery := `SELECT COUNT(*) FROM services WHERE is_active = TRUE`
		if err := h.serviceRepo.GetDB().QueryRow(activeServiceQuery).Scan(&activeServices); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active service count"})
			return
		}
	} else if orgUUID != nil {
		activeServiceQuery := `SELECT COUNT(*) FROM services WHERE is_active = TRUE AND organization_id = $1`
		if err := h.serviceRepo.GetDB().QueryRow(activeServiceQuery, orgUUID).Scan(&activeServices); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active service count"})
			return
		}
	} else {
		activeServices = 0
	}

	// Get total health checks (filtered by organization services)
	var totalHealthChecks int
	if isSuperAdmin {
		healthCheckQuery := `SELECT COUNT(*) FROM health_checks`
		if err := h.healthCheckRepo.GetDB().QueryRow(healthCheckQuery).Scan(&totalHealthChecks); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch health check count"})
			return
		}
	} else if orgUUID != nil {
		healthCheckQuery := `
			SELECT COUNT(*) FROM health_checks hc
			INNER JOIN services s ON hc.service_id = s.id
			WHERE s.organization_id = $1
		`
		if err := h.healthCheckRepo.GetDB().QueryRow(healthCheckQuery, orgUUID).Scan(&totalHealthChecks); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch health check count"})
			return
		}
	} else {
		totalHealthChecks = 0
	}

	// Get total alerts (filtered by organization services)
	var totalAlerts int
	if isSuperAdmin {
		alertQuery := `SELECT COUNT(*) FROM alerts`
		if err := h.alertRepo.GetDB().QueryRow(alertQuery).Scan(&totalAlerts); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alert count"})
			return
		}
	} else if orgUUID != nil {
		alertQuery := `
			SELECT COUNT(*) FROM alerts a
			INNER JOIN services s ON a.service_id = s.id
			WHERE s.organization_id = $1
		`
		if err := h.alertRepo.GetDB().QueryRow(alertQuery, orgUUID).Scan(&totalAlerts); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alert count"})
			return
		}
	} else {
		totalAlerts = 0
	}

	// Get unresolved alerts (filtered by organization services)
	var unresolvedAlerts int
	if isSuperAdmin {
		unresolvedQuery := `SELECT COUNT(*) FROM alerts WHERE is_resolved = FALSE`
		if err := h.alertRepo.GetDB().QueryRow(unresolvedQuery).Scan(&unresolvedAlerts); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch unresolved alert count"})
			return
		}
	} else if orgUUID != nil {
		unresolvedQuery := `
			SELECT COUNT(*) FROM alerts a
			INNER JOIN services s ON a.service_id = s.id
			WHERE s.organization_id = $1 AND a.is_resolved = FALSE
		`
		if err := h.alertRepo.GetDB().QueryRow(unresolvedQuery, orgUUID).Scan(&unresolvedAlerts); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch unresolved alert count"})
			return
		}
	} else {
		unresolvedAlerts = 0
	}

	// Calculate system uptime (last 24 hours)
	since := time.Now().AddDate(0, 0, -1)
	var total, up int
	if isSuperAdmin {
		uptimeQuery := `
			SELECT 
				COUNT(*) as total,
				COUNT(CASE WHEN status = 'up' THEN 1 END) as up
			FROM health_checks
			WHERE checked_at >= $1
		`
		if err := h.healthCheckRepo.GetDB().QueryRow(uptimeQuery, since).Scan(&total, &up); err != nil && total > 0 {
			// Error handling
		}
	} else if orgUUID != nil {
		uptimeQuery := `
			SELECT 
				COUNT(*) as total,
				COUNT(CASE WHEN hc.status = 'up' THEN 1 END) as up
			FROM health_checks hc
			INNER JOIN services s ON hc.service_id = s.id
			WHERE s.organization_id = $1 AND hc.checked_at >= $2
		`
		if err := h.healthCheckRepo.GetDB().QueryRow(uptimeQuery, orgUUID, since).Scan(&total, &up); err != nil && total > 0 {
			// Error handling
		}
	}

	systemUptime := 0.0
	if total > 0 {
		systemUptime = (float64(up) / float64(total)) * 100
	}

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
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	role, _ := c.Get("role")
	orgID, orgExists := c.Get("organization_id")
	
	isSuperAdmin := role == "super_admin"
	
	var query string
	var rows *sql.Rows
	var err error
	
	if isSuperAdmin {
		// Super admin sees all users
		query = `
			SELECT id, email, name, role, organization_id, created_at, updated_at
			FROM users
			ORDER BY created_at DESC
		`
		rows, err = h.userRepo.GetDB().Query(query)
	} else if orgExists {
		// Admin sees only users in their organization
		orgIDStr, ok := orgID.(string)
		if !ok || orgIDStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
			return
		}
		orgUUID, err := uuid.Parse(orgIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
			return
		}
		query = `
			SELECT id, email, name, role, organization_id, created_at, updated_at
			FROM users
			WHERE organization_id = $1
			ORDER BY created_at DESC
		`
		rows, err = h.userRepo.GetDB().Query(query, orgUUID)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

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

	role, _ := c.Get("role")
	orgID, orgExists := c.Get("organization_id")
	isSuperAdmin := role == "super_admin"

	// Check if user exists
	_, err := h.userRepo.GetByEmail(req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Enforce organization boundaries
	var targetOrgID *uuid.UUID
	if req.OrgID != "" {
		// If org_id is provided, use it (super admin can specify any org)
		parsed, err := uuid.Parse(req.OrgID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
			return
		}
		targetOrgID = &parsed
	} else if !isSuperAdmin {
		// Organization admin must create users in their own organization
		// Use their organization_id if no org_id was provided
		if !orgExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID not found in token. Please log out and log back in to refresh your session."})
			return
		}
		orgIDStr, ok := orgID.(string)
		if !ok || orgIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID is required for organization admins. Please log out and log back in."})
			return
		}
		parsed, err := uuid.Parse(orgIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID in token. Please log out and log back in."})
			return
		}
		targetOrgID = &parsed
	} else if isSuperAdmin {
		// Super admin must provide org_id if they want to create a user in a specific org
		// For now, we'll allow super admin to create users without org (they can assign later)
		// But it's better to require org_id
		if req.OrgID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID is required"})
			return
		}
	}

	// Verify organization access (admin can only create in their org)
	if !isSuperAdmin && targetOrgID != nil && orgExists {
		orgIDStr, ok := orgID.(string)
		if ok && orgIDStr != "" {
			if orgIDStr != targetOrgID.String() {
				c.JSON(http.StatusForbidden, gin.H{"error": "You can only create users in your own organization"})
				return
			}
		}
	}

	// Ensure targetOrgID is set
	if targetOrgID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization ID is required"})
		return
	}

	// Prevent creating super_admin role (only promotion endpoint can do this)
	if req.Role == "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot create super_admin users. Use promotion endpoint instead."})
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
		OrganizationID: targetOrgID,
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
	role, _ := c.Get("role")
	orgID, orgExists := c.Get("organization_id")
	
	isSuperAdmin := role == "super_admin"
	
	var query string
	var rows *sql.Rows
	var err error
	
	if isSuperAdmin {
		// Super admin sees all organizations
		query = `SELECT id, name, slug, created_at, updated_at FROM organizations ORDER BY created_at DESC`
		rows, err = h.orgRepo.GetDB().Query(query)
	} else if orgExists {
		// Admin sees only their own organization
		orgIDStr, ok := orgID.(string)
		if !ok || orgIDStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
			return
		}
		orgUUID, err := uuid.Parse(orgIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
			return
		}
		query = `SELECT id, name, slug, created_at, updated_at FROM organizations WHERE id = $1`
		rows, err = h.orgRepo.GetDB().Query(query, orgUUID)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
		return
	}

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

type UpdateOrganizationRequest struct {
	Name string `json:"name"`
}

// UpdateOrganization updates an organization (Super Admin only, or Organization Admin for their own org)
func (h *AdminHandler) UpdateOrganization(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	var req UpdateOrganizationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role, _ := c.Get("role")
	orgID, orgExists := c.Get("organization_id")
	isSuperAdmin := role == "super_admin"

	// Get the organization
	org, err := h.orgRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	// Organization admins can only update their own organization
	if !isSuperAdmin {
		if !orgExists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Organization ID not found"})
			return
		}
		orgIDStr, ok := orgID.(string)
		if !ok || orgIDStr != id.String() {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own organization"})
			return
		}
	}

	// Update organization name if provided
	if req.Name != "" {
		org.Name = req.Name
		org.Slug = generateSlug(req.Name) // Regenerate slug
	}

	// Update in database
	updateQuery := `
		UPDATE organizations
		SET name = $2, slug = $3, updated_at = $4
		WHERE id = $1
	`
	_, err = h.orgRepo.GetDB().Exec(updateQuery, org.ID, org.Name, org.Slug, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update organization"})
		return
	}

	c.JSON(http.StatusOK, org)
}

// DeleteOrganization deletes an organization (Super Admin only)
// This will cascade delete all related users, services, health checks, and alerts
func (h *AdminHandler) DeleteOrganization(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid organization ID"})
		return
	}

	// Only super admin can delete organizations
	role, _ := c.Get("role")
	if role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only Super Admin can delete organizations"})
		return
	}

	// Check if organization exists
	_, err = h.orgRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
		return
	}

	// Get counts for informational purposes (CASCADE will handle deletion)
	userCountQuery := `SELECT COUNT(*) FROM users WHERE organization_id = $1`
	var userCount int
	h.userRepo.GetDB().QueryRow(userCountQuery, id).Scan(&userCount)

	serviceCountQuery := `SELECT COUNT(*) FROM services WHERE organization_id = $1`
	var serviceCount int
	h.serviceRepo.GetDB().QueryRow(serviceCountQuery, id).Scan(&serviceCount)

	// Delete organization (CASCADE will automatically delete related users, services, health checks, and alerts)
	deleteQuery := `DELETE FROM organizations WHERE id = $1`
	result, err := h.orgRepo.GetDB().Exec(deleteQuery, id)
	if err != nil {
		// Check for foreign key constraint errors
		if strings.Contains(err.Error(), "foreign key") || strings.Contains(err.Error(), "constraint") {
			c.JSON(http.StatusConflict, gin.H{
				"error": "Cannot delete organization due to database constraints. Please ensure all related data can be deleted.",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete organization",
			"details": err.Error(),
		})
		return
	}

	// Check if any rows were actually deleted
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Organization deleted successfully",
		"deleted_users": userCount,
		"deleted_services": serviceCount,
		"note": "All related users, services, health checks, and alerts have been automatically deleted.",
	})
}

// Helper function to generate slug (moved from repository)
func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	return slug
}

// PromoteToSuperAdmin promotes a user to Super Admin role (super_admin only)
// Super Admin: Controls the entire platform — all organizations, all users, all data
func (h *AdminHandler) PromoteToSuperAdmin(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the user to promote
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if already super_admin
	if user.Role == "super_admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is already a super admin"})
		return
	}

	// Update role to super_admin
	updateQuery := `UPDATE users SET role = $1, updated_at = $2 WHERE id = $3`
	_, err = h.userRepo.GetDB().Exec(updateQuery, "super_admin", time.Now(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to promote user"})
		return
	}

	user.Role = "super_admin"
	user.PasswordHash = ""
	c.JSON(http.StatusOK, gin.H{
		"message": "User promoted to super admin successfully",
		"user":    user,
	})
}

// DemoteFromSuperAdmin demotes a Super Admin to Organization Admin role (super_admin only)
// Prevents demoting the last super_admin (safeguard)
// Organization Admin: Manages everything inside their own organization only
func (h *AdminHandler) DemoteFromSuperAdmin(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the user to demote
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user is super_admin
	if user.Role != "super_admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not a super admin"})
		return
	}

	// Prevent demoting if this is the last super_admin
	superAdminCountQuery := `SELECT COUNT(*) FROM users WHERE role = 'super_admin'`
	var superAdminCount int
	if err := h.userRepo.GetDB().QueryRow(superAdminCountQuery).Scan(&superAdminCount); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check super admin count"})
		return
	}

	if superAdminCount <= 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot demote the last super admin. At least one super admin must exist."})
		return
	}

	// Determine new role: if user has organization, make them admin, otherwise user
	newRole := "user"
	if user.OrganizationID != nil {
		newRole = "admin"
	}

	// Update role
	updateQuery := `UPDATE users SET role = $1, updated_at = $2 WHERE id = $3`
	_, err = h.userRepo.GetDB().Exec(updateQuery, newRole, time.Now(), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to demote user"})
		return
	}

	user.Role = newRole
	user.PasswordHash = ""
	c.JSON(http.StatusOK, gin.H{
		"message": "User demoted from super admin successfully",
		"user":    user,
	})
}

