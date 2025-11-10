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
	elapsed := int(time.Since(start).Milliseconds())

	if err != nil {
		msg := err.Error()
		return &HealthCheckResult{
			Status:        "down",
			ResponseTimeMs: &elapsed,
			ErrorMessage:  &msg,
		}
	}
	defer resp.Body.Close()

	status := "up"
	if expectedStatusCode != nil && resp.StatusCode != *expectedStatusCode {
		status = "down"
		msg := fmt.Sprintf("Expected status %d, got %d", *expectedStatusCode, resp.StatusCode)
		return &HealthCheckResult{
			Status:        status,
			ResponseTimeMs: &elapsed,
			StatusCode:    &resp.StatusCode,
			ErrorMessage:  &msg,
		}
	}

	return &HealthCheckResult{
		Status:        status,
		ResponseTimeMs: &elapsed,
		StatusCode:    &resp.StatusCode,
	}
}

func CheckTCP(url string, timeout time.Duration) *HealthCheckResult {
	start := time.Now()
	conn, err := net.DialTimeout("tcp", url, timeout)
	elapsed := int(time.Since(start).Milliseconds())

	if err != nil {
		msg := err.Error()
		return &HealthCheckResult{
			Status:        "down",
			ResponseTimeMs: &elapsed,
			ErrorMessage:  &msg,
		}
	}
	defer conn.Close()

	return &HealthCheckResult{
		Status:        "up",
		ResponseTimeMs: &elapsed,
	}
}

func CheckPing(url string, timeout time.Duration) *HealthCheckResult {
	// Simple ICMP ping simulation using TCP connection
	// For production, consider using a proper ICMP library
	return CheckTCP(url, timeout)
}

