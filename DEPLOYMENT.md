# PulseGrid Deployment Guide

This guide covers deploying PulseGrid to AWS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Terraform >= 1.5
- Docker installed
- Go 1.21+ (for building workers)
- Node.js 18+ (for building frontend)

## Step 1: Infrastructure Setup

1. Navigate to the infrastructure directory:
   ```bash
   cd infrastructure
   ```

2. Copy and configure variables:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. Deploy infrastructure:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. Note the outputs, especially:
   - RDS endpoint
   - ECR repository URLs
   - CloudFront distribution domain

## Step 2: Database Setup

1. Connect to the RDS instance and run migrations:
   ```bash
   # The migrations run automatically when the backend starts
   # Or manually run them using psql
   ```

## Step 3: Build and Push Docker Images

### Backend

1. Build the Docker image:
   ```bash
   cd backend
   docker build -t pulsegrid-backend .
   ```

2. Tag and push to ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URL>
   docker tag pulsegrid-backend:latest <ECR_BACKEND_URL>:latest
   docker push <ECR_BACKEND_URL>:latest
   ```

### Workers

1. Build the Lambda deployment package:
   ```bash
   cd workers
   GOOS=linux GOARCH=amd64 go build -o bootstrap cmd/lambda/main.go
   zip health_check.zip bootstrap
   ```

2. Upload to Lambda:
   ```bash
   aws lambda update-function-code \
     --function-name pulsegrid-health-check \
     --zip-file fileb://health_check.zip
   ```

## Step 4: Deploy Frontend

1. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Upload to S3:
   ```bash
   aws s3 sync dist/ s3://<FRONTEND_BUCKET_NAME>/
   ```

3. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id <DISTRIBUTION_ID> \
     --paths "/*"
   ```

## Step 5: Configure Environment Variables

Update the backend and Lambda function environment variables with:
- Database connection details
- AWS credentials
- SNS topic ARN
- SES email address

## Step 6: Verify Deployment

1. Access the frontend via CloudFront URL
2. Register a new account
3. Add a service to monitor
4. Verify health checks are running
5. Test alert notifications

## Manual Steps Required

1. **SES Email Verification**: Verify your email address in AWS SES Console
2. **SNS Subscriptions**: Configure SMS/Slack webhooks in SNS Console
3. **Domain Setup**: (Optional) Configure custom domain for CloudFront
4. **SSL Certificate**: (Optional) Request ACM certificate for custom domain

## Monitoring

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for RDS and ECS
- Application logs in CloudWatch Logs

## Troubleshooting

- Check CloudWatch Logs for errors
- Verify security group rules
- Ensure IAM roles have correct permissions
- Check RDS connectivity from Lambda/ECS

