# Docker Setup Guide - PulseGrid

This guide explains how to run PulseGrid using Docker and Docker Compose for both local development and production deployments.

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 Quick Start with Docker Compose

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PULSEGRID-V1
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**

```env
# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pulsegrid

# Backend Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pulsegrid
DB_SSLMODE=disable
PORT=8080
ENV=development
JWT_SECRET=your-secure-random-string-here
CORS_ORIGIN=http://localhost:3000

# Frontend Configuration
VITE_API_URL=http://localhost:8080/api/v1
```

### 3. Start All Services

```bash
docker-compose up
```

This will start:
- **PostgreSQL** database on port 5432
- **Backend API** on port 8080
- **Frontend** on port 3000

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Health Check: http://localhost:8080/api/v1/health

## 🔧 Development Mode with Hot Reload

For development with hot reload (code changes reflect immediately):

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Development Mode Features:**
- Frontend: Vite dev server with hot module replacement
- Backend: Source code mounted for live reload (requires Go tool like `air` for auto-reload)
- Faster iteration cycle

## 📦 Building Individual Images

### Backend Image

```bash
cd backend
docker build -t pulsegrid-backend:latest .
```

### Frontend Image

```bash
cd frontend
docker build -t pulsegrid-frontend:latest .
```

## 🐳 Docker Compose Services

### PostgreSQL Service

- **Image:** `postgres:15-alpine`
- **Port:** 5432 (internal only, not exposed to host by default)
- **Volume:** `postgres_data` (persistent data storage)
- **Health Check:** Checks database readiness

### Backend Service

- **Build:** `./backend/Dockerfile`
- **Port:** 8080
- **Health Check:** HTTP GET to `/api/v1/health`
- **Depends on:** PostgreSQL (waits for healthy database)

### Frontend Service

- **Build:** `./frontend/Dockerfile`
- **Port:** 3000 (mapped to container port 80)
- **Depends on:** Backend (waits for healthy backend)

## 🔍 Useful Docker Commands

### View Running Containers

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Follow logs
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes

```bash
docker-compose down -v
```

**Warning:** This will delete all database data!

### Rebuild Images

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild without cache
docker-compose build --no-cache
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec postgres psql -U postgres -d pulsegrid
```

### Run Database Migrations

```bash
# Migrations run automatically on backend startup
# Or run manually:
docker-compose exec backend ./api
```

## 🏭 Production Deployment

### Building Production Images

```bash
# Backend
cd backend
docker build -t pulsegrid-backend:latest .

# Frontend
cd frontend
docker build -t pulsegrid-frontend:latest .
```

### Production Environment Variables

For production, ensure these are set:

```env
ENV=production
JWT_SECRET=<strong-random-secret>
DB_SSLMODE=require
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api/v1
```

### Pushing to Container Registry

```bash
# Tag for registry
docker tag pulsegrid-backend:latest your-registry/pulsegrid-backend:latest
docker tag pulsegrid-frontend:latest your-registry/pulsegrid-frontend:latest

# Push to registry
docker push your-registry/pulsegrid-backend:latest
docker push your-registry/pulsegrid-frontend:latest
```

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong JWT secrets** - Generate with: `openssl rand -base64 32`
3. **Enable SSL for database** - Set `DB_SSLMODE=require` in production
4. **Use secrets management** - Consider Docker secrets or external secret managers
5. **Keep images updated** - Regularly update base images for security patches

## 🐛 Troubleshooting

### Port Already in Use

If ports 3000, 8080, or 5432 are already in use:

```bash
# Edit docker-compose.yml and change port mappings
ports:
  - "3001:3000"  # Change host port
```

### Database Connection Issues

1. Check PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

3. Verify environment variables:
   ```bash
   docker-compose exec backend env | grep DB_
   ```

### Frontend Can't Connect to Backend

1. Verify `VITE_API_URL` is correct
2. Check backend is running:
   ```bash
   curl http://localhost:8080/api/v1/health
   ```
3. Check CORS settings in backend

### Container Won't Start

1. Check logs:
   ```bash
   docker-compose logs <service-name>
   ```

2. Verify Dockerfile syntax:
   ```bash
   docker build -t test ./backend
   ```

3. Check disk space:
   ```bash
   docker system df
   ```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Backend Dockerfile](./backend/Dockerfile)
- [Frontend Dockerfile](./frontend/Dockerfile)

## 🎯 Next Steps

After getting Docker setup working:

1. **Set up AWS deployment** - See [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)
2. **Configure CI/CD** - Automate builds and deployments
3. **Set up monitoring** - Add logging and metrics collection
4. **Optimize images** - Reduce image sizes for faster deployments

