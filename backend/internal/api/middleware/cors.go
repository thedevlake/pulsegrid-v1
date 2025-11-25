package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

func CORS(origin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		requestOrigin := c.Request.Header.Get("Origin")
		
		// Determine which origin to allow
		allowedOrigin := origin
		
		if requestOrigin != "" {
			// Allow localhost for development
			if len(requestOrigin) >= 17 && requestOrigin[:17] == "http://localhost:" {
				allowedOrigin = requestOrigin
			} else if strings.HasPrefix(requestOrigin, "http://") && strings.Contains(requestOrigin, ".s3-website.") {
				// Allow any S3 website endpoint (format: http://bucket-name.s3-website.region.amazonaws.com)
				// This is more permissive to handle S3 website hosting
				allowedOrigin = requestOrigin
			} else if requestOrigin == origin {
				// Exact match with configured origin
				allowedOrigin = requestOrigin
			}
		}
		
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

