# 🧪 Test URLs and Service Types Guide

## Service Types Explained

### 1. **HTTP/HTTPS** (Most Common)
**What it does:**
- Performs an HTTP GET request to the URL
- Checks if the website/web service responds
- Verifies the HTTP status code (200 = success)
- Measures response time

**Use for:**
- Websites (https://example.com)
- APIs (https://api.example.com/health)
- Web services
- REST endpoints

**What it checks:**
- ✅ Website is accessible
- ✅ Returns expected status code (default: 200)
- ✅ Response time
- ❌ Fails if: Connection timeout, DNS error, server down, wrong status code

---

### 2. **TCP**
**What it does:**
- Tests if a TCP port is open and accepting connections
- Does NOT send HTTP requests
- Just checks if the port is reachable

**Use for:**
- Database servers (e.g., `database.example.com:5432`)
- Custom TCP services
- Port availability checks
- Non-HTTP services

**Format:** `hostname:port` (e.g., `google.com:80` or `example.com:443`)

**What it checks:**
- ✅ Port is open and accepting connections
- ✅ Connection can be established
- ❌ Fails if: Port is closed, firewall blocking, service down

---

### 3. **Ping**
**What it does:**
- Tests network connectivity using ICMP (Internet Control Message Protocol)
- Checks if a host is reachable on the network
- Note: In this implementation, it uses TCP as a fallback (ICMP requires root/admin)

**Use for:**
- Network connectivity tests
- Server availability checks
- Basic reachability verification

**Format:** `hostname` or `hostname:port` (e.g., `google.com` or `8.8.8.8`)

**What it checks:**
- ✅ Host is reachable
- ✅ Network path exists
- ❌ Fails if: Host unreachable, network issues, firewall blocking

---

## 🎯 4 Test URLs to Try

### 1. **Google (HTTP) - Always Up**
```
Name: Google Homepage
URL: https://www.google.com
Type: http
Check Interval: 60 seconds
Timeout: 10 seconds
```
**Why:** Google is extremely reliable and always up. Perfect for testing that your monitoring works.

---

### 2. **GitHub API (HTTP) - API Endpoint**
```
Name: GitHub API Status
URL: https://api.github.com
Type: http
Check Interval: 60 seconds
Timeout: 10 seconds
Expected Status Code: 200
```
**Why:** Tests API endpoint monitoring. GitHub API is reliable and returns proper HTTP status codes.

---

### 3. **HTTPBin (HTTP) - Test Service**
```
Name: HTTPBin Test
URL: https://httpbin.org/get
Type: http
Check Interval: 60 seconds
Timeout: 10 seconds
```
**Why:** HTTPBin is a service specifically designed for testing HTTP requests. It always responds.

---

### 4. **Google DNS (TCP) - Port Check**
```
Name: Google DNS TCP
URL: 8.8.8.8:53
Type: tcp
Check Interval: 60 seconds
Timeout: 10 seconds
```
**Why:** Tests TCP monitoring. Google's DNS server (8.8.8.8) on port 53 is always available.

---

## 📝 Step-by-Step Testing Guide

### Step 1: Start Both Services

**Terminal 1 - Backend API:**
```bash
cd /Users/sportysofia/Documents/PULSEGRID-V1
./start-backend.sh
```

**Terminal 2 - Health Check Scheduler:**
```bash
cd /Users/sportysofia/Documents/PULSEGRID-V1
./start-scheduler.sh
```

### Step 2: Add Test Services

1. **Open your browser:** http://localhost:5173
2. **Navigate to Services page**
3. **Click "Add Service"**

#### Test 1: Google (HTTP)
- **Name:** `Google Homepage`
- **URL:** `https://www.google.com`
- **Type:** `http`
- **Check Interval:** `60` (seconds)
- **Timeout:** `10` (seconds)
- **Latency Threshold:** (leave empty or set `1000` for 1 second)
- Click **"Create"**

#### Test 2: GitHub API (HTTP)
- **Name:** `GitHub API`
- **URL:** `https://api.github.com`
- **Type:** `http`
- **Check Interval:** `60`
- **Timeout:** `10`
- Click **"Create"**

#### Test 3: HTTPBin (HTTP)
- **Name:** `HTTPBin Test`
- **URL:** `https://httpbin.org/get`
- **Type:** `http`
- **Check Interval:** `60`
- **Timeout:** `10`
- Click **"Create"**

#### Test 4: Google DNS (TCP)
- **Name:** `Google DNS`
- **URL:** `8.8.8.8:53`
- **Type:** `tcp`
- **Check Interval:** `60`
- **Timeout:** `10`
- Click **"Create"**

### Step 3: Verify Services Are Being Checked

**Check Scheduler Logs:**
```bash
tail -f /tmp/pulsegrid-scheduler.log
```

You should see:
```
Checking 4 active services...
✓ Google Homepage: up (123ms)
✓ GitHub API: up (234ms)
✓ HTTPBin Test: up (456ms)
✓ Google DNS: up (12ms)
```

### Step 4: View Data on Dashboard

1. **Go to Dashboard** - You should see all 4 services listed
2. **Click on a service** - View detailed health check data
3. **Check the charts** - Response time and status over time

### Step 5: Test Different Scenarios

#### Test a Down Service:
Add a service that will fail:
```
Name: Invalid Service
URL: https://this-does-not-exist-12345.com
Type: http
Check Interval: 30
Timeout: 5
```

**Expected Result:**
- Status: `DOWN`
- Error message in health checks
- Alert created (check Alerts page)

#### Test Latency Threshold:
Add a service with a low latency threshold:
```
Name: Fast Service Test
URL: https://www.google.com
Type: http
Check Interval: 60
Timeout: 10
Latency Threshold: 100 (ms)
```

**Expected Result:**
- If response time > 100ms, an alert is created
- Check the Alerts page for latency alerts

---

## 🔍 What to Look For

### On Dashboard:
- ✅ Services appear in the list
- ✅ Status shows "UP" or "DOWN"
- ✅ Uptime percentage displayed
- ✅ Average response time shown

### On Service Detail Page:
- ✅ Health check history chart
- ✅ Response time graph
- ✅ Status timeline
- ✅ Recent health checks table

### In Scheduler Logs:
- ✅ Services being checked every 10 seconds
- ✅ Status and response times logged
- ✅ Alerts created when services go down

---

## ⚠️ Common Issues

### "No health check data available"
- **Cause:** Scheduler not running or service just added
- **Fix:** Wait 10-60 seconds, refresh page

### Service shows as "DOWN"
- **Check:** Is the URL correct? (include `http://` or `https://`)
- **Check:** Is the service actually accessible?
- **Check:** Timeout might be too short

### TCP Service Fails
- **Check:** Format is `hostname:port` (e.g., `8.8.8.8:53`)
- **Check:** Port is actually open
- **Check:** Firewall isn't blocking

---

## 🎯 Quick Test Checklist

- [ ] Backend API running (port 8080)
- [ ] Scheduler running (checking services)
- [ ] Added at least one HTTP service
- [ ] Added one TCP service
- [ ] Waited 10-60 seconds
- [ ] Refreshed dashboard
- [ ] Clicked on service to see details
- [ ] Verified health checks are appearing
- [ ] Checked scheduler logs for activity

---

## 📊 Expected Results

After adding the 4 test services and waiting 1-2 minutes:

1. **Google Homepage:** ✅ UP, ~100-500ms response time
2. **GitHub API:** ✅ UP, ~200-400ms response time  
3. **HTTPBin Test:** ✅ UP, ~300-600ms response time
4. **Google DNS:** ✅ UP, ~10-50ms response time (TCP is faster)

All should show:
- Status: UP
- Health checks appearing in history
- Charts showing response times
- Uptime percentage calculated

