package notifier

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
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
	// SMTP configuration for local development
	smtpHost      string
	smtpPort      string
	smtpUser      string
	smtpPassword  string
	smtpFromEmail string
	useSMTP       bool
	useConsoleLog bool
}

func NewNotifierService(alertRepo *repository.AlertRepository) *NotifierService {
	sess := session.Must(session.NewSession())

	// Check if SMTP is configured
	smtpHost := getEnv("SMTP_HOST", "")
	smtpPort := getEnv("SMTP_PORT", "587")
	smtpUser := getEnv("SMTP_USER", "")
	smtpPassword := getEnv("SMTP_PASSWORD", "")
	smtpFromEmail := getEnv("SMTP_FROM_EMAIL", getEnv("SES_FROM_EMAIL", "noreply@pulsegrid.com"))
	useSMTP := smtpHost != "" && smtpUser != "" && smtpPassword != ""

	// Use console logging if neither AWS SES nor SMTP is configured
	useConsoleLog := !useSMTP && (getEnv("AWS_ACCESS_KEY_ID", "") == "" || getEnv("AWS_SECRET_ACCESS_KEY", "") == "")

	if useConsoleLog {
		log.Println("📧 Email notifications will be logged to console (no AWS SES or SMTP configured)")
	} else if useSMTP {
		log.Printf("📧 Email notifications configured via SMTP: %s:%s", smtpHost, smtpPort)
	} else {
		log.Println("📧 Email notifications configured via AWS SES")
	}

	return &NotifierService{
		alertRepo:     alertRepo,
		sesClient:     ses.New(sess),
		snsClient:     sns.New(sess),
		fromEmail:     getEnv("SES_FROM_EMAIL", "noreply@pulsegrid.com"),
		topicARN:      getEnv("SNS_TOPIC_ARN", ""),
		smtpHost:      smtpHost,
		smtpPort:      smtpPort,
		smtpUser:      smtpUser,
		smtpPassword:  smtpPassword,
		smtpFromEmail: smtpFromEmail,
		useSMTP:       useSMTP,
		useConsoleLog: useConsoleLog,
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
	// Try SMTP first (for local development)
	if ns.useSMTP {
		if err := ns.sendEmailSMTP(to, subject, body); err == nil {
			log.Printf("✅ Email sent via SMTP to %s", to)
			return
		} else {
			log.Printf("⚠️ SMTP failed, trying fallback: %v", err)
		}
	}

	// Try AWS SES if configured
	if ns.sesClient != nil && ns.fromEmail != "" && getEnv("AWS_ACCESS_KEY_ID", "") != "" {
		if err := ns.sendEmailSES(to, subject, body); err == nil {
			log.Printf("✅ Email sent via AWS SES to %s", to)
			return
		} else {
			log.Printf("⚠️ AWS SES failed: %v", err)
		}
	}

	// Fallback to console logging for development
	if ns.useConsoleLog || (ns.sesClient == nil && !ns.useSMTP) {
		ns.sendEmailConsole(to, subject, body)
		return
	}

	log.Printf("❌ Failed to send email to %s: No email service configured", to)
}

func (ns *NotifierService) sendEmailSES(to, subject, body string) error {
	if ns.sesClient == nil {
		return fmt.Errorf("SES client not initialized")
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
	return err
}

func (ns *NotifierService) sendEmailSMTP(to, subject, body string) error {
	if ns.smtpHost == "" || ns.smtpUser == "" || ns.smtpPassword == "" {
		return fmt.Errorf("SMTP not configured")
	}

	// Setup authentication
	auth := smtp.PlainAuth("", ns.smtpUser, ns.smtpPassword, ns.smtpHost)

	// Create email message
	msg := []byte(fmt.Sprintf("To: %s\r\n", to) +
		fmt.Sprintf("From: %s\r\n", ns.smtpFromEmail) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"\r\n" +
		body + "\r\n")

	// Send email
	addr := fmt.Sprintf("%s:%s", ns.smtpHost, ns.smtpPort)
	err := smtp.SendMail(addr, auth, ns.smtpFromEmail, []string{to}, msg)
	return err
}

func (ns *NotifierService) sendEmailConsole(to, subject, body string) {
	// Format email for console output
	emailContent := fmt.Sprintf(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL NOTIFICATION (Console Mode - No email service configured)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To:      %s
From:    %s
Subject: %s

%s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, to, ns.smtpFromEmail, subject, body)

	log.Print(emailContent)
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
		"text":       message,
		"username":   "PulseGrid",
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

// SendCustomEmail sends a custom email without creating an alert record (e.g., subscription confirmation)
func (ns *NotifierService) SendCustomEmail(to, subject, body string) error {
	if to == "" {
		return fmt.Errorf("email destination is required")
	}
	ns.sendEmail(to, subject, body)
	return nil
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
