# Docker & AWS Deployment Guide - PulseGrid

## 🐳 How Docker Fits Into This Project

### **Docker's Role**

Docker is used to **containerize your backend API** so it can run consistently across different environments (local, staging, production) and be deployed to AWS ECS Fargate.

### **Why Docker?**

1. **Consistency**: Same environment everywhere (dev, staging, prod)
2. **Portability**: Run anywhere Docker runs
3. **Scalability**: Easy to scale containers horizontally
4. **AWS Integration**: ECS Fargate requires containerized applications
5. **Isolation**: Your app runs in its own isolated environment

### **Docker Architecture in PulseGrid**

```
┌─────────────────────────────────┐
│  Docker Build Process           │
├─────────────────────────────────┤
│  1. Build Go binary            │
│  2. Create minimal Alpine image │
│  3. Copy binary to image       │
│  4. Expose port 8080           │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  AWS ECR (Container Registry)  │
│  - Stores Docker images         │
│  - Version control for images   │
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  AWS ECS Fargate               │
│  - Runs your containerized API │
│  - Auto-scales based on load   │
│  - Serverless containers       │
└─────────────────────────────────┘
```

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ **AWS Account** with billing enabled
2. ✅ **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure  # Enter your Access Key ID and Secret
   ```
3. ✅ **Docker** installed
   ```bash
   docker --version
   ```
4. ✅ **Terraform** installed (v1.5+)
   ```bash
   terraform --version
   ```
5. ✅ **Node.js** installed (for frontend build)
6. ✅ **Go** installed (for local testing)

---

## 🚀 Step-by-Step AWS Deployment

### **Phase 1: Prepare Your Environment**

#### 1.1 Set Up AWS Credentials

```bash
# Install AWS CLI (if not installed)
# macOS:
brew install awscli

# Configure AWS credentials
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

#### 1.2 Verify AWS Access

```bash
aws sts get-caller-identity
# Should return your AWS account ID and user info
```

---

### **Phase 2: Deploy Infrastructure with Terraform**

#### 2.1 Navigate to Infrastructure Directory

```bash
cd infrastructure
```

#### 2.2 Configure Terraform Variables

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars  # or use your preferred editor
```

**Required variables in `terraform.tfvars`:**

```hcl
aws_region = "us-east-1"
project_name = "pulsegrid"
environment = "production"

# Database
db_username = "pulsegrid_admin"
db_password = "YOUR_SECURE_PASSWORD_HERE"  # Change this!
db_instance_class = "db.t3.micro"  # Free tier eligible

# Frontend
frontend_bucket_name = "pulsegrid-frontend-unique-name"  # Must be globally unique

# Email (SES)
ses_from_email = "noreply@yourdomain.com"  # Must be verified in SES

# JWT Secret (generate with: openssl rand -base64 32)
jwt_secret = "your-secure-jwt-secret-key-here"
```

#### 2.3 Initialize Terraform

```bash
terraform init
```

This downloads the AWS provider and sets up Terraform.

#### 2.4 Review Deployment Plan

```bash
terraform plan
```

This shows what resources will be created. Review carefully!

**Expected resources:**
- VPC with subnets
- RDS PostgreSQL database
- ECR repositories (for Docker images)
- S3 bucket (for frontend)
- CloudFront distribution
- Security groups
- IAM roles
- Lambda function
- EventBridge rule
- SNS topic

#### 2.5 Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This takes **15-20 minutes** to complete.

**Important outputs to save:**
- RDS endpoint (database host)
- ECR repository URLs
- S3 bucket name
- CloudFront distribution ID

```bash
# Save outputs to a file
terraform output > ../terraform-outputs.txt
```

---

### **Phase 3: Build and Push Docker Image**

#### 3.1 Get ECR Login Token

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"  # Change if different

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

#### 3.2 Build Docker Image

```bash
cd ../backend

# Build the image
docker build -t pulsegrid-backend:latest .

# Tag for ECR
docker tag pulsegrid-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pulsegrid-backend:latest
```

#### 3.3 Push to ECR

```bash
# Push the image
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pulsegrid-backend:latest
```

**Verify in AWS Console:**
- Go to ECR → Repositories → `pulsegrid-backend`
- You should see your image

---

### **Phase 4: Build and Push Docker Image**

**Note:** The ECS cluster, service, task definition, and Application Load Balancer are now automatically created by Terraform. You just need to build and push your Docker image.

#### 4.1 Build and Push Docker Image

Use the provided deployment script:

```bash
./deploy-backend.sh
```

Or manually:

```bash
# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
cd backend
docker build -t pulsegrid-backend:latest .

# Tag for ECR
docker tag pulsegrid-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pulsegrid-backend:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pulsegrid-backend:latest
```

#### 4.2 Verify ECS Service

The ECS service is automatically created by Terraform. After pushing the image, the service will pull it and start running:

```bash
# Check service status
aws ecs describe-services \
  --cluster pulsegrid-cluster \
  --services pulsegrid-backend

# Get ALB DNS name (your API endpoint)
cd infrastructure
terraform output alb_dns_name
```

---

### **Phase 5: Deploy Frontend to S3/CloudFront**

#### 5.1 Deploy Frontend

Use the provided deployment script:

```bash
./deploy-frontend.sh
```

Or manually:

```bash
# Build frontend
cd frontend
npm install
npm run build

# Get S3 bucket name
cd ../infrastructure
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)

# Upload to S3
cd ../frontend
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CF_DIST_ID \
  --paths "/*"
