package middleware

import (
	"encoding/json"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// JSONLogger provides structured JSON logging
func JSONLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logEntry := map[string]interface{}{
			"timestamp":   param.TimeStamp.Format(time.RFC3339),
			"status_code": param.StatusCode,
			"latency":     param.Latency.String(),
			"client_ip":   param.ClientIP,
			"method":      param.Method,
			"path":        param.Path,
			"user_agent":  param.Request.UserAgent(),
		}

		if param.ErrorMessage != "" {
			logEntry["error"] = param.ErrorMessage
		}

		if param.Request.Referer() != "" {
			logEntry["referer"] = param.Request.Referer()
		}

		// Add request ID if available
		if requestID := param.Request.Header.Get("X-Request-ID"); requestID != "" {
			logEntry["request_id"] = requestID
		}

		// Marshal to JSON
		jsonBytes, err := json.Marshal(logEntry)
		if err != nil {
			// Fallback to simple log if JSON marshaling fails
			return param.ErrorMessage + "\n"
		}

		// Write to stderr (standard for logs)
		os.Stderr.Write(jsonBytes)
		os.Stderr.WriteString("\n")

		// Return empty string since we're writing directly
		return ""
	})
}






