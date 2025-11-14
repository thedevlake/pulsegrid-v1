# 📧 Email Notifications Setup Guide

PulseGrid supports multiple ways to send email notifications for alerts. Choose the option that works best for your environment.

## 🎯 Quick Start (Console Mode - No Setup Required)

**For local development/testing**, PulseGrid will automatically log emails to the console if no email service is configured. You'll see emails printed in your backend logs when alerts are triggered.

**No configuration needed!** Just create an alert subscription and you'll see emails in the console.

---

## Option 1: SMTP (Recommended for Local Development)

Use any SMTP server (Gmail, SendGrid, Mailgun, etc.) for local development.

### Gmail Setup

1. **Enable App Passwords** in your Google Account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification
   - Create an App Password

2. **Add to backend `.env` file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM_EMAIL=your-email@gmail.com
   ```

### SendGrid Setup

1. **Get API credentials** from SendGrid dashboard

2. **Add to backend `.env` file:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your-sendgrid-api-key
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

### Other SMTP Providers

Any SMTP server works! Just configure:
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - Usually 587 (TLS) or 465 (SSL)
- `SMTP_USER` - Your SMTP username
- `SMTP_PASSWORD` - Your SMTP password
- `SMTP_FROM_EMAIL` - Email address to send from

---

## Option 2: AWS SES (For Production)

For production deployments on AWS.

1. **Configure AWS credentials** in backend `.env`:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   SES_FROM_EMAIL=noreply@yourdomain.com
   ```

2. **Verify your email** in AWS SES console (required for sandbox mode)

3. **Request production access** if sending to unverified emails

---

## 📝 How to Create Alert Subscriptions

1. **Go to Alerts page** → Click "Manage Subscriptions"
2. **Click "Add Subscription"**
3. **Fill in the form:**
   - **Channel**: Select "Email"
   - **Destination**: Enter your email address
   - **Service**: Leave empty for all services, or select specific service
4. **Click "Create Subscription"**

---

## ✅ Testing Email Notifications

1. **Create an email subscription** (see above)
2. **Add a test service** with a bad URL:
   - Name: "Test Service"
   - URL: `https://this-does-not-exist-12345.com`
   - Type: HTTP
3. **Wait for scheduler** to check it (or click "Run Check")
4. **Check your email** (or backend logs if using console mode)

---

## 🔍 Troubleshooting

### Emails not sending?

1. **Check backend logs** for email-related messages:
   - `📧 Email notifications will be logged to console` = Console mode (working!)
   - `✅ Email sent via SMTP` = SMTP working
   - `✅ Email sent via AWS SES` = AWS SES working
   - `❌ Failed to send email` = Check configuration

2. **Verify subscription exists:**
   - Go to `/alerts/subscriptions`
   - Make sure subscription is active

3. **Check environment variables:**
   - For SMTP: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`
   - For AWS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

4. **Test SMTP connection:**
   - Try sending a test email manually with your SMTP settings
   - Check firewall/network restrictions

### Console mode not showing emails?

- Make sure alerts are being created (check Alerts page)
- Check backend logs when alerts are triggered
- Verify subscription is active and channel is "email"

---

## 🎉 That's It!

Your email notifications are now configured. When services go down, you'll receive email alerts (or see them in console logs for development).

