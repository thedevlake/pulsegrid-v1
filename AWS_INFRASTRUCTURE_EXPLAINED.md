# AWS Infrastructure & Terraform - Explained

## Do You Need AWS Infrastructure in the App?

**No!** The app doesn't need to configure AWS infrastructure directly. Here's why:

## Architecture Layers

### 1. **Infrastructure Layer (Terraform)**
Terraform handles all AWS infrastructure provisioning:

- **Compute**: ECS Fargate tasks, Lambda functions
- **Network**: VPC, subnets, security groups, load balancers, API Gateway
- **Storage**: RDS PostgreSQL, S3 buckets
- **Global**: CloudFront CDN, Route 53 DNS
- **Monitoring**: CloudWatch, CloudTrail
- **Security**: IAM roles, KMS encryption, WAF

**Location**: `infrastructure/` directory with `.tf` files

### 2. **Application Layer (PulseGrid App)**
The app uses the infrastructure but doesn't create it:

- **Backend API**: Runs on ECS Fargate (provisioned by Terraform)
- **Database**: Connects to RDS (created by Terraform)
- **Workers**: Lambda functions (deployed by Terraform)
- **Frontend**: Served via S3 + CloudFront (configured by Terraform)
- **Notifications**: Uses SES/SNS (set up by Terraform)

**Location**: `backend/`, `frontend/`, `workers/` directories

## What the App Actually Does

### Service Monitoring (Application Logic)
- Registers services to monitor
- Performs health checks (HTTP/TCP/Ping)
- Stores results in database
- Triggers alerts
- Displays dashboards

### AWS Services Used (Not Created)
- **SES**: Send emails (configured in Terraform, app just calls API)
- **SNS**: Send SMS (topic created by Terraform, app publishes to it)
- **RDS**: Store data (database created by Terraform, app connects to it)
- **Lambda**: Run health checks (function deployed by Terraform, triggered by EventBridge)
- **EventBridge**: Schedule checks (rules created by Terraform)

## Terraform Workflow

1. **Define Infrastructure** → `infrastructure/main.tf`
2. **Apply Terraform** → `terraform apply`
3. **Terraform Creates** → All AWS resources
4. **App Uses Resources** → Connects to RDS, calls SES, etc.

## Why This Separation?

- **Infrastructure as Code**: Terraform manages all AWS resources
- **Application Focus**: App focuses on business logic, not infrastructure
- **Easy Updates**: Change infrastructure without touching app code
- **Cost Control**: Terraform tracks and manages AWS resources
- **Best Practice**: Separation of concerns

## What You Need to Do

### For Local Development:
1. Run PostgreSQL locally (or use RDS)
2. Start backend API
3. Start scheduler
4. Start frontend
5. **No Terraform needed locally**

### For AWS Deployment:
1. Configure Terraform variables (`terraform.tfvars`)
2. Run `terraform init` and `terraform apply`
3. Terraform creates all AWS resources
4. Deploy app code to ECS/Lambda
5. App automatically uses Terraform-created resources

## Summary

**You don't need to configure AWS compute/network/global/monitoring in the app** because:
- Terraform handles all infrastructure provisioning
- App just uses the resources Terraform creates
- This is the correct architecture pattern

The app is the **application layer** - it monitors services, stores data, sends alerts. Terraform is the **infrastructure layer** - it creates the AWS resources the app needs.

