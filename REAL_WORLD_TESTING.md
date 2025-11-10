# Real-World Testing Guide

This guide will help you test PulseGrid with real services and data.

## Prerequisites

1. **Backend running** on `http://localhost:8080`
2. **Frontend running** on `http://localhost:5173` (or your Vite port)
3. **PostgreSQL database** running and connected
4. **AWS credentials** configured (for notifications and scheduling)

## Step 1: Start the Application

### Terminal 1: Backend

```bash
cd backend
go run cmd/api/main.go
```

You should see:

```
Starting server on port 8080
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

You should see:

```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

## Step 2: Create Your First Account

1. Open `http://localhost:5173/register`
2. Register with:

   - **Email**: `admin@test.com`
   - **Password**: `password123`
   - **Name**: `Test Admin`
   - **Organization**: `Test Company`

3. You'll be automatically logged in and redirected to the dashboard

## Step 3: Add Real Services to Monitor

### Test Services (Public APIs you can monitor)

Here are some reliable public APIs you can use for testing:

#### 1. **Google (HTTP Check)**

- **Name**: `Google Homepage`
- **URL**: `https://www.google.com`
- **Type**: `http`
- **Check Interval**: `60` (1 minute)
- **Timeout**: `10` seconds
- **Expected Status Code**: `200`

#### 2. **GitHub API (HTTP Check)**

- **Name**: `GitHub API`
- **URL**: `https://api.github.com`
- **Type**: `http`
- **Check Interval**: `120` (2 minutes)
- **Timeout**: `10` seconds
- **Expected Status Code**: `200`

#### 3. **JSONPlaceholder (HTTP Check)**

- **Name**: `JSONPlaceholder API`
- **URL**: `https://jsonplaceholder.typicode.com/posts/1`
- **Type**: `http`
- **Check Interval**: `180` (3 minutes)
- **Timeout**: `10` seconds
- **Expected Status Code**: `200`

#### 4. **HTTPBin (HTTP Check)**

- **Name**: `HTTPBin Status`
- **URL**: `https://httpbin.org/status/200`
- **Type**: `http`
- **Check Interval**: `60` (1 minute)
- **Timeout**: `10` seconds
- **Expected Status Code**: `200`

#### 5. **A Down Service (To Test Alerts)**

- **Name**: `Test Down Service`
- **URL**: `https://this-url-does-not-exist-12345.com`
- **Type**: `http`
- **Check Interval**: `60` (1 minute)
- **Timeout**: `5` seconds
- **Expected Status Code**: `200`

### How to Add Services

1. Go to **Services** page (`/services`)
2. Click **"Add Service"** button
3. Fill in the form with one of the services above
4. Click **"Create"**
5. Repeat for multiple services

## Step 4: Test Health Checks (Manual Trigger)

Since EventBridge scheduling requires AWS deployment, you can manually trigger health checks:

### Option A: Using the API Directly

```bash
# Get your JWT token from browser localStorage or login response
TOKEN="your-jwt-token-here"

# Get your service ID from the Services page
SERVICE_ID="your-service-id-here"

# Trigger health check via Lambda (if deployed)
# Or use a simple curl to test the endpoint
curl -X GET "https://www.google.com" -w "\nTime: %{time_total}s\n"
```

### Option B: Create a Test Script

Create `test-health-check.sh`:

```bash
#!/bin/bash

# Test health check for a service
SERVICE_URL="https://www.google.com"

echo "Testing: $SERVICE_URL"
START=$(date +%s.%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVICE_URL")
END=$(date +%s.%N)
RESPONSE_TIME=$(echo "$END - $START" | bc)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Status: UP"
    echo "Response Time: ${RESPONSE_TIME}s"
    echo "HTTP Code: $HTTP_CODE"
else
    echo "❌ Status: DOWN"
    echo "HTTP Code: $HTTP_CODE"
fi
```

Run it:

```bash
chmod +x test-health-check.sh
./test-health-check.sh
```

### Option C: Use Postman/Insomnia

1. Create a POST request to trigger health check
2. Or use the Lambda function directly if deployed

## Step 5: View Real Data in Dashboard

1. **Go to Dashboard** (`/dashboard`)

   - You should see your services listed
   - Uptime percentages (will be 0% initially)
   - Average response times
   - Status indicators

2. **Wait for Health Checks**

   - If using EventBridge: Wait for scheduled checks (based on interval)
   - If manual: Trigger checks and refresh dashboard
   - Dashboard auto-refreshes every 30 seconds

3. **Check Service Details**
   - Click on any service
   - View health check history
   - See response times over time
   - View charts and statistics

## Step 6: Test Alerts

### Create Alert Subscription

1. Go to **Alerts** page (`/alerts`)
2. Click **"Add Subscription"** (if available)
3. Or use API:

```bash
curl -X POST "http://localhost:8080/api/v1/alerts/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "destination": "your-email@example.com",
    "service_id": "your-service-id"
  }'
```

### Trigger an Alert

1. Add the "Test Down Service" (the non-existent URL)
2. Wait for health check to run
3. Service should be marked as DOWN
4. Alert should be created
5. Check your email (if SES is configured)

## Step 7: Test Admin Panel

1. **Make yourself an admin** (via database or API):

```sql
-- Connect to PostgreSQL
psql -U your_user -d pulsegrid

-- Update your user to admin
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';
```

2. **Refresh the page** - You should see "Admin" link in navigation

