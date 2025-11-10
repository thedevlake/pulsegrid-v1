package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"pulsegrid/backend/internal/checker"
	"pulsegrid/backend/internal/config"
	"pulsegrid/backend/internal/database"
	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/notifier"
	"pulsegrid/backend/internal/repository"

	_ "github.com/lib/pq"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.NewConnection(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	serviceRepo := repository.NewServiceRepository(db)
	healthCheckRepo := repository.NewHealthCheckRepository(db)
	alertRepo := repository.NewAlertRepository(db)

	log.Println("Health Check Scheduler started")
	log.Println("Checking services every 10 seconds...")

	// Initialize notifier service
	notifierService := notifier.NewNotifierService(alertRepo)

	// Create ticker for periodic checks
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	// Run initial check
	runHealthChecks(serviceRepo, healthCheckRepo, alertRepo, db, notifierService)

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-ticker.C:
			runHealthChecks(serviceRepo, healthCheckRepo, alertRepo, db, notifierService)
		case <-sigChan:
			log.Println("Shutting down scheduler...")
			return
		}
	}
}

func runHealthChecks(
	serviceRepo *repository.ServiceRepository,
	healthCheckRepo *repository.HealthCheckRepository,
	alertRepo *repository.AlertRepository,
	db *sql.DB,
	notifierService *notifier.NotifierService,
) {
	// Get all active services
	services, err := serviceRepo.ListActive()
	if err != nil {
		log.Printf("Error fetching services: %v", err)
		return
	}

	if len(services) == 0 {
		return
	}

	log.Printf("Checking %d active services...", len(services))

	for _, service := range services {
		// Check if it's time to check this service
		lastCheck, err := getLastCheckTime(db, service.ID)
		if err == nil && lastCheck != nil {
			// Check if enough time has passed based on check_interval
			timeSinceLastCheck := time.Since(*lastCheck)
			interval := time.Duration(service.CheckInterval) * time.Second
			
			if timeSinceLastCheck < interval {
				// Not time yet, skip
				continue
			}
		}

		// Perform health check
		go performHealthCheck(service, healthCheckRepo, alertRepo, db, notifierService)
	}
}

func getLastCheckTime(db *sql.DB, serviceID interface{}) (*time.Time, error) {
	query := `
		SELECT checked_at
		FROM health_checks
		WHERE service_id = $1
		ORDER BY checked_at DESC
		LIMIT 1
	`

	var lastCheck time.Time
	err := db.QueryRow(query, serviceID).Scan(&lastCheck)
	if err != nil {
		return nil, err
	}

	return &lastCheck, nil
}

func performHealthCheck(
	service *models.Service,
	healthCheckRepo *repository.HealthCheckRepository,
	alertRepo *repository.AlertRepository,
	db *sql.DB,
	notifierService *notifier.NotifierService,
) {
	timeout := time.Duration(service.Timeout) * time.Second

	var result *checker.HealthCheckResult

	switch service.Type {
	case "http", "https":
		result = checker.CheckHTTP(service.URL, timeout, service.ExpectedStatusCode)
	case "tcp":
		result = checker.CheckTCP(service.URL, timeout)
	case "ping":
		result = checker.CheckPing(service.URL, timeout)
	default:
		result = &checker.HealthCheckResult{
			Status:       "down",
			ErrorMessage: stringPtr("Unknown service type"),
		}
	}

	// Save health check
	healthCheck := &models.HealthCheck{
		ServiceID:     service.ID,
		Status:        result.Status,
		ResponseTimeMs: result.ResponseTimeMs,
		StatusCode:    result.StatusCode,
		ErrorMessage:  result.ErrorMessage,
	}

	if err := healthCheckRepo.Create(healthCheck); err != nil {
		log.Printf("Error saving health check for service %s: %v", service.Name, err)
		return
	}

	if result.ResponseTimeMs != nil {
		log.Printf("✓ %s: %s (%dms)", service.Name, result.Status, *result.ResponseTimeMs)
	} else {
		log.Printf("✓ %s: %s", service.Name, result.Status)
	}

	// Check for alerts
	if result.Status == "down" {
		// Check if previous check was up (new downtime)
		prevCheck, _ := getLastHealthCheckBefore(db, service.ID, healthCheck.ID)
		if prevCheck == nil || prevCheck.Status == "up" {
			// Create alert
			alert := &models.Alert{
				ServiceID:  service.ID,
				Type:       "downtime",
				Message:    "Service is down: " + service.Name,
				Severity:   "high",
				IsResolved: false,
			}
			if result.ErrorMessage != nil {
				alert.Message += " - " + *result.ErrorMessage
			}
			alertRepo.Create(alert)
			log.Printf("⚠ Alert created for %s", service.Name)
			
			// Send notifications
			go func() {
				if err := notifierService.SendAlertNotifications(alert); err != nil {
					log.Printf("Error sending notifications: %v", err)
				}
			}()
		}
	}

	// Check for latency threshold breach
	if service.LatencyThresholdMs != nil && result.ResponseTimeMs != nil {
		if *result.ResponseTimeMs > *service.LatencyThresholdMs {
			// Check if we should create an alert (avoid spam - only if previous check was below threshold)
			prevCheck, _ := getLastHealthCheckBefore(db, service.ID, healthCheck.ID)
			shouldAlert := true
			if prevCheck != nil && prevCheck.ResponseTimeMs != nil {
				// Only alert if previous check was below threshold
				if *prevCheck.ResponseTimeMs > *service.LatencyThresholdMs {
					shouldAlert = false // Already above threshold, don't spam
				}
			}
			
			if shouldAlert {
				alert := &models.Alert{
					ServiceID:  service.ID,
					Type:       "latency",
					Message:    fmt.Sprintf("Service latency threshold breached: %s (Response time: %dms, Threshold: %dms)", service.Name, *result.ResponseTimeMs, *service.LatencyThresholdMs),
					Severity:   "medium",
					IsResolved: false,
				}
				alertRepo.Create(alert)
				log.Printf("⚠ Latency alert created for %s: %dms > %dms", service.Name, *result.ResponseTimeMs, *service.LatencyThresholdMs)
				
				// Send notifications
				go func() {
					if err := notifierService.SendAlertNotifications(alert); err != nil {
						log.Printf("Error sending notifications: %v", err)
					}
				}()
			}
		}
	}
}

func getLastHealthCheckBefore(db *sql.DB, serviceID interface{}, currentID interface{}) (*models.HealthCheck, error) {
	query := `
		SELECT id, status, response_time_ms
		FROM health_checks
		WHERE service_id = $1 AND id != $2
		ORDER BY checked_at DESC
		LIMIT 1
	`

	var check models.HealthCheck
	var responseTime sql.NullInt64
	err := db.QueryRow(query, serviceID, currentID).Scan(&check.ID, &check.Status, &responseTime)
	if err != nil {
		return nil, err
	}

	if responseTime.Valid {
		rt := int(responseTime.Int64)
		check.ResponseTimeMs = &rt
	}

	return &check, nil
}

func stringPtr(s string) *string {
	return &s
}

