# What is PulseGrid?

## Overview

**PulseGrid** is a **real-time infrastructure monitoring platform** that tracks the health, uptime, latency, and performance of your web services, APIs, and endpoints. Think of it as a **mini Datadog** or **UptimeRobot** - but self-hosted and fully customizable.

## What Can You Use It For?

### 1. **Monitor Your Web Services**
- Track any HTTP/HTTPS endpoint (websites, APIs, webhooks)
- Monitor TCP services (databases, custom ports)
- Ping checks for servers and network devices
- Get real-time status updates every few seconds

### 2. **Track Uptime & Performance**
- See uptime percentages for each service
- Monitor response times and latency
- View historical performance trends
- Identify slow or degraded services

### 3. **Get Instant Alerts**
- Email notifications when services go down
- SMS alerts via AWS SNS
- Slack webhook notifications
- Alerts trigger within 30 seconds of downtime

### 4. **Multi-Tenant Monitoring**
- Each organization has isolated data
- Perfect for agencies managing multiple clients
- Teams can monitor their own services independently

### 5. **Real-Time Dashboards**
- Live charts showing response times
- Status indicators with color coding
- Historical uptime trends
- Service comparison views

## How It Works

### The Monitoring Flow:

1. **You Add a Service** → Enter URL (e.g., `https://api.example.com`)
2. **Scheduler Runs** → Checks your service every X seconds (configurable)
3. **Health Check Performed** → HTTP request, TCP connection, or Ping
4. **Results Stored** → Status, response time, status code saved to database
5. **Dashboard Updates** → Real-time charts and metrics displayed
6. **Alerts Triggered** → If service goes down, notifications sent

### Example Use Cases:

- **E-commerce Site**: Monitor your payment API, inventory service, shipping API
- **SaaS Application**: Track API endpoints, database connections, third-party integrations
- **DevOps Team**: Monitor staging/production environments, health check endpoints
- **Agency**: Monitor all client websites and services from one dashboard
- **Startup**: Track critical services without expensive monitoring tools

## Is It Actually Working?

**YES!** PulseGrid performs **real HTTP/TCP/Ping checks** on your services. Here's how to verify:

### 1. **Start the Scheduler**
The scheduler must be running for health checks to happen:
```bash
cd backend
go run cmd/scheduler/main.go
```

You'll see logs like:
```
Checking 3 active services...
✓ My API: up (245ms)
✓ Website: up (189ms)
⚠ Alert created for Down Service
```

### 2. **Check the Database**
Health checks are stored in the `health_checks` table:
```sql
SELECT * FROM health_checks ORDER BY checked_at DESC LIMIT 10;
```

### 3. **Watch the Dashboard**
- Services show "NO DATA" status until first check completes
- Response times appear after checks run
- Charts populate with real data points
- Status changes from "NO DATA" → "UP" or "DOWN" based on actual checks

### 4. **Test with a Real Service**
Try monitoring:
- `https://www.google.com` (should be UP)
- `https://httpstat.us/500` (should be DOWN - returns 500 error)
- `https://httpstat.us/200` (should be UP)

## AWS Infrastructure & Terraform

### What Terraform Handles (Infrastructure Layer):
- **Compute**: ECS Fargate containers, Lambda functions
- **Network**: VPC, subnets, security groups, load balancers
- **Storage**: RDS PostgreSQL, S3 buckets
- **Global**: CloudFront CDN, Route 53 DNS
- **Monitoring**: CloudWatch logs, metrics, alarms
- **Security**: IAM roles, KMS encryption, WAF rules

### What PulseGrid App Handles (Application Layer):
- **Service Registration**: Add/remove services to monitor
- **Health Checks**: Perform actual HTTP/TCP/Ping checks
- **Data Storage**: Store check results in PostgreSQL
- **Alerting**: Send notifications via SES/SNS/Slack
- **Dashboards**: Display metrics and charts
- **User Management**: Authentication, organizations, RBAC

**You don't need to configure AWS compute/network in the app** - Terraform does that. The app just uses the infrastructure Terraform creates.

## PRD Compliance

PulseGrid follows the PRD requirements:

✅ **FR1**: Service Registration - Add URLs/IPs with metadata  
✅ **FR2**: Health Checks - Periodic HTTP/TCP/Ping checks (scheduler runs every 10s)  
✅ **FR3**: Status Dashboard - Real-time uptime, latency, charts  
✅ **FR4**: Alerts - Email/SMS/Slack notifications on downtime  
✅ **FR5**: Reports - CSV export (PDF coming soon)  
✅ **FR6**: Authentication - JWT-based, org isolation  
✅ **FR7**: Admin Panel - User management, system metrics  
✅ **FR8**: Multi-Tenancy - Data isolation by organization  

## Why Services Might Show "Active" Initially

When you first add a service:
1. It's created in the database with `is_active = true`
2. **But no health checks have run yet**
3. Status should show "NO DATA" or "UNKNOWN" (now fixed)
4. After scheduler runs first check → Real status appears

**This is now fixed** - services without health checks show "NO DATA" status instead of fake "UP".

## Getting Started

1. **Start Backend API**: `cd backend && go run cmd/api/main.go`
2. **Start Scheduler**: `cd backend && go run cmd/scheduler/main.go` (in separate terminal)
3. **Start Frontend**: `cd frontend && npm run dev`
4. **Add a Service**: Use the dashboard to add a URL
5. **Watch It Monitor**: Check the service detail page to see real-time data

## Real vs Fake Data

**Real Data**:
- ✅ Actual HTTP requests to your URLs
- ✅ Real response times measured in milliseconds
- ✅ Actual status codes (200, 404, 500, etc.)
- ✅ Real error messages if service is down
- ✅ Historical data stored in PostgreSQL

**Not Fake**:
- ❌ No mock data
- ❌ No simulated responses
- ❌ No placeholder values (unless no checks run yet)

The only time you see "NO DATA" is when:
- Scheduler hasn't run yet
- Service was just added
- No health checks have been performed

Once the scheduler runs, you'll see **real, live data** from your actual services.

