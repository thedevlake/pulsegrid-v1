package notifier

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"pulsegrid/backend/internal/models"
	"pulsegrid/backend/internal/repository"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/aws/aws-sdk-go/service/sns"
)

// NotifierService handles sending notifications for alerts
type NotifierService struct {
	alertRepo *repository.AlertRepository
	sesClient *ses.SES
	snsClient *sns.SNS
	fromEmail string
	topicARN  string
}

func NewNotifierService(alertRepo *repository.AlertRepository) *NotifierService {
	sess := session.Must(session.NewSession())
	
	return &NotifierService{
		alertRepo: alertRepo,
		sesClient: ses.New(sess),
		snsClient: sns.New(sess),
		fromEmail: getEnv("SES_FROM_EMAIL", "noreply@pulsegrid.com"),
		topicARN:  getEnv("SNS_TOPIC_ARN", ""),
	}
}

// SendAlertNotifications sends notifications for an alert to all relevant subscriptions
func (ns *NotifierService) SendAlertNotifications(alert *models.Alert) error {
	// Get subscriptions for this service (or all services if service_id is null)
	subscriptions, err := ns.alertRepo.GetSubscriptionsByService(alert.ServiceID)
	if err != nil {
		log.Printf("Error fetching subscriptions: %v", err)
		return err
	}

	if len(subscriptions) == 0 {
		log.Printf("No subscriptions found for alert %s", alert.ID)
		return nil
	}

	// Send notification to each subscription
	for _, sub := range subscriptions {
		if !sub.IsActive {
			continue
		}

		message := formatAlertMessage(alert)

		switch sub.Channel {
		case "email":
			ns.sendEmail(sub.Destination, "PulseGrid Alert: "+alert.Message, message)
		case "sms":
			ns.sendSMS(sub.Destination, message)
		case "slack":
			ns.sendSlack(sub.Destination, message)
		default:
			log.Printf("Unknown channel type: %s", sub.Channel)
		}
	}

	return nil
}

func (ns *NotifierService) sendEmail(to, subject, body string) {
	if ns.sesClient == nil {
		log.Printf("SES client not initialized, skipping email to %s", to)
		return
	}

	input := &ses.SendEmailInput{
		Source: aws.String(ns.fromEmail),
		Destination: &ses.Destination{
			ToAddresses: []*string{aws.String(to)},
		},
		Message: &ses.Message{
			Subject: &ses.Content{
				Data: aws.String(subject),
			},
			Body: &ses.Body{
				Text: &ses.Content{
					Data: aws.String(body),
				},
			},
		},
	}

	_, err := ns.sesClient.SendEmail(input)
	if err != nil {
		log.Printf("Failed to send email: %v", err)
	}
}

func (ns *NotifierService) sendSMS(phoneNumber, message string) {
	if ns.snsClient == nil {
		log.Printf("SNS client not initialized, skipping SMS to %s", phoneNumber)
		return
	}

	if ns.topicARN != "" {
		_, err := ns.snsClient.Publish(&sns.PublishInput{
			TopicArn: aws.String(ns.topicARN),
			Message:  aws.String(message),
			Subject:  aws.String("PulseGrid Alert"),
			MessageAttributes: map[string]*sns.MessageAttributeValue{
				"phone": {
					DataType:    aws.String("String"),
					StringValue: aws.String(phoneNumber),
				},
			},
		})
		if err != nil {
			log.Printf("Failed to send SMS via SNS: %v", err)
		} else {
			log.Printf("SMS sent to %s via SNS", phoneNumber)
		}
		return
	}

	log.Printf("SMS notification to %s: %s", phoneNumber, message)
}

func (ns *NotifierService) sendSlack(webhookURL, message string) {
	payload := map[string]interface{}{
		"text":      message,
		"username":  "PulseGrid",
		"icon_emoji": ":warning:",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Failed to marshal Slack payload: %v", err)
		return
	}

	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Failed to send Slack notification: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Slack webhook returned status %d", resp.StatusCode)
		return
	}

	log.Printf("Slack notification sent successfully")
}

func formatAlertMessage(alert *models.Alert) string {
	severity := "⚠️"
	switch alert.Severity {
	case "critical":
		severity = "🔴 CRITICAL"
	case "high":
		severity = "🟠 HIGH"
	case "medium":
		severity = "🟡 MEDIUM"
	case "low":
		severity = "🔵 LOW"
	}

	return severity + " Alert: " + alert.Message
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

