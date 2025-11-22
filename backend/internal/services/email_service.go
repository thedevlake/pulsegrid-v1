package services

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/smtp"
	"os"
	"strings"
)

type EmailService struct {
	smtpHost     string
	smtpPort     string
	smtpUser     string
	smtpPassword string
	fromEmail    string
	frontendURL  string
}

func NewEmailService() *EmailService {
	return &EmailService{
		smtpHost:     getEnv("SMTP_HOST", "email-smtp.us-east-1.amazonaws.com"),
		smtpPort:     getEnv("SMTP_PORT", "587"),
		smtpUser:     getEnv("SMTP_USER", ""),
		smtpPassword: getEnv("SMTP_PASSWORD", ""),
		fromEmail:    getEnv("SMTP_FROM_EMAIL", "noreply@pulsegrid.com"),
		frontendURL:  getEnv("FRONTEND_URL", "http://localhost:3000"),
	}
}

func (es *EmailService) SendVerificationEmail(to, name, token string) error {
	if es.smtpPassword == "" {
		log.Printf("❌ SMTP_PASSWORD not configured - cannot send email")
		return fmt.Errorf("SMTP_PASSWORD not configured")
	}

	log.Printf("📧 Attempting to send verification email to %s via %s:%s", to, es.smtpHost, es.smtpPort)

	verificationURL := fmt.Sprintf("%s/verify-email?token=%s", es.frontendURL, token)

	emailTemplate := `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
		<h1 style="color: white; margin: 0;">Verify Your Email</h1>
	</div>
	<div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
		<p>Hi {{.Name}},</p>
		<p>Thank you for signing up for PulseGrid! Please verify your email address by clicking the button below:</p>
		<div style="text-align: center; margin: 30px 0;">
			<a href="{{.VerificationURL}}" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email</a>
		</div>
		<p>Or copy and paste this link into your browser:</p>
		<p style="word-break: break-all; color: #3b82f6;">{{.VerificationURL}}</p>
		<p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
		<p style="color: #6b7280; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
	</div>
	<div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
		<p>© 2025 PulseGrid. All rights reserved.</p>
	</div>
</body>
</html>
`

	tmpl, err := template.New("email").Parse(emailTemplate)
	if err != nil {
		return fmt.Errorf("failed to parse email template: %w", err)
	}

	var body bytes.Buffer
	err = tmpl.Execute(&body, map[string]string{
		"Name":           name,
		"VerificationURL": verificationURL,
	})
	if err != nil {
		return fmt.Errorf("failed to execute email template: %w", err)
	}

	subject := "Verify Your PulseGrid Email"
	msg := []byte(fmt.Sprintf("To: %s\r\n", to) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		body.String())

	auth := smtp.PlainAuth("", es.smtpUser, es.smtpPassword, es.smtpHost)
	addr := fmt.Sprintf("%s:%s", es.smtpHost, es.smtpPort)

	log.Printf("   SMTP Config: Host=%s, Port=%s, User=%s, From=%s, To=%s", es.smtpHost, es.smtpPort, es.smtpUser, es.fromEmail, to)
	
	err = smtp.SendMail(addr, auth, es.fromEmail, []string{to}, msg)
	if err != nil {
		log.Printf("❌ SMTP SendMail error: %v", err)
		log.Printf("   Full error details: %+v", err)
		
		// Provide helpful error messages based on SMTP provider
		if strings.Contains(es.smtpHost, "amazonaws.com") {
			log.Printf("   ⚠️  Common AWS SES issues:")
			log.Printf("      1. Sender email (%s) must be verified in AWS SES", es.fromEmail)
			log.Printf("      2. Go to: AWS Console → SES → Verified identities")
			log.Printf("      3. If in sandbox mode, recipient must also be verified")
			log.Printf("      4. Check SMTP credentials are correct (from SES → SMTP settings)")
			log.Printf("      5. Ensure your AWS account is out of SES sandbox for production")
		} else if strings.Contains(es.smtpHost, "sendgrid.net") {
			log.Printf("   ⚠️  Common SendGrid issues:")
			log.Printf("      1. Sender email (%s) must be verified in SendGrid dashboard", es.fromEmail)
			log.Printf("      2. Go to: Settings → Sender Authentication → Verify a Single Sender")
			log.Printf("      3. Check API key has 'Mail Send' permissions")
			log.Printf("      4. Free tier accounts may have sending restrictions")
		}
		
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("✅ Email sent successfully to %s", to)
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

