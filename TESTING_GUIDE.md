# Testing Guide - Verify Your PulseGrid Setup

Follow these steps to test if everything is working.

## Prerequisites Check

### 1. Verify PostgreSQL is Running

```bash
# Check if PostgreSQL is running
pg_isready

# If not running, start it:
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Or using Docker
docker start pulsegrid-db
```

### 2. Verify Database Exists

```bash
# Connect to PostgreSQL
psql -U postgres -l | grep pulsegrid

# If database doesn't exist, create it:
createdb pulsegrid
# Or
psql -U postgres -c "CREATE DATABASE pulsegrid;"
```

## Step-by-Step Testing

### Step 1: Create Backend .env File

```bash
cd backend
```

Create a file named `.env` with this content:

```env
PORT=8080
ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pulsegrid
DB_SSLMODE=disable

JWT_SECRET=4+uqx7TyuB9rsDzdF7M283+j2veST0d/UXzN9kAzlvE=
JWT_EXPIRY=24h

AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here

SNS_TOPIC_ARN=
SES_FROM_EMAIL=convergethemarketplace@gmail.com

CORS_ORIGIN=http://localhost:5173

HEALTH_CHECK_INTERVAL=60
DEFAULT_TIMEOUT=10
```

**Important**: Update `DB_PASSWORD` if your PostgreSQL password is different from `postgres`.

### Step 2: Install Backend Dependencies

```bash
cd backend
go mod download
```

### Step 3: Test Backend Connection

```bash
# Test database connection
go run cmd/api/main.go
```

You should see:
```
Starting server on port 8080
```

If you see errors:
- **Database connection error**: Check PostgreSQL is running and credentials are correct
- **Port already in use**: Change PORT in .env or kill the process using port 8080

### Step 4: Test Backend API (New Terminal)

Keep the backend running, open a new terminal:

```bash
# Test health endpoint
curl http://localhost:8080/api/v1/health

# Should return:
# {"status":"healthy","service":"pulsegrid-api"}
```

### Step 5: Set Up Frontend

```bash
cd frontend
npm install
```

### Step 6: Create Frontend .env.local

```bash
cd frontend
```

Create a file named `.env.local`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

### Step 7: Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 8: Test in Browser

1. Open http://localhost:5173 in your browser
2. You should see the login page

### Step 9: Test Registration

1. Click "Don't have an account? Sign up"
2. Fill in the form:
   - Name: Your Name
   - Email: test@example.com
   - Organization Name: Test Org
   - Password: (at least 8 characters)
3. Click "Sign up"

**Expected Result**: 
- You should be redirected to the dashboard
- You should see "No services" message

### Step 10: Test Service Creation

1. Click "Add Service" button
2. Fill in:
   - Name: Google
   - URL: https://www.google.com
   - Type: HTTP
   - Check Interval: 60
   - Timeout: 10
3. Click "Create"

**Expected Result**:
- Service appears in the list
- You can click on it to see details

### Step 11: Test Service Details

1. Click on a service name
2. You should see:
   - Service information
   - Stats cards (may show 0% initially)
   - Response time chart (may be empty initially)
   - Recent health checks table

## Troubleshooting

### Backend Won't Start

**Error: "Failed to connect to database"**
```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep pulsegrid

# Test connection manually
psql -U postgres -d pulsegrid -c "SELECT 1;"
```

**Error: "Port 8080 already in use"**
```bash
# Find what's using the port
lsof -ti:8080

# Kill the process
lsof -ti:8080 | xargs kill

# Or change port in .env
PORT=8081
```

### Frontend Won't Start

**Error: "Cannot find module"**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error: "API connection failed"**
- Check backend is running
- Verify `VITE_API_URL` in `.env.local` matches backend port
- Check CORS_ORIGIN in backend `.env` matches frontend URL

### Database Migration Errors

If you see migration errors:
```bash
# Connect to database
psql -U postgres -d pulsegrid

# Check if tables exist
\dt

# If tables don't exist, they'll be created automatically on backend startup
```

### Registration/Login Not Working

**Error: "User already exists"**
- Try a different email
- Or delete the user from database:
```sql
psql -U postgres -d pulsegrid
DELETE FROM users WHERE email = 'test@example.com';
```

## Quick Test Checklist

- [ ] PostgreSQL is running
- [ ] Database `pulsegrid` exists
- [ ] Backend `.env` file created
- [ ] Backend dependencies installed (`go mod download`)
- [ ] Backend starts without errors
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend `.env.local` created
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can register a new account
- [ ] Can login
- [ ] Can create a service
- [ ] Can view service details

## Expected Behavior

### When Everything Works:

1. **Backend**: 
   - Starts on port 8080
   - Connects to database
   - Runs migrations automatically
   - Logs show: "Starting server on port 8080"

2. **Frontend**:
   - Starts on port 5173 (or next available)
   - Connects to backend API
   - Shows login page

3. **Registration**:
   - Creates user and organization
   - Returns JWT token
   - Redirects to dashboard

4. **Dashboard**:
   - Shows overview statistics
   - Lists services (empty initially)
   - Can add new services

5. **Service Details**:
   - Shows service information
   - Displays statistics
   - Shows health check history (empty initially until checks run)

## Next Steps After Testing

Once everything works locally:

1. ✅ Test all features (create, update, delete services)
2. ✅ Test alerts (will need health checks to trigger)
3. ✅ Review [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS deployment
4. ✅ Set up health check workers (Lambda functions)

## Need Help?

If something doesn't work:
1. Check the error messages carefully
2. Verify all prerequisites are met
3. Check the troubleshooting section above
4. Review logs in both backend and frontend terminals

Good luck! 🚀

