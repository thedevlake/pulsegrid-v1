# Docker & AWS Deployment - Simple Explanation

## 🐳 What is Docker and Why Do We Need It?

### **The Problem Docker Solves**

**Without Docker:**
- "It works on my machine" 😅
- Different environments = different problems
- Hard to deploy consistently
- Difficult to scale

**With Docker:**
- ✅ Works the same everywhere
- ✅ Package everything together
- ✅ Easy to deploy
- ✅ Easy to scale

### **Docker in Simple Terms**

Think of Docker like a **shipping container**:

```
┌─────────────────────────────┐
│   Docker Container          │
│  ┌───────────────────────┐ │
│  │  Your Go Backend       │ │
│  │  + All Dependencies    │ │
│  │  + Runtime Environment │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

**Key Benefits:**
1. **Isolation**: Your app runs in its own environment
2. **Portability**: Run on any machine with Docker
3. **Consistency**: Same behavior everywhere
4. **Scalability**: Run multiple copies easily

---

## 🏗️ How Docker Works in PulseGrid

### **Step 1: Build Docker Image**

```bash
cd backend
docker build -t pulsegrid-backend:latest .
```

**What happens:**
1. Docker reads `Dockerfile`
2. Starts with Go base image
3. Copies your code
4. Compiles Go binary
5. Creates final image with just the binary

**Result:** A lightweight image (~20MB) with your compiled app

### **Step 2: Push to AWS ECR**

```bash
# Login to AWS container registry
aws ecr get-login-password | docker login ...

# Push image
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/pulsegrid-backend:latest
```

**ECR = AWS Container Registry**
- Like Docker Hub, but private
- Stores your images securely
- Integrates with ECS

### **Step 3: ECS Fargate Runs It**

**ECS Fargate = Serverless Container Platform**
- Pulls image from ECR
- Runs container automatically
- Manages scaling
- Handles networking

**You don't manage servers!** 🎉

---

## ☁️ AWS Deployment Architecture

### **Complete Flow:**

```
┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CloudFront (CDN)                           │
│         - Global content delivery                        │
│         - HTTPS/SSL                                      │
│         - Fast loading worldwide                        │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────────┐
│   S3 Bucket     │    │  Application Load    │
│  (Frontend)     │    │  Balancer (ALB)      │
│  - React files  │    │  - Routes API calls  │
└─────────────────┘    └──────────┬───────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │    ECS Fargate Service      │
                    │  ┌───────────────────────┐ │
                    │  │  Docker Container      │ │
                    │  │  - Go Backend API      │ │
                    │  │  - Port 8080           │ │
                    │  └───────────────────────┘ │
                    └──────────┬────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────┐
                    │   RDS PostgreSQL           │
                    │   - Database                │
                    │   - Private subnet          │
                    └─────────────────────────────┘
```

---

## 📦 What Gets Deployed Where

### **Frontend (React)**
- **Build:** `npm run build` → Creates `dist/` folder
- **Storage:** AWS S3 bucket
- **Delivery:** CloudFront CDN
- **URL:** `https://xxxxx.cloudfront.net`

### **Backend (Go)**
- **Build:** `docker build` → Creates Docker image
- **Storage:** AWS ECR (container registry)
- **Runtime:** ECS Fargate (runs containers)
- **Access:** Application Load Balancer
- **URL:** `http://xxxxx.elb.amazonaws.com`

### **Database**
- **Service:** AWS RDS PostgreSQL
- **Location:** Private subnet (secure)
- **Access:** Only from ECS tasks

### **Workers (Health Checks)**
- **Runtime:** AWS Lambda (serverless)
- **Trigger:** EventBridge (scheduled)
- **Function:** Check service health

---

## 🔄 Deployment Process

### **Initial Deployment (One Time)**

```bash
# 1. Deploy infrastructure
cd infrastructure
terraform apply
# Creates: VPC, RDS, ECR, S3, CloudFront, ECS, ALB, etc.

# 2. Build and push Docker image
./deploy-backend.sh
# Builds → Tags → Pushes to ECR → Updates ECS

# 3. Deploy frontend
./deploy-frontend.sh
# Builds → Uploads to S3 → Invalidates CloudFront
```

### **Updating After Code Changes**

**Backend:**
```bash
./deploy-backend.sh
# Takes ~5 minutes
```

**Frontend:**
```bash
./deploy-frontend.sh
# Takes ~2 minutes + CloudFront propagation
```

---

## 🎯 Key AWS Services Explained

### **1. ECR (Elastic Container Registry)**
- **What:** Stores Docker images
- **Why:** Need a place to store your container images
- **Cost:** ~$0.10 per GB/month

### **2. ECS Fargate**
- **What:** Runs Docker containers without managing servers
- **Why:** Serverless = no server management
- **Cost:** ~$0.04 per vCPU-hour + $0.004 per GB-hour

### **3. Application Load Balancer (ALB)**
- **What:** Routes traffic to your backend
- **Why:** Single entry point, health checks, SSL
- **Cost:** ~$0.0225 per hour + data transfer

### **4. RDS PostgreSQL**
- **What:** Managed database
- **Why:** Automatic backups, high availability
- **Cost:** Free tier (db.t3.micro) or ~$15/month

### **5. S3 + CloudFront**
- **S3:** File storage for frontend
- **CloudFront:** Global CDN for fast delivery
- **Cost:** S3 ~$0.023/GB, CloudFront ~$0.085/GB

---

## 💡 Why This Architecture?

### **Scalability**
- ECS auto-scales containers
- Lambda auto-scales functions
- CloudFront handles global traffic

### **Reliability**
- Multi-AZ deployment
- Automatic failover
- Health checks

### **Security**
- Private subnets for database
- Security groups (firewalls)
- IAM roles (permissions)
- HTTPS everywhere

### **Cost Efficiency**
- Pay only for what you use
- Serverless = no idle costs
- Free tier for development

---

## 🚀 Quick Start Commands

```bash
# 1. Deploy everything (first time)
cd infrastructure
terraform init
terraform apply

# 2. Deploy backend
./deploy-backend.sh

# 3. Deploy frontend
./deploy-frontend.sh

# 4. Get URLs
cd infrastructure
terraform output
```

---

## 📚 Learn More

- **Docker:** https://docs.docker.com/
- **AWS ECS:** https://docs.aws.amazon.com/ecs/
- **Terraform:** https://www.terraform.io/docs

---

**In Summary:**
- **Docker** = Package your app
- **ECR** = Store the package
- **ECS** = Run the package
- **Terraform** = Automate everything

**Result:** Production-ready, scalable, cloud-native platform! 🎉

