# 🚀 Quick Start Guide

## ✅ Backend Status: RUNNING

The backend is now running on **http://localhost:8080**

## 🔧 How to Start Everything

### 1. Start Backend (if not running)

```bash
cd backend
go run cmd/api/main.go
```

Or use the script:
```bash
./start-backend.sh
```

**Expected output:**
```
Starting server on port 8080
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/api/v1/health

## 🔐 Register/Login

### Register a New Account

1. Go to: **http://localhost:5173/register**
2. Fill in:
   - Email
   - Password (minimum 8 characters)
   - Name
   - Organization Name
3. Click "Create Account"
4. You'll be automatically logged in and redirected to the dashboard

### Login

1. Go to: **http://localhost:5173/login**
2. Enter your email and password
3. Click "Sign In"

## 🐛 Troubleshooting

### "Login failed" or "Registration failed"

**Check 1: Is the backend running?**
```bash
curl http://localhost:8080/api/v1/health
```

Should return: `{"service":"pulsegrid-api","status":"healthy"}`

**If not running:**
```bash
cd backend
go run cmd/api/main.go
```

**Check 2: Is the frontend running?**
- Open http://localhost:5173 in your browser
- If it doesn't load, start it:
```bash
cd frontend
npm run dev
```

**Check 3: Check browser console**
- Open Developer Tools (F12)
- Check the Console tab for errors
- Check the Network tab to see if API calls are failing

**Check 4: CORS Issues**
- Make sure `CORS_ORIGIN` in `backend/.env` matches your frontend URL
- Default: `CORS_ORIGIN=http://localhost:5173`

### Backend won't start

**Database connection error:**
```bash
# Check if PostgreSQL is running
pg_isready

# Check database credentials in backend/.env
cat backend/.env | grep DB_
```

**Port already in use:**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Then restart backend
cd backend
go run cmd/api/main.go
```

## 📝 Current Status

✅ **Backend**: Running on port 8080
✅ **Database**: Connected (pulsegrid)
✅ **API Endpoints**: Working
✅ **Registration**: Tested and working

**Next Steps:**
1. Make sure frontend is running: `cd frontend && npm run dev`
2. Go to http://localhost:5173/register
3. Create your account!

## 🔍 Verify Everything is Working

Test the registration endpoint:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test12345",
    "name": "Test User",
    "org_name": "Test Org"
  }'
```

Should return a token and user object.

