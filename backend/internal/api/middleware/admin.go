package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AdminMiddleware allows both Organization Admin (admin) and Super Admin (super_admin) roles
// - Organization Admin: Manages everything within their own organization
// - Super Admin: Controls the entire platform — all organizations, all users, all data
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found in token"})
			c.Abort()
			return
		}

		if role != "admin" && role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// SuperAdminMiddleware allows only Super Admin (super_admin) role
// Super Admin: Controls the entire platform — all organizations, all users, all data
// This middleware is used for endpoints that require platform-wide access
func SuperAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found in token"})
			c.Abort()
			return
		}

		if role != "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Super admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

