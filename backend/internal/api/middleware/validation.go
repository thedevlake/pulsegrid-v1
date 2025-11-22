package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// InputValidation provides basic input validation and sanitization
func InputValidation() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Validate and sanitize path parameters
		for _, param := range c.Params {
			if strings.Contains(param.Value, "<") || strings.Contains(param.Value, ">") {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Invalid characters in path parameter",
				})
				c.Abort()
				return
			}
		}

		// Validate query parameters
		for key, values := range c.Request.URL.Query() {
			for _, value := range values {
				if len(value) > 1000 { // Prevent extremely long query params
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Query parameter value too long",
					})
					c.Abort()
					return
				}
			}
			if len(key) > 100 {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Query parameter name too long",
				})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// ValidateContentType ensures Content-Type is set for POST/PUT/PATCH requests with bodies
func ValidateContentType() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			// Only validate Content-Type if we're absolutely certain there's a body
			// Content-Length > 0 is the only reliable indicator of a body
			// If Content-Length is 0, -1, or not set, skip validation
			contentLength := c.Request.ContentLength
			
			if contentLength > 0 {
				contentType := c.Request.Header.Get("Content-Type")
				if contentType == "" {
					c.JSON(http.StatusBadRequest, gin.H{
						"error": "Content-Type header is required",
					})
					c.Abort()
					return
				}
				// Allow JSON and form data
				if !strings.Contains(contentType, "application/json") &&
					!strings.Contains(contentType, "application/x-www-form-urlencoded") &&
					!strings.Contains(contentType, "multipart/form-data") {
					c.JSON(http.StatusUnsupportedMediaType, gin.H{
						"error": "Unsupported Content-Type",
					})
					c.Abort()
					return
				}
			}
			// If Content-Length is 0, -1, or not set, skip validation (no body or unknown)
		}
		c.Next()
	}
}



