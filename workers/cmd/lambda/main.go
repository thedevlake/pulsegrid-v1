package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"pulsegrid/workers/internal/checker"
	"pulsegrid/workers/internal/database"
	"pulsegrid/workers/internal/models"
	"pulsegrid/workers/internal/notifier"

	"github.com/aws/aws-lambda-go/lambda"
	_ "github.com/lib/pq"
)

type Event struct {
	ServiceID string `json:"service_id"`
}

func handler(ctx context.Context, event Event) error {
	// Initialize database connection
	db, err := database.NewConnection()
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	// Get service
	service, err := getService(db, event.ServiceID)
	if err != nil {
		return fmt.Errorf("failed to get service: %w", err)
	}

	// Perform health check
	result := performHealthCheck(service)

	// Save health check result
	if err := saveHealthCheck(db, service.ID, result); err != nil {
		log.Printf("Failed to save health check: %v", err)
	}

	// Check if alert should be triggered
	if result.Status == "down" {
		// Get previous check
		prevCheck, _ := getLastHealthCheck(db, service.ID)
		
		// Only alert if previous check was up (new downtime)
		if prevCheck == nil || prevCheck.Status == "up" {
			if err := triggerAlert(db, service, result); err != nil {
				log.Printf("Failed to trigger alert: %v", err)
			}
		}
	} else if result.Status == "up" {
		// Check if we should resolve a previous alert
		prevCheck, _ := getLastHealthCheck(db, service.ID)
		if prevCheck != nil && prevCheck.Status == "down" {
			// Service recovered, could resolve alerts here
		}
	}

	return nil
}

func getService(db *sql.DB, serviceID string) (*models.Service, error) {
	query := `
		SELECT id, organization_id, name, url, type, check_interval, timeout, expected_status_code
		FROM services
		WHERE id = $1 AND is_active = TRUE
	`

	service := &models.Service{}
	var statusCode sql.NullInt64

	err := db.QueryRow(query, serviceID).Scan(
		&service.ID, &service.OrganizationID, &service.Name, &service.URL,
		&service.Type, &service.CheckInterval, &service.Timeout, &statusCode,
	)

	if err != nil {
		return nil, err
	}

	if statusCode.Valid {
		code := int(statusCode.Int64)
		service.ExpectedStatusCode = &code
	}

	return service, nil
}

func performHealthCheck(service *models.Service) *checker.HealthCheckResult {
	timeout := time.Duration(service.Timeout) * time.Second

	switch service.Type {
	case "http", "https":
		return checker.CheckHTTP(service.URL, timeout, service.ExpectedStatusCode)
	case "tcp":
		return checker.CheckTCP(service.URL, timeout)
	case "ping":
		return checker.CheckPing(service.URL, timeout)
	default:
		return &checker.HealthCheckResult{
			Status:       "down",
			ErrorMessage: fmt.Sprintf("Unknown service type: %s", service.Type),
		}
	}
}

func saveHealthCheck(db *sql.DB, serviceID string, result *checker.HealthCheckResult) error {
	query := `
		INSERT INTO health_checks (id, service_id, status, response_time_ms, status_code, error_message, checked_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
	`

	var statusCode *int
	if result.StatusCode != nil {
		code := *result.StatusCode
		statusCode = &code
	}

	_, err := db.Exec(
		query,
		serviceID, result.Status, result.ResponseTimeMs, statusCode,
		result.ErrorMessage, time.Now(),
	)

	return err
}

func getLastHealthCheck(db *sql.DB, serviceID string) (*checker.HealthCheckResult, error) {
	query := `
		SELECT status, response_time_ms, status_code, error_message
		FROM health_checks
		WHERE service_id = $1
		ORDER BY checked_at DESC
		LIMIT 1
	`

	var status string
	var responseTime, statusCode sql.NullInt64
	var errorMsg sql.NullString

	err := db.QueryRow(query, serviceID).Scan(&status, &responseTime, &statusCode, &errorMsg)
	if err != nil {
		return nil, err
	}

	result := &checker.HealthCheckResult{Status: status}
	if responseTime.Valid {
		rt := int(responseTime.Int64)
		result.ResponseTimeMs = &rt
	}
	if statusCode.Valid {
		sc := int(statusCode.Int64)
		result.StatusCode = &sc
	}
	if errorMsg.Valid {
		result.ErrorMessage = &errorMsg.String
	}

	return result, nil
}

func triggerAlert(db *sql.DB, service *models.Service, result *checker.HealthCheckResult) error {
	// Create alert record
	alertQuery := `
		INSERT INTO alerts (id, service_id, type, message, severity, is_resolved, created_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, FALSE, $5)
		RETURNING id
	`

	var alertID string
	message := fmt.Sprintf("Service %s is down: %s", service.Name, service.URL)
	if result.ErrorMessage != nil {
		message += fmt.Sprintf(" - %s", *result.ErrorMessage)
	}

	err := db.QueryRow(
		alertQuery, service.ID, "downtime", message, "high", time.Now(),
	).Scan(&alertID)

	if err != nil {
		return err
	}

	// Get alert subscriptions
	subsQuery := `
		SELECT channel, destination
		FROM alert_subscriptions
		WHERE organization_id = $1 AND (service_id = $2 OR service_id IS NULL) AND is_active = TRUE
	`

	rows, err := db.Query(subsQuery, service.OrganizationID, service.ID)
	if err != nil {
		return err
	}
	defer rows.Close()

	// Send notifications
	notifier := notifier.NewNotifier()
	for rows.Next() {
		var channel, destination string
		if err := rows.Scan(&channel, &destination); err != nil {
			continue
		}

		switch channel {
		case "email":
			notifier.SendEmail(destination, "Service Down Alert", message)
		case "sms":
			notifier.SendSMS(destination, message)
		case "slack":
			notifier.SendSlack(destination, message)
		}
	}

	return nil
}

func main() {
	lambda.Start(handler)
}

