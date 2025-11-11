package middleware

import (
	"github.com/gin-gonic/gin"
)

func CORS(origin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow localhost on any port for development
		requestOrigin := c.Request.Header.Get("Origin")
		if requestOrigin != "" && (requestOrigin == origin || 
			(requestOrigin[:17] == "http://localhost:" && origin[:17] == "http://localhost:")) {
			// Allow if exact match or both are localhost (any port)
			c.Writer.Header().Set("Access-Control-Allow-Origin", requestOrigin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		
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

