# 🚀 Start Live Monitoring - Quick Guide

## 3 Simple Steps to Get Live Data

### Step 1: Start Backend API
```bash
cd backend
go run cmd/api/main.go
```
Keep this terminal open!

### Step 2: Start Health Check Scheduler (NEW!)
```bash
# Open a NEW terminal
cd backend
go run cmd/scheduler/main.go
```

You should see:
```
Health Check Scheduler started
Checking services every 10 seconds...
Checking 3 active services...
✓ Google Homepage: up (234ms)
✓ GitHub API: up (156ms)
```

### Step 3: Start Frontend
```bash
# Open a THIRD terminal
cd frontend
npm run dev
```

## 🎯 What Happens Now

1. **Scheduler runs health checks** every 10 seconds (or based on service interval)
2. **Dashboard auto-updates** every 30 seconds
3. **Service detail pages** update every 5 seconds
4. **Charts show live data** with smooth animations

## 📊 View Live Data

1. Go to http://localhost:5173/dashboard
2. Click on any service
3. Watch the charts update in real-time!
4. See response times and status change live

## ✅ Verify It's Working

Check the scheduler terminal - you should see:
```
✓ Service Name: up (XXXms)
```

Check the service detail page - charts should update every 5 seconds.

## 🐛 Troubleshooting

**No data?**
- Make sure scheduler is running (Step 2)
- Check services are `is_active = true`
- Check database connection in scheduler logs

**Charts not updating?**
- Refresh the page
- Check browser console for errors
- Verify API is responding (check Network tab)

That's it! You now have live monitoring like Datadog! 🎉

