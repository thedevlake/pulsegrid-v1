#!/bin/bash

# Deploy Frontend to AWS S3/CloudFront
# This script builds the frontend and uploads it to S3, then invalidates CloudFront cache

set -e

echo "🚀 Starting frontend deployment..."

# Get values from Terraform outputs
cd infrastructure
S3_BUCKET=$(terraform output -raw frontend_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)
cd ..

echo "📦 Building frontend..."
cd frontend
npm install
npm run build

echo "⬆️  Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CF_DIST_ID \
  --paths "/*"

echo "✅ Frontend deployed!"
echo "🌐 CloudFront URL: https://$(cd ../infrastructure && terraform output -raw cloudfront_domain_name)"
echo "⏳ Cache invalidation in progress (takes 5-10 minutes)"

