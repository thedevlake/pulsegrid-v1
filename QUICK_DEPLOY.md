# Quick Deployment Guide - PulseGrid

## 🐳 Docker's Role (Simple Explanation)

**Docker = Package your backend app in a container**

Think of Docker like a shipping container:
- Your Go backend code goes inside
- All dependencies are included
- It runs the same way everywhere (your laptop, AWS, anywhere)
- AWS ECS Fargate runs these containers

**Flow:**
```
Your Code → Docker Build → Docker Image → AWS ECR (Storage) → AWS ECS (Runs it)
```

---

## 🚀 Quick Deployment Steps

### **1. Prerequisites Check**
```bash
# Verify you have these installed
docker --version
aws --version
terraform --version
node --version
```

### **2. Configure AWS**
```bash
aws configure
# Enter your AWS Access Key ID and Secret
```

### **3. Deploy Infrastructure (One Time)**
```bash
cd infrastructure

# Copy and edit configuration
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Deploy everything
terraform init
terraform plan  # Review what will be created
terraform apply  # Type 'yes' to confirm
```

**This creates:**
- ✅ VPC, subnets, security groups
- ✅ RDS PostgreSQL database
- ✅ ECR repositories (for Docker images)
- ✅ S3 bucket + CloudFront (for frontend)
- ✅ ECS cluster + service + load balancer
- ✅ Lambda + EventBridge (for health checks)
- ✅ SNS + SES (for notifications)

**Takes ~15-20 minutes**

### **4. Deploy Backend (Docker)**
```bash
# Easy way - use the script
./deploy-backend.sh

# This does:
# 1. Builds Docker image
# 2. Pushes to AWS ECR
# 3. Updates ECS service to pull new image
```

### **5. Deploy Frontend**
```bash
# Easy way - use the script
./deploy-frontend.sh

# This does:
# 1. Builds React app
# 2. Uploads to S3
# 3. Invalidates CloudFront cache
```

### **6. Get Your URLs**
```bash
cd infrastructure
terraform output

# You'll see:
# - CloudFront URL (frontend)
# - ALB DNS name (backend API)
```

### **7. Configure Frontend API Endpoint**
```bash
# Get ALB DNS name
cd infrastructure
ALB_DNS=$(terraform output -raw alb_dns_name)

# Create frontend/.env.production
echo "VITE_API_URL=http://$ALB_DNS/api/v1" > ../frontend/.env.production

# Rebuild and redeploy frontend
cd ../frontend
npm run build
cd ../infrastructure
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)
cd ../frontend
aws s3 sync dist/ s3://$S3_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

---

## 📝 What Each Component Does

### **Docker**
- Packages your Go backend
- Makes it portable and consistent
- Required for AWS ECS

### **AWS ECR (Elastic Container Registry)**
- Stores your Docker images
- Like GitHub, but for containers

### **AWS ECS Fargate**
- Runs your Docker containers
- Serverless (no servers to manage)
- Auto-scales based on load

### **AWS RDS**
- Managed PostgreSQL database
- Automatic backups
- High availability

### **AWS S3 + CloudFront**
- S3: Stores frontend files
- CloudFront: Global CDN (fast loading worldwide)

### **AWS ALB (Application Load Balancer)**
- Routes traffic to your backend
- Health checks
- SSL termination

---

## 🔄 Updating After Code Changes

### **Backend Changes:**
```bash
./deploy-backend.sh
```

### **Frontend Changes:**
```bash
./deploy-frontend.sh
```

---

## 💰 Cost Estimate

**Free Tier (First Year):**
- RDS: Free (750 hours/month)
- Lambda: Free (1M requests/month)
- S3: Free (5GB storage)
- CloudFront: Free (50GB transfer)

**After Free Tier:**
- ~$30-60/month for small usage

---

## 🆘 Common Issues

**Docker build fails:**
- Make sure Docker is running: `docker ps`

**ECS service won't start:**
- Check CloudWatch logs
- Verify environment variables in task definition

**Frontend not loading:**
- Wait 10 minutes for CloudFront
- Check S3 bucket permissions

**Can't connect to database:**
- Verify security groups allow ECS → RDS
- Check RDS is in same VPC

---

## ✅ Deployment Checklist

- [ ] AWS CLI configured
- [ ] Terraform initialized
- [ ] `terraform.tfvars` configured
- [ ] Infrastructure deployed
- [ ] Docker image pushed to ECR
- [ ] ECS service running
- [ ] Frontend uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Frontend API endpoint configured
- [ ] Can access frontend URL
- [ ] Can register/login
- [ ] Services can be added

---

## 📚 Full Documentation

For detailed instructions, see:
- `DOCKER_AWS_DEPLOYMENT.md` - Complete deployment guide
- `AWS_DEPLOYMENT_GUIDE.md` - AWS architecture details
- `infrastructure/README.md` - Terraform configuration

---

**That's it! Your platform is now running on AWS! 🎉**

