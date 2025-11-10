package checker

import (
	"fmt"
	"net"
	"net/http"
	"time"
)

type HealthCheckResult struct {
	Status        string
	ResponseTimeMs *int
	StatusCode    *int
	ErrorMessage  *string
}

func CheckHTTP(url string, timeout time.Duration, expectedStatusCode *int) *HealthCheckResult {
	start := time.Now()
	
	client := &http.Client{
		Timeout: timeout,
	}

	resp, err := client.Get(url)
	responseTime := time.Since(start)
	responseTimeMs := int(responseTime.Milliseconds())

	if err != nil {
		errMsg := err.Error()
		return &HealthCheckResult{
			Status:        "down",
			ResponseTimeMs: &responseTimeMs,
			ErrorMessage:  &errMsg,
		}
	}
	defer resp.Body.Close()

	statusCode := resp.StatusCode

	if expectedStatusCode != nil && statusCode != *expectedStatusCode {
		errMsg := fmt.Sprintf("Expected status %d, got %d", *expectedStatusCode, statusCode)
		return &HealthCheckResult{
			Status:        "down",
			ResponseTimeMs: &responseTimeMs,
			StatusCode:    &statusCode,
			ErrorMessage:  &errMsg,
		}
	}

	if statusCode >= 200 && statusCode < 400 {
		return &HealthCheckResult{
			Status:        "up",
			ResponseTimeMs: &responseTimeMs,
			StatusCode:    &statusCode,
		}
	}

	errMsg := fmt.Sprintf("HTTP %d", statusCode)
	return &HealthCheckResult{
		Status:        "down",
		ResponseTimeMs: &responseTimeMs,
		StatusCode:    &statusCode,
		ErrorMessage:  &errMsg,
	}
}

func CheckTCP(url string, timeout time.Duration) *HealthCheckResult {
	start := time.Now()
	
	conn, err := net.DialTimeout("tcp", url, timeout)
	responseTime := time.Since(start)
	responseTimeMs := int(responseTime.Milliseconds())

	if err != nil {
		errMsg := err.Error()
		return &HealthCheckResult{
			Status:        "down",
			ResponseTimeMs: &responseTimeMs,
			ErrorMessage:  &errMsg,
		}
	}
	defer conn.Close()

	return &HealthCheckResult{
		Status:        "up",
		ResponseTimeMs: &responseTimeMs,
	}
}

func CheckPing(url string, timeout time.Duration) *HealthCheckResult {
	// For ping, we'll use TCP as a fallback since ICMP requires root
	return CheckTCP(url, timeout)
}