```

**Wait 5-10 minutes** for CloudFront to propagate.

---

### **Phase 6: Configure Frontend API Endpoint**

#### 6.1 Get Backend API URL

The Application Load Balancer is automatically created by Terraform. Get the ALB DNS name:

```bash
cd infrastructure
terraform output alb_dns_name
# Example: pulsegrid-alb-123456789.us-east-1.elb.amazonaws.com
```

#### 6.2 Update Frontend Environment

Create `frontend/.env.production`:

```env
VITE_API_URL=http://YOUR_ALB_DNS_NAME/api/v1
```

**Note:** Replace `YOUR_ALB_DNS_NAME` with the ALB DNS name from Terraform output.

#### 6.3 Rebuild and Redeploy Frontend

```bash
cd frontend
npm run build

cd ../infrastructure
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)

cd ../frontend
aws s3 sync dist/ s3://$S3_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

---

### **Phase 7: Configure AWS Services**

#### 7.1 Verify SES Email

1. Go to AWS SES Console → Verified identities
2. Verify your email address (check inbox for verification email)
3. Move out of sandbox (if needed for production) - Request production access

#### 7.2 Configure SNS

1. Go to SNS Console → Topics → `pulsegrid-alerts`
2. Create subscriptions:
   - **SMS**: Phone number subscription
   - **Slack**: HTTPS webhook subscription
3. Note the topic ARN (already in Terraform outputs)

#### 7.3 Environment Variables

All environment variables are automatically configured in the ECS task definition via Terraform:
- Database connection (from RDS)
- JWT secret (from terraform.tfvars)
- CORS origin (from CloudFront)
- AWS service endpoints

**No manual configuration needed!** ✅

---

## 🔄 Updating Your Deployment

### **Update Backend (After Code Changes)**

**Easy way (using script):**
```bash
./deploy-backend.sh
```

**Manual way:**
```bash
# 1. Build new Docker image
cd backend
docker build -t pulsegrid-backend:latest .

# 2. Tag and push
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
docker tag pulsegrid-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pulsegrid-backend:latest

# 3. Login and push
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/pulsegrid-backend:latest

# 4. Force new deployment
aws ecs update-service \
  --cluster pulsegrid-cluster \
  --service pulsegrid-backend \
  --force-new-deployment \
  --region $AWS_REGION
```

### **Update Frontend (After Code Changes)**

**Easy way (using script):**
```bash
./deploy-frontend.sh
```

**Manual way:**
```bash
cd frontend
npm run build

# Get values from Terraform
cd ../infrastructure
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)

# Upload and invalidate
cd ../frontend
aws s3 sync dist/ s3://$S3_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

---

## 🧪 Testing Your Deployment

### **Test Backend API**

```bash
# Get your API endpoint from Terraform
cd infrastructure
API_URL="http://$(terraform output -raw alb_dns_name)"

# Health check
curl $API_URL/api/v1/health

# Test registration
curl -X POST $API_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User",
    "org_name": "Test Org"
  }'
```

### **Test Frontend**

```bash
# Get CloudFront URL
cd infrastructure
CF_URL="https://$(terraform output -raw cloudfront_domain_name)"
echo "Frontend URL: $CF_URL"
```

1. Open the CloudFront URL in your browser
2. Try registering a new user
3. Add a service to monitor
4. Check dashboard for real-time data

---

## 📊 Monitoring & Logs

### **View ECS Logs**

```bash
# View logs in CloudWatch
aws logs tail /ecs/pulsegrid-backend --follow
```

### **View ECS Service Status**

```bash
aws ecs describe-services \
  --cluster pulsegrid-cluster \
  --services pulsegrid-backend
```

### **View RDS Status**

```bash
aws rds describe-db-instances --db-instance-identifier pulsegrid-db
```

---

## 💰 Cost Estimation

**Free Tier Eligible:**
- RDS: `db.t3.micro` (750 hours/month)
- Lambda: 1M requests/month
- S3: 5GB storage
- CloudFront: 50GB data transfer

**Estimated Monthly Cost (Beyond Free Tier):**
- ECS Fargate: ~$15-30/month (0.25 vCPU, 0.5GB RAM)
- RDS: ~$15/month (if exceeds free tier)
- S3: ~$1-5/month
- CloudFront: ~$1-10/month
- **Total: ~$30-60/month** (for small-scale usage)

---

## 🛠️ Troubleshooting

### **Docker Build Fails**
```bash
# Check Docker is running
docker ps

# Clean build
docker build --no-cache -t pulsegrid-backend:latest .
```

### **ECS Service Won't Start**
- Check CloudWatch logs
- Verify environment variables
- Check security group allows port 8080
- Verify task definition is correct

### **Frontend Not Loading**
- Check S3 bucket permissions
- Verify CloudFront distribution is deployed
- Check browser console for errors
- Verify API endpoint in environment variables

### **Database Connection Issues**
- Verify RDS security group allows ECS subnet
- Check database credentials
- Verify RDS is in same VPC as ECS

---

## 🎯 Quick Deployment Checklist

- [ ] AWS CLI configured
- [ ] Terraform initialized
- [ ] `terraform.tfvars` configured
- [ ] Infrastructure deployed (`terraform apply`)
- [ ] Docker image built and pushed to ECR
- [ ] ECS task definition created
- [ ] ECS service running
- [ ] Frontend built and uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] SES email verified
- [ ] SNS configured
- [ ] Environment variables set correctly
- [ ] API endpoint accessible
- [ ] Frontend loads correctly
- [ ] Can register/login
- [ ] Can add services
- [ ] Health checks running

---

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Documentation](https://docs.docker.com/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## 🎉 Success!

Once deployed, your PulseGrid platform will be:
- ✅ Running on AWS infrastructure
- ✅ Scalable and highly available
- ✅ Accessible globally via CloudFront
- ✅ Secure with proper networking
- ✅ Cost-optimized with serverless components

**Your production-ready monitoring platform is live!** 🚀

