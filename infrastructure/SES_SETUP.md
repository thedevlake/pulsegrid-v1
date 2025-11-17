# SES (Simple Email Service) Setup Guide

## Current Status

The SES email identity `noreply@yourdomain.com` has been created but is in **Pending** verification status.

## Verification Steps

### Option 1: Verify Email Address (Quick Start)

1. **Check your email inbox** for a verification email from AWS SES
2. **Click the verification link** in the email
3. The identity will be verified within minutes

### Option 2: Verify Domain (Production Recommended)

For production use, verify your entire domain instead of individual email addresses:

1. **Go to AWS SES Console**: https://console.aws.amazon.com/ses/
2. **Navigate to**: Verified identities → Create identity
3. **Select**: Domain
4. **Enter your domain**: `yourdomain.com`
5. **Follow DNS verification steps**:
   - Add the provided TXT record to your domain's DNS
   - Add the provided CNAME records for DKIM signing
6. **Wait for verification** (usually 24-48 hours for DNS propagation)

## Production Access Request

AWS SES starts in **Sandbox mode**, which means:
- You can only send emails to verified email addresses
- Limited to 200 emails per day
- Limited to 1 email per second

### To Request Production Access:

1. **Go to AWS SES Console**: https://console.aws.amazon.com/ses/
2. **Navigate to**: Account dashboard → Request production access
3. **Fill out the form**:
   - Use case description
   - Website URL
   - Expected email volume
   - How you'll handle bounces/complaints
4. **Submit and wait** (usually 24-48 hours for approval)

## Current Configuration

- **SES Identity**: `noreply@yourdomain.com`
- **Status**: Pending verification
- **Region**: `eu-north-1`
- **From Email**: Configured in Terraform (`var.ses_from_email`)

## Alternative: Use SMTP Instead

If you prefer not to use SES, you can configure SMTP in the backend:

1. **Set SMTP environment variables** in SSM Parameter Store:
   - `/pulsegrid/smtp/host`
   - `/pulsegrid/smtp/port`
   - `/pulsegrid/smtp/user`
   - `/pulsegrid/smtp/password`

2. **Update ECS task definition** to include SMTP parameters

3. **The backend will automatically use SMTP** if configured (see `backend/internal/notifier/notifier.go`)

## Testing Email

Once verified, test email sending:

1. **Create a test subscription** in the PulseGrid UI
2. **Trigger a health check** that results in an alert
3. **Check the email inbox** for the alert notification

## Troubleshooting

- **Verification email not received**: Check spam folder, verify email address is correct
- **DNS verification failing**: Ensure TXT/CNAME records are correctly added to DNS
- **Production access denied**: Provide more detailed use case information and resubmit

