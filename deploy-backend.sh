#!/bin/bash

# Deploy Backend to AWS ECS
# This script builds and pushes the Docker image, then updates the ECS service

set -e

echo "🚀 Starting backend deployment..."

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Get AWS region from Terraform outputs (fallback to us-east-1 if not found)
cd infrastructure 2>/dev/null || true
AWS_REGION=$(terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
cd .. 2>/dev/null || true

# If region output doesn't exist, try to get it from terraform.tfvars
if [ "$AWS_REGION" = "us-east-1" ] || [ -z "$AWS_REGION" ]; then
  if [ -f "infrastructure/terraform.tfvars" ]; then
    AWS_REGION=$(grep -E "^aws_region\s*=" infrastructure/terraform.tfvars | sed 's/.*=\s*"\(.*\)".*/\1/' | tr -d ' ')
  fi
fi

# Final fallback
AWS_REGION=${AWS_REGION:-us-east-1}

ECR_REPO="pulsegrid-backend"

echo "📦 Building Docker image..."
cd backend
docker build -t $ECR_REPO:latest .

echo "🏷️  Tagging image for ECR..."
docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "⬆️  Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

echo "🔄 Updating ECS service..."
aws ecs update-service \
  --cluster pulsegrid-cluster \
  --service pulsegrid-service \
  --force-new-deployment \
  --region $AWS_REGION

echo "✅ Deployment initiated! Service is updating..."
echo "📊 Check status with: aws ecs describe-services --cluster pulsegrid-cluster --services pulsegrid-backend"

