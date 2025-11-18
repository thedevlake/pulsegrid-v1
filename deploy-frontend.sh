#!/bin/bash

# Deploy Frontend to AWS S3/CloudFront
# This script builds the frontend and uploads it to S3, then invalidates CloudFront cache

set -e

echo "🚀 Starting frontend deployment..."

# Get values from Terraform outputs
cd infrastructure
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
# CloudFront is disabled until distribution is provisioned
# CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)
cd ..

echo "📦 Building frontend..."
cd frontend
npm install
VITE_API_URL=${VITE_API_URL:-http://13.61.196.157:8080/api/v1} npm run build

echo "⬆️  Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

echo "✅ Frontend deployed!"
echo "ℹ️ CloudFront invalidation skipped (no distribution configured)"

