# 🚀 How to Start PulseGrid

PulseGrid requires **TWO processes** to run:

1. **Backend API Server** - Handles API requests
2. **Health Check Scheduler** - Performs health checks on your services

## Quick Start

### Option 1: Use Scripts (Recommended)

**Terminal 1 - Backend API:**
```bash
./start-backend.sh
```

**Terminal 2 - Health Check Scheduler:**
```bash
./start-scheduler.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend API:**
```bash
cd backend
go run cmd/api/main.go
```

**Terminal 2 - Health Check Scheduler:**
```bash
cd backend
go run cmd/scheduler/main.go
```

## What Each Process Does

### Backend API Server (`cmd/api/main.go`)
- Handles HTTP requests from frontend
- Manages authentication
- Provides REST API endpoints
- Runs on port 8080

### Health Check Scheduler (`cmd/scheduler/main.go`)
- Checks your services every 10 seconds
- Respects each service's `check_interval` setting
- Saves health check results to database
- Creates alerts when services go down
- Sends notifications

## Verification

### Check Backend API:
```bash
curl http://localhost:8080/api/v1/health
```
Should return: `{"service":"pulsegrid-api","status":"healthy"}`

### Check Scheduler:
Look for logs like:
```
Health Check Scheduler started
Checking services every 10 seconds...
Checking 2 active services...
✓ My Service: up (123ms)
```

## Why You're Seeing "No Data"

If you see "No health check data available" on your dashboard:

1. **Scheduler not running** - Start it with `./start-scheduler.sh`
2. **Service not active** - Make sure `is_active = true` in the database
3. **Check interval too long** - Default is 60 seconds, wait at least that long
4. **Service URL invalid** - Check if the URL is accessible

## Current Status

✅ **Backend API**: Running on port 8080
✅ **Scheduler**: Should be running (check with `ps aux | grep scheduler`)

## Troubleshooting

### Scheduler not checking services?

1. Check if scheduler is running:
   ```bash
   ps aux | grep scheduler
   ```

2. Check scheduler logs:
   ```bash
   tail -f /tmp/pulsegrid-scheduler.log
   ```

3. Verify services are active:
   ```bash
   psql -h localhost -U your_user -d pulsegrid -c "SELECT name, url, is_active FROM services;"
   ```

### Services showing as "down"?

- Check if the URL is accessible from your machine
- Verify the URL format (include `http://` or `https://`)
- Check timeout settings (default is 10 seconds)

## Important Notes

- **Both processes must run simultaneously**
- The scheduler checks services based on their `check_interval` (default: 60 seconds)
- Health checks are performed in the background
- You'll see data appear within 1-2 minutes after adding a service