3. **Go to Admin Panel** (`/admin`)
   - View system metrics
   - See all users
   - See all organizations
   - View system-wide statistics

## Step 8: Test Reports

1. Go to a service detail page
2. Click **"Export CSV"** or **"Export PDF"**
3. CSV should download immediately
4. PDF will show "coming soon" message

## Step 9: Test Real-Time Updates

1. Open Dashboard in browser
2. In another terminal, manually trigger health checks
3. Watch dashboard auto-refresh every 30 seconds
4. Data should update without page reload

## Step 10: Test with Multiple Organizations

### Create Second User

1. Logout
2. Register new user:
   - **Email**: `user2@test.com`
   - **Organization**: `Another Company`
3. Add services
4. Verify data isolation:
   - User 2 should NOT see User 1's services
   - Admin can see both organizations

## Step 11: Test AWS Integrations

### EventBridge Scheduling (If Deployed)

1. Create a service via dashboard
2. Check AWS Console → EventBridge → Rules
3. You should see a new rule: `pulsegrid-service-{service-id}`
4. Rule should trigger Lambda at specified interval

### SES Email Notifications

1. Ensure email is verified in AWS SES
2. Create alert subscription with your email
3. Trigger downtime
4. Check your email inbox

### SNS SMS Notifications

1. Subscribe phone number to SNS topic in AWS Console
2. Create alert subscription with phone number
3. Trigger downtime
4. Check your phone for SMS

### Slack Notifications

1. Create Slack webhook:

   - Go to Slack → Apps → Incoming Webhooks
   - Create webhook for your channel
   - Copy webhook URL

2. Create alert subscription:

```bash
curl -X POST "http://localhost:8080/api/v1/alerts/subscriptions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "slack",
    "destination": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  }'
```

3. Trigger downtime
4. Check Slack channel for notification

## Step 12: Monitor Performance

### Check Database

```sql
-- View all health checks
SELECT * FROM health_checks ORDER BY checked_at DESC LIMIT 10;

-- View all services
SELECT id, name, url, check_interval, is_active FROM services;

-- View all alerts
SELECT * FROM alerts WHERE is_resolved = FALSE;

-- View system stats
SELECT
  COUNT(*) as total_services,
  COUNT(CASE WHEN is_active THEN 1 END) as active_services,
  (SELECT COUNT(*) FROM health_checks) as total_checks,
  (SELECT COUNT(*) FROM alerts WHERE is_resolved = FALSE) as unresolved_alerts
FROM services;
```

### Check Backend Logs

Watch backend terminal for:

- Health check requests
- Database queries
- Error messages
- Scheduler activities

### Check Frontend Console

Open browser DevTools (F12):

- Network tab: See API calls
- Console tab: See any errors
- Application tab: Check localStorage for auth token

## Step 13: Stress Testing

### Add Multiple Services

Add 10-20 services with different intervals:

- Some every 60 seconds
- Some every 120 seconds
- Some every 300 seconds

### Monitor System

1. Watch dashboard handle multiple services
2. Check database performance
3. Monitor backend memory/CPU
4. Verify all health checks are running

## Step 14: Test Error Scenarios

### Invalid URLs

- Add service with invalid URL
- Should show error in health checks

### Timeout Scenarios

- Add service with very short timeout (1 second)
- Service might timeout if slow

### Network Issues

- Disconnect internet temporarily
- All services should show DOWN
- Reconnect - services should recover

## Quick Test Checklist

- [ ] Backend running on port 8080
- [ ] Frontend running on port 5173
- [ ] Database connected
- [ ] Registered user account
- [ ] Added at least 3 services
- [ ] Dashboard shows services
- [ ] Health checks are running (or scheduled)
- [ ] Alerts page accessible
- [ ] Admin panel accessible (if admin)
- [ ] CSV export works
- [ ] Real-time updates working (30s refresh)
- [ ] Multi-tenant isolation working

## Troubleshooting

### Services not showing up

- Check backend logs for errors
- Verify database connection
- Check JWT token is valid

### Health checks not running

- Verify EventBridge rules created (if using AWS)
- Check Lambda function deployed
- Verify database has health_check records

### Alerts not sending

- Check SES email verification
- Verify SNS topic exists
- Check Slack webhook URL
- Review backend/worker logs

### Admin panel not accessible

- Verify user role is 'admin' in database
- Check JWT token includes role
- Clear browser cache/localStorage

## Next Steps

Once basic testing is complete:

1. **Deploy to AWS** - Use Terraform to deploy infrastructure
2. **Set up CI/CD** - Automate deployments
3. **Add monitoring** - CloudWatch alarms
4. **Load testing** - Test with 100+ services
5. **Security audit** - Review authentication and authorization

## Sample Test Data

Here's a JSON file with sample services you can import:

```json
{
  "services": [
    {
      "name": "Google Search",
      "url": "https://www.google.com",
      "type": "http",
      "check_interval": 60,
      "timeout": 10,
      "expected_status_code": 200,
      "tags": ["public", "search"]
    },
    {
      "name": "GitHub Status",
      "url": "https://www.githubstatus.com",
      "type": "http",
      "check_interval": 120,
      "timeout": 10,
      "expected_status_code": 200,
      "tags": ["public", "status"]
    },
    {
      "name": "AWS Status",
      "url": "https://status.aws.amazon.com",
      "type": "http",
      "check_interval": 300,
      "timeout": 15,
      "expected_status_code": 200,
      "tags": ["aws", "status"]
    }
  ]
}
```

Happy Testing! 🚀
