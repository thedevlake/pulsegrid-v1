#!/bin/bash

# Quick Frontend Deployment Script
# This script builds and deploys only the frontend to S3

set -e

echo "🚀 Deploying frontend to S3..."

# S3 Bucket name (from your deployment)
S3_BUCKET="pulsegrid-frontend-777319172038"
AWS_REGION="eu-north-1"

echo "📦 Building frontend..."
cd frontend
npm install
npm run build

echo "⬆️  Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete --region $AWS_REGION

echo "✅ Frontend deployed successfully!"
echo "🌐 Your site: http://$S3_BUCKET.s3-website.$AWS_REGION.amazonaws.com"
