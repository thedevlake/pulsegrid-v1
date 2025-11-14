# 📧 SMTP Email Setup - Step by Step Guide

Follow these steps to set up real email notifications using SMTP.

## 🎯 Choose Your Email Provider

### Option 1: Gmail (Easiest for Testing)

**Pros:** Free, easy to set up, works immediately  
**Cons:** Limited to 500 emails/day, requires App Password

#### Steps:

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification" → Enable it

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "PulseGrid" as the name
   - Click "Generate"
   - **Copy the 16-character password** (you'll need this!)

3. **Update your `.env` file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  (the 16-char app password)
   SMTP_FROM_EMAIL=your-actual-email@gmail.com
   ```

---

### Option 2: SendGrid (Recommended for Production)

**Pros:** 100 free emails/day, reliable, production-ready  
**Cons:** Requires account setup

#### Steps:

1. **Sign up:** https://sendgrid.com (free tier available)

2. **Get API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it "PulseGrid"
   - Select "Full Access" or "Mail Send"
   - **Copy the API key** (you'll only see it once!)

3. **Update your `.env` file:**
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=SG.xxxxxxxxxxxxx  (your SendGrid API key)
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

---

### Option 3: Mailgun (Good Alternative)

**Pros:** 5,000 free emails/month, reliable  
**Cons:** Requires domain verification

#### Steps:

1. **Sign up:** https://www.mailgun.com

2. **Get SMTP credentials:**
   - Go to Sending → Domain Settings
   - Find "SMTP credentials"
   - Copy username and password

3. **Update your `.env` file:**
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@yourdomain.mailgun.org
   SMTP_PASSWORD=your-mailgun-password
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

---

## ✅ After Configuration

1. **Save your `.env` file**

2. **Restart your backend server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart it
   cd backend
   go run cmd/api/main.go
   ```

3. **Check the logs** - You should see:
   ```
   📧 Email notifications configured via SMTP: smtp.gmail.com:587
   ```

4. **Test it:**
   - Create an alert subscription with your email
   - Add a test service with a bad URL
   - Trigger an alert
   - Check your email inbox!

---

## 🔍 Troubleshooting

### "SMTP authentication failed"
- **Gmail:** Make sure you're using an App Password, not your regular password
- **SendGrid:** Verify the API key is correct
- **Mailgun:** Check username/password are correct

### "Connection refused"
- Check firewall settings
- Verify SMTP_HOST and SMTP_PORT are correct
- Try port 465 with SSL instead of 587

### "Email not received"
- Check spam folder
- Verify SMTP_FROM_EMAIL matches your account
- Check backend logs for error messages

---

## 🎉 That's It!

Once configured, all alert emails will be sent via SMTP instead of console logging.

