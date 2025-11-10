package scheduler

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/eventbridge"
	_ "github.com/lib/pq"
)

type Scheduler struct {
	db           *sql.DB
	eventBridge  *eventbridge.EventBridge
	lambdaARN    string
	rulePrefix   string
}

func NewScheduler(db *sql.DB, lambdaARN, rulePrefix string) (*Scheduler, error) {
	sess := session.Must(session.NewSession())
	
	return &Scheduler{
		db:          db,
		eventBridge: eventbridge.New(sess),
		lambdaARN:   lambdaARN,
		rulePrefix:  rulePrefix,
	}, nil
}

// ScheduleService creates an EventBridge rule for a service
func (s *Scheduler) ScheduleService(serviceID string, intervalSeconds int) error {
	ruleName := fmt.Sprintf("%s-service-%s", s.rulePrefix, serviceID)
	
	// Calculate rate expression (e.g., "rate(60 seconds)")
	rateExpression := fmt.Sprintf("rate(%d seconds)", intervalSeconds)
	
	// Create EventBridge rule
	_, err := s.eventBridge.PutRule(&eventbridge.PutRuleInput{
		Name:               aws.String(ruleName),
		ScheduleExpression: aws.String(rateExpression),
		State:              aws.String("ENABLED"),
		Description:        aws.String(fmt.Sprintf("Health check for service %s", serviceID)),
	})
	if err != nil {
		return fmt.Errorf("failed to create rule: %w", err)
	}

	// Add Lambda as target
	eventPayload, _ := json.Marshal(map[string]string{
		"service_id": serviceID,
	})

	_, err = s.eventBridge.PutTargets(&eventbridge.PutTargetsInput{
		Rule: aws.String(ruleName),
		Targets: []*eventbridge.Target{
			{
				Id:    aws.String(fmt.Sprintf("target-%s", serviceID)),
				Arn:   aws.String(s.lambdaARN),
				Input: aws.String(string(eventPayload)),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to add target: %w", err)
	}

	log.Printf("Scheduled service %s with interval %d seconds", serviceID, intervalSeconds)
	return nil
}

// UnscheduleService removes the EventBridge rule for a service
func (s *Scheduler) UnscheduleService(serviceID string) error {
	ruleName := fmt.Sprintf("%s-service-%s", s.rulePrefix, serviceID)
	
	// Remove targets first
	_, err := s.eventBridge.RemoveTargets(&eventbridge.RemoveTargetsInput{
		Rule: aws.String(ruleName),
		Ids:  []*string{aws.String(fmt.Sprintf("target-%s", serviceID))},
	})
	if err != nil {
		log.Printf("Warning: Failed to remove targets: %v", err)
	}

	// Delete rule
	_, err = s.eventBridge.DeleteRule(&eventbridge.DeleteRuleInput{
		Name: aws.String(ruleName),
	})
	if err != nil {
		return fmt.Errorf("failed to delete rule: %w", err)
	}

	log.Printf("Unscheduled service %s", serviceID)
	return nil
}

// SyncAllServices schedules all active services
func (s *Scheduler) SyncAllServices() error {
	query := `
		SELECT id, check_interval
		FROM services
		WHERE is_active = TRUE
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return fmt.Errorf("failed to query services: %w", err)
	}
	defer rows.Close()

	var serviceID string
	var interval int
	for rows.Next() {
		if err := rows.Scan(&serviceID, &interval); err != nil {
			continue
		}

		// Ensure minimum interval of 10 seconds
		if interval < 10 {
			interval = 10
		}

		if err := s.ScheduleService(serviceID, interval); err != nil {
			log.Printf("Failed to schedule service %s: %v", serviceID, err)
			continue
		}
	}

	return nil
}

// StartPeriodicSync runs SyncAllServices periodically
func (s *Scheduler) StartPeriodicSync(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Run immediately
	if err := s.SyncAllServices(); err != nil {
		log.Printf("Initial sync failed: %v", err)
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := s.SyncAllServices(); err != nil {
				log.Printf("Periodic sync failed: %v", err)
			}
		}
	}
}

