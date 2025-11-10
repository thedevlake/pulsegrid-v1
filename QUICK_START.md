# Quick Start Guide

A condensed guide to get PulseGrid running quickly.

## 🚀 5-Minute Local Setup

### 1. PostgreSQL (2 minutes)

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14
createdb pulsegrid

# Or use Docker
docker run --name pulsegrid-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pulsegrid -p 5432:5432 -d postgres:14
```

### 2. Generate JWT Secret (30 seconds)

```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 3. Backend Setup (1 minute)

```bash
cd backend
go mod download
cp .env.example .env
```

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pulsegrid
JWT_SECRET=paste_your_generated_secret_here
CORS_ORIGIN=http://localhost:5173
```

### 4. Frontend Setup (1 minute)

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8080/api/v1
```

### 5. Run (30 seconds)

```bash
# Terminal 1 - Backend
cd backend
go run cmd/api/main.go

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173 (or the port Vite shows)

---

## ☁️ AWS Deployment Setup

### 1. AWS Account (5 minutes)

1. Create account at https://aws.amazon.com
2. Create IAM user with these policies:
   - AmazonS3FullAccess
   - AmazonRDSFullAccess
   - AWSLambda_FullAccess
   - AmazonSNSFullAccess
   - AmazonSESFullAccess
   - AmazonEC2ContainerRegistryFullAccess
   - CloudFrontFullAccess
   - AmazonEventBridgeFullAccess
3. Create access keys and save them

### 2. Configure AWS CLI (1 minute)

```bash
aws configure
# Enter: Access Key ID, Secret Key, Region (us-east-1), Format (json)
```

### 3. Verify Email in SES (2 minutes)

1. Go to AWS Console → SES
2. Click "Verified identities" → "Create identity"
3. Enter your email
4. Click verification link in email

### 4. Generate S3 Bucket Name (30 seconds)

Choose a unique name:
```bash
# Example
pulsegrid-frontend-yourname-2024
```

### 5. Terraform Setup (2 minutes)

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region = "us-east-1"
db_instance_class = "db.t3.micro"
db_username = "postgres"
db_password = "CHANGE_TO_SECURE_PASSWORD"
frontend_bucket_name = "pulsegrid-frontend-your-unique-name"
ses_from_email = "your-verified-email@example.com"
```

### 6. Deploy (10 minutes)

```bash
terraform init
terraform plan
terraform apply
```

---

## 📋 Configuration Checklist

### Local Development
- [ ] PostgreSQL installed and running
- [ ] Database `pulsegrid` created
- [ ] JWT secret generated
- [ ] Backend `.env` configured
- [ ] Frontend `.env.local` configured

### AWS Deployment
- [ ] AWS account created
- [ ] IAM user with access keys
- [ ] AWS CLI configured
- [ ] Email verified in SES
- [ ] Unique S3 bucket name chosen
- [ ] Terraform variables configured

---

## 🔧 Common Commands

### Database
```bash
# Check if running
pg_isready

# Connect
psql -U postgres -d pulsegrid

# List databases
psql -U postgres -l
```

### AWS
```bash
# Test credentials
aws sts get-caller-identity

# List verified emails
aws ses list-verified-email-addresses

# Check S3 bucket availability
aws s3api head-bucket --bucket your-bucket-name
```

### Development
```bash
# Backend
cd backend && go run cmd/api/main.go

# Frontend
cd frontend && npm run dev

# Install dependencies
cd backend && go mod download
cd frontend && npm install
```

---

## 🆘 Quick Troubleshooting

**PostgreSQL won't start:**
```bash
# macOS
brew services restart postgresql@14

# Linux
sudo systemctl restart postgresql
```

**AWS credentials not working:**
```bash
aws configure list
aws sts get-caller-identity
```

**Port already in use:**
```bash
# Change port in backend/.env
PORT=8081

# Or kill process
lsof -ti:8080 | xargs kill
```

**Database connection error:**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists: `createdb pulsegrid`

---

## 📚 Full Documentation

- [REQUIREMENTS_SETUP.md](./REQUIREMENTS_SETUP.md) - Detailed setup for each requirement
- [SETUP.md](./SETUP.md) - Complete local development guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - AWS deployment guide
- [README.md](./README.md) - Project overview

---

## ✅ Ready to Go?

1. Complete local setup (5 minutes)
2. Test locally
3. Set up AWS (if deploying)
4. Deploy to AWS (when ready)

Happy coding! 🎉

