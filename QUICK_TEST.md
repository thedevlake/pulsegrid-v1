# Quick Test Guide - 5 Minutes

Get PulseGrid running and tested in 5 minutes!

## 1. Start Services (2 minutes)

### Terminal 1: Backend
```bash
cd backend
go run cmd/api/main.go
```

### Terminal 2: Frontend  
```bash
cd frontend
npm run dev
```

## 2. Create Account (1 minute)

1. Open http://localhost:5173/register
2. Register:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
   - Organization: `My Company`

## 3. Add Test Services (1 minute)

### Option A: Use the Script
```bash
# Get your JWT token from browser console:
# localStorage.getItem('auth-storage')
# Or from Network tab after login

./test-services.sh "your-jwt-token-here"
```

### Option B: Manual (via UI)
1. Go to http://localhost:5173/services
2. Click "Add Service"
3. Add:
   - **Name**: `Google`
   - **URL**: `https://www.google.com`
   - **Type**: `http`
   - **Check Interval**: `60`
   - **Timeout**: `10`
4. Click "Create"

## 4. View Dashboard (30 seconds)

1. Go to http://localhost:5173/dashboard
2. You should see:
   - Your services listed
   - Uptime statistics
   - Status indicators

## 5. Test Manual Health Check (30 seconds)

```bash
./manual-health-check.sh https://www.google.com
```

Expected output:
```
✅ Status: UP
📊 HTTP Code: 200
⏱️  Response Time: 0.234s
```

## Done! ✅

You now have:
- ✅ Account created
- ✅ Services added
- ✅ Dashboard showing data
- ✅ Health checks working

## Next Steps

- Add more services
- Check alerts page
- Test admin panel (make yourself admin in DB)
- Export reports
- Test notifications

## Troubleshooting

**Backend not starting?**
- Check PostgreSQL is running
- Verify `.env` file exists
- Check port 8080 is free

**Frontend not loading?**
- Check Node.js is installed
- Run `npm install` in frontend/
- Check port 5173 is free

**Services not showing?**
- Check browser console for errors
- Verify JWT token is valid
- Check backend logs

**Health checks not running?**
- EventBridge requires AWS deployment
- For local testing, use manual script
- Or wait for scheduled checks (if AWS configured)

