# Live Data Setup Guide

PulseGrid now supports **real-time live data** like Datadog! Here's how to get it running.

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Backend API
```bash
cd backend
go run cmd/api/main.go
```

### Step 2: Start the Health Check Scheduler (NEW!)
```bash
# In a new terminal
cd backend
go run cmd/scheduler/main.go
```

Or use the script:
```bash
./start-scheduler.sh
```

### Step 3: Start the Frontend
```bash
cd frontend
npm run dev
```

## 📊 What You'll See

Once the scheduler is running:

1. **Automatic Health Checks**: Services are checked every 10 seconds (or based on their `check_interval`)
2. **Live Dashboard Updates**: Dashboard refreshes every 5 seconds automatically
3. **Real-Time Charts**: Charts update with new data points as they come in
4. **Status Indicators**: See services go UP/DOWN in real-time

## 🎯 Features

### Real-Time Health Checks
- ✅ Automatic scheduling based on service `check_interval`
- ✅ Respects service timeouts
- ✅ Creates alerts on downtime
- ✅ Logs all checks to database

### Live Charts
- ✅ **Response Time Chart**: Shows response times over time with gradient fill
- ✅ **Status Chart**: Visualizes UP/DOWN status over time
- ✅ **Auto-updates**: Charts refresh every 5 seconds
- ✅ **Smooth animations**: Recharts provides smooth transitions

### Dashboard Updates
- ✅ Auto-refreshes every 30 seconds
- ✅ Shows latest uptime percentages
- ✅ Displays current status
- ✅ Updates without page reload

## 📈 Chart Types

### 1. Response Time Chart
- **Type**: Area chart with gradient
- **Data**: Response time in milliseconds
- **Updates**: Every 5 seconds
- **Shows**: Historical response times

### 2. Status Chart
- **Type**: Area chart
- **Data**: UP (1) or DOWN (0)
- **Updates**: Every 5 seconds
- **Shows**: Service availability over time

## 🔧 How It Works

### Scheduler Process
1. Every 10 seconds, scheduler checks all active services
2. For each service, checks if enough time has passed (based on `check_interval`)
3. Performs health check (HTTP/TCP/Ping)
4. Saves result to database
5. Creates alert if service goes down
6. Logs result to console

### Frontend Updates
1. Service detail page polls API every 5 seconds
2. Fetches latest health checks and stats
3. Updates charts with new data
4. Shows latest status indicators

## 🎨 Chart Features

### Response Time Chart
- **Gradient fill**: Beautiful purple gradient
- **Interactive tooltips**: Hover to see exact values
- **Time axis**: Shows time of each check
- **Response time axis**: Shows milliseconds

### Status Chart
- **Green gradient**: Visual representation of UP status
- **Binary display**: 1 = UP, 0 = DOWN
- **Time series**: Shows status changes over time

## 📝 Example Output

When scheduler is running, you'll see:

```
Health Check Scheduler started
Checking services every 10 seconds...
Checking 3 active services...
✓ Google Homepage: up (234ms)
✓ GitHub API: up (156ms)
✓ JSONPlaceholder API: up (189ms)
```

## 🐛 Troubleshooting

### No data showing?
1. **Check scheduler is running**: Look for "Health Check Scheduler started" message
2. **Check services are active**: Go to Services page, ensure `is_active = true`
3. **Check database**: Verify health_checks table has data
4. **Check browser console**: Look for API errors

### Charts not updating?
1. **Refresh page**: Sometimes needed on first load
2. **Check network tab**: Verify API calls are happening every 5 seconds
3. **Check console**: Look for JavaScript errors

### Scheduler not working?
1. **Check database connection**: Verify `.env` file has correct DB credentials
2. **Check Go modules**: Run `go mod tidy` in backend/
3. **Check logs**: Look for error messages in scheduler output

## 🚀 Production Deployment

For production with AWS:

1. **Use EventBridge**: Deploy scheduler as Lambda function
2. **Use CloudWatch**: Monitor scheduler execution
3. **Use SNS**: Send alerts on scheduler failures
4. **Use ECS**: Run scheduler as long-running task

## 📊 Monitoring

### Check Scheduler Status
```bash
# Check if scheduler is running
ps aux | grep scheduler

# Check scheduler logs
# (logs appear in terminal where scheduler is running)
```

### Check Database
```sql
-- View recent health checks
SELECT * FROM health_checks 
ORDER BY checked_at DESC 
LIMIT 10;

-- View service stats
SELECT 
  s.name,
  COUNT(hc.id) as total_checks,
  COUNT(CASE WHEN hc.status = 'up' THEN 1 END) as up_checks,
  AVG(hc.response_time_ms) as avg_response_time
FROM services s
LEFT JOIN health_checks hc ON s.id = hc.service_id
WHERE s.is_active = TRUE
GROUP BY s.id, s.name;
```

## 🎯 Next Steps

1. **Add more services**: Monitor multiple endpoints
2. **Set up alerts**: Configure email/SMS/Slack notifications
3. **View trends**: Watch charts update in real-time
4. **Export reports**: Generate CSV/PDF reports

## 💡 Tips

- **Start with 1-2 services**: Test with Google and GitHub first
- **Watch the logs**: Scheduler shows each check in real-time
- **Check intervals**: Set to 60 seconds for faster testing
- **Monitor dashboard**: Watch it update automatically

Enjoy your live monitoring! 🎉

