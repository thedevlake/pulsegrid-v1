# PulseGrid - Cloud-Native Local Infrastructure Monitoring Platform

A full-stack, cloud-native monitoring platform that tracks the health, uptime, latency, and performance of web and cloud services.

## 🚀 Features

- **Service Monitoring**: Track uptime and performance of URLs, APIs, and IPs
- **Real-time Alerts**: Email, SMS, and Slack notifications during downtime
- **Interactive Dashboards**: Visualize real-time analytics and historical trends
- **Performance Reports**: Export weekly/monthly summaries as PDF or CSV
- **Multi-tenant**: Secure data isolation by organization
- **Cloud-Native**: Built on AWS with auto-scaling capabilities

## 🏗️ Architecture

- **Frontend**: React.js + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Go (Gin Framework) REST API
- **Database**: PostgreSQL (RDS)
- **Workers**: AWS Lambda (Go) for scheduled health checks
- **Infrastructure**: Terraform for AWS deployment
- **Notifications**: AWS SNS + SES
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
PULSEGRID-V1/
├── backend/          # Go API server
├── frontend/         # React application
├── workers/          # Lambda functions for health checks
├── infrastructure/   # Terraform configurations
├── scripts/          # Deployment and utility scripts
└── docs/             # Documentation
```

## 🛠️ Setup Instructions

### Prerequisites

**For Docker (Recommended):**
- Docker 20.10+
- Docker Compose 2.0+

**For Manual Setup:**
- Go 1.21+
- Node.js 18+
- PostgreSQL 14+
- Terraform 1.5+
- AWS CLI configured

### Backend Setup

```bash
cd backend
go mod download
cp .env.example .env
# Edit .env with your database and AWS credentials
go run cmd/api/main.go
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API endpoint
npm run dev
```

### Infrastructure Deployment

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

## 🔐 Environment Variables

See `.env.example` files in each directory for required environment variables.

## 📚 Documentation

- [Docker Setup Guide](./DOCKER_SETUP.md) - 🐳 Run with Docker and Docker Compose
- [Docker & AWS Deployment](./DOCKER_AWS_DEPLOYMENT.md) - ☁️ Complete deployment guide
- [Email Setup Guide](./EMAIL_SETUP.md) - 📧 Configure email notifications
- [Infrastructure README](./infrastructure/README.md) - 🏗️ Terraform configuration details

## 🎯 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
2. **Create `.env` file** (see [DOCKER_SETUP.md](./DOCKER_SETUP.md))
3. **Start all services**: `docker-compose up`
4. **Access**: Open `http://localhost:3000` in your browser

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker instructions.

### Option 2: Manual Setup

1. **Clone the repository**
2. **Set up the database** (PostgreSQL)
3. **Configure backend** (see Backend Setup section above)
4. **Configure frontend** (see Frontend Setup section above)
5. **Start backend**: `cd backend && go run cmd/api/main.go`
6. **Start frontend**: `cd frontend && npm run dev`
7. **Access**: Open `http://localhost:5173` in your browser

## 🔧 What You Need to Provide

### For Local Development
- PostgreSQL database instance
- JWT secret key (generate a secure random string)
- CORS origin (default: http://localhost:3000)

### For AWS Deployment
- AWS Account with appropriate permissions
- AWS Access Key ID and Secret Access Key
- Verified email address in AWS SES (for email notifications)
- SNS Topic ARN (for SMS/Slack notifications)
- Unique S3 bucket name for frontend
- Domain name (optional, for custom CloudFront distribution)

### Manual AWS Configuration Required
1. **SES Email Verification**: Verify your email address in AWS SES Console
2. **SNS Subscriptions**: Configure SMS/Slack webhooks in SNS Console
3. **Domain Setup** (Optional): Configure custom domain for CloudFront
4. **SSL Certificate** (Optional): Request ACM certificate for custom domain

## 🏗️ Architecture Overview

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│  (S3+CF)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │ (Go + Gin)
│  (ECS/EB)   │
└──────┬──────┘
       │
       ├──► PostgreSQL (RDS)
       │
       └──► AWS Services
            ├── SNS (Alerts)
            ├── SES (Email)
            └── Lambda (Health Checks)
```

## 📋 Features Implemented

✅ User authentication (JWT)  
✅ Service registration and management  
✅ Health checks (HTTP, TCP, Ping)  
✅ Real-time dashboard with charts  
✅ Alert system (Email, SMS, Slack)  
✅ Multi-tenant data isolation  
✅ CSV report export  
✅ AWS infrastructure (Terraform)  
✅ CI/CD pipeline (GitHub Actions)  

## 🚧 Future Enhancements

- PDF report generation
- AI-driven incident prediction
- Native mobile app
- GraphQL API support
- Public status pages
- Multi-cloud support

## 📝 License

MIT

## 👤 Author

Sofia Ali Salahudeen

## 🙏 Acknowledgments

Built as a portfolio project demonstrating full-stack development, cloud engineering, and DevOps practices.

