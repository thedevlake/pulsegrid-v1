# PulseGrid Setup Guide

This guide will help you set up PulseGrid for local development.

## Prerequisites

- **Go 1.21+**: [Install Go](https://golang.org/doc/install)
- **Node.js 18+**: [Install Node.js](https://nodejs.org/)
- **PostgreSQL 14+**: [Install PostgreSQL](https://www.postgresql.org/download/)
- **Docker** (optional): For containerized deployment
- **AWS CLI** (for deployment): [Install AWS CLI](https://aws.amazon.com/cli/)

## Local Development Setup

### 1. Database Setup

1. Create a PostgreSQL database:
   ```bash
   createdb pulsegrid
   ```

2. Or using psql:
   ```sql
   CREATE DATABASE pulsegrid;
   ```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=pulsegrid
   JWT_SECRET=your-secret-key-change-in-production
   ```

5. Run the backend:
   ```bash
   go run cmd/api/main.go
   ```

   The API will be available at `http://localhost:8080`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local`:
   ```env
   VITE_API_URL=http://localhost:8080/api/v1
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000` (or the port Vite assigns)

### 4. Worker Setup (Optional for Local Development)

The health check workers are designed to run as AWS Lambda functions. For local testing:

1. Navigate to the workers directory:
   ```bash
   cd workers
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. You can test the health checker directly or use AWS SAM for local Lambda testing.

## Testing the Application

1. **Start the backend**: `cd backend && go run cmd/api/main.go`
2. **Start the frontend**: `cd frontend && npm run dev`
3. **Open browser**: Navigate to `http://localhost:3000`
4. **Register**: Create a new account
5. **Add Service**: Add a service to monitor (e.g., `https://www.google.com`)
6. **View Dashboard**: Check the dashboard for service status

## Project Structure

```
PULSEGRID-V1/
├── backend/              # Go API server
│   ├── cmd/
│   │   └── api/          # Main application entry
│   ├── internal/
│   │   ├── api/          # HTTP handlers and routes
│   │   ├── config/       # Configuration management
│   │   ├── database/    # Database connection and migrations
│   │   ├── models/      # Data models
│   │   └── repository/  # Data access layer
│   └── go.mod
├── frontend/             # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # State management
│   │   └── lib/          # Utilities
│   └── package.json
├── workers/              # Lambda functions
│   ├── cmd/
│   │   └── lambda/       # Lambda handler
│   └── internal/
│       ├── checker/      # Health check logic
│       └── notifier/     # Notification logic
├── infrastructure/       # Terraform configurations
└── README.md
```

## API Endpoints

### Public Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/health` - Health check

### Protected Endpoints (require JWT token)
- `GET /api/v1/services` - List services
- `POST /api/v1/services` - Create service
- `GET /api/v1/services/:id` - Get service details
- `PUT /api/v1/services/:id` - Update service
- `DELETE /api/v1/services/:id` - Delete service
- `GET /api/v1/services/:id/health-checks` - Get health check history
- `GET /api/v1/services/:id/stats` - Get service statistics
- `GET /api/v1/stats/overview` - Get overview statistics
- `GET /api/v1/alerts` - List alerts
- `GET /api/v1/services/:id/reports/csv` - Export CSV report

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `psql -l | grep pulsegrid`

### Backend Issues
- Check logs for error messages
- Verify all environment variables are set
- Ensure port 8080 is not in use

### Frontend Issues
- Clear browser cache
- Check browser console for errors
- Verify API URL in `.env.local`
- Ensure backend is running

## Next Steps

1. Review the [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS deployment
2. Check [README.md](./README.md) for project overview
3. Explore the codebase to understand the architecture

## Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

