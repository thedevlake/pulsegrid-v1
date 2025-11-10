# Admin Panel Setup Guide

## Issue: 404 Errors on Admin Endpoints

If you're seeing 404 errors when accessing the Admin Panel, follow these steps:

### 1. Ensure Backend Server is Running

The backend server must be running for the admin endpoints to work. Start it with:

```bash
cd backend
go run cmd/api/main.go
```

Or if you have a compiled binary:

```bash
cd backend
./bin/api
```

The server should start on port 8080 (or the port specified in your `.env` file).

### 2. Verify Admin Routes are Registered

The admin routes are registered in `backend/internal/api/server.go`:
- `/api/v1/admin/metrics` - System metrics
- `/api/v1/admin/users` - User management (GET, POST, PUT, DELETE)
- `/api/v1/admin/organizations` - Organization listing

### 3. Check Your User Role

To access the Admin Panel, your user account must have the `admin` or `super_admin` role.

**Note:** When you register a new account, it automatically gets the `admin` role (see `backend/internal/api/handlers/auth_handler.go` line 82).

### 4. Verify Authentication

Make sure you're logged in and your JWT token includes the admin role. You can check this in your browser's developer console:

```javascript
// In browser console
const auth = JSON.parse(localStorage.getItem('auth-storage'));
console.log(auth.state.user.role); // Should be 'admin'
```

### 5. Test the Endpoints Directly

You can test if the backend is running by checking the health endpoint:

```bash
curl http://localhost:8080/api/v1/health
```

And test an admin endpoint (replace YOUR_TOKEN with your JWT token):

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/admin/metrics
```

### 6. Common Issues

- **404 Error**: Backend server not running or routes not registered
- **403 Error**: User doesn't have admin role
- **401 Error**: Not authenticated or token expired
- **500 Error**: Database connection issue or server error

### 7. Restart Backend Server

If you've made changes to the backend code, restart the server:

1. Stop the current server (Ctrl+C)
2. Rebuild if needed: `cd backend && go build ./cmd/api`
3. Start again: `go run cmd/api/main.go`

## Admin Panel Features

Once the backend is running, the Admin Panel provides:

- **Overview Tab**: System metrics and statistics
- **Users Tab**: Full CRUD operations for user management
  - Create new users
  - Edit existing users
  - Delete users
- **Organizations Tab**: View all organizations

All operations include success/error notifications and automatic data refresh.

