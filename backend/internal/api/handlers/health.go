package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthCheck provides basic health status
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "pulsegrid-api",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// DetailedHealthCheck provides comprehensive health information including database status
func DetailedHealthCheck(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		health := gin.H{
			"status":    "healthy",
			"service":   "pulsegrid-api",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"version":   "1.0.0",
		}

		// Check database connectivity
		ctx := c.Request.Context()
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()

		if err := db.PingContext(ctx); err != nil {
			health["status"] = "degraded"
			health["database"] = gin.H{
				"status": "unhealthy",
				"error":  err.Error(),
			}
			c.JSON(http.StatusServiceUnavailable, health)
			return
		}

		// Get database stats
		var dbStats sql.DBStats
		dbStats = db.Stats()
		health["database"] = gin.H{
			"status":           "healthy",
			"open_connections": dbStats.OpenConnections,
			"in_use":           dbStats.InUse,
			"idle":             dbStats.Idle,
		}

		c.JSON(http.StatusOK, health)
	}
}

