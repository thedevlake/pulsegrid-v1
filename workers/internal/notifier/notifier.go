package notifier

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/aws/aws-sdk-go/service/sns"
)

type Notifier struct {
	sesClient *ses.SES
	snsClient *sns.SNS
	fromEmail string
	topicARN  string
}

func NewNotifier() *Notifier {
	sess := session.Must(session.NewSession())

	return &Notifier{
		sesClient: ses.New(sess),
		snsClient: sns.New(sess),
		fromEmail: getEnv("SES_FROM_EMAIL", "noreply@pulsegrid.com"),
		topicARN:  getEnv("SNS_TOPIC_ARN", ""),
	}
}

func (n *Notifier) SendEmail(to, subject, body string) {
	if n.sesClient == nil {
		log.Printf("SES client not initialized, skipping email to %s", to)
		return
	}

	input := &ses.SendEmailInput{
		Source: aws.String(n.fromEmail),
		Destination: &ses.Destination{
			ToAddresses: []*string{aws.String(to)},
		},
		Message: &ses.Message{
			Subject: &ses.Content{
				Data: aws.String(subject),
			},
			Body: &ses.Content{
				Text: &ses.Content{
					Data: aws.String(body),
				},
			},
		},
	}

	_, err := n.sesClient.SendEmail(input)
	if err != nil {
		log.Printf("Failed to send email: %v", err)
	}
}

func (n *Notifier) SendSMS(phoneNumber, message string) {
	if n.snsClient == nil {
		log.Printf("SNS client not initialized, skipping SMS to %s", phoneNumber)
		return
	}

	// Publish to SNS topic (requires phone number subscription to topic)
	if n.topicARN != "" {
		_, err := n.snsClient.Publish(&sns.PublishInput{
			TopicArn: aws.String(n.topicARN),
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

	// Alternative: Direct SMS (requires phone number format +1234567890)
	// Note: This requires AWS SNS SMS configuration
	log.Printf("SMS notification to %s: %s", phoneNumber, message)
}

func (n *Notifier) SendSlack(webhookURL, message string) {
	// Slack webhook implementation using HTTP POST
	payload := map[string]interface{}{
		"text": message,
		"username": "PulseGrid",
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

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

