package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds security headers to all responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent clickjacking
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		
		// Prevent MIME type sniffing
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		
		// Enable XSS protection
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")
		
		// Strict Transport Security (HSTS) - only in production
		if c.GetHeader("X-Forwarded-Proto") == "https" || c.Request.TLS != nil {
			c.Writer.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		
		// Content Security Policy
		c.Writer.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';")
		
		// Referrer Policy
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Permissions Policy
		c.Writer.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		
		// PulseGrid identification headers
		c.Writer.Header().Set("X-Powered-By", "PulseGrid")
		c.Writer.Header().Set("X-API-Service", "PulseGrid Monitoring API")
		c.Writer.Header().Set("X-API-Version", "1.0.0")
		c.Writer.Header().Set("X-API-Docs", "https://pulsegrid.com/docs#api")
		
		c.Next()
	}
}





