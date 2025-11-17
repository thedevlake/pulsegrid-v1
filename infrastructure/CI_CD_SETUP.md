# CI/CD Setup Guide

## GitHub Actions Workflow

A GitHub Actions workflow has been created at `.github/workflows/deploy.yml` that will:

1. **Build and push Docker images** to ECR on every push to `main`
2. **Update ECS services** to deploy new images
3. **Deploy frontend** to S3 bucket

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### Steps to Add Secrets:

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET_NAME` | S3 bucket for frontend | `pulsegrid-frontend-777319172038` |

### Creating AWS IAM User for CI/CD

For security, create a dedicated IAM user for CI/CD with minimal permissions:

```bash
# Create IAM user
aws iam create-user --user-name pulsegrid-github-actions

# Attach policies (or create custom policy with minimal permissions)
aws iam attach-user-policy \
  --user-name pulsegrid-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-user-policy \
  --user-name pulsegrid-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-user-policy \
  --user-name pulsegrid-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name pulsegrid-github-actions
```

**Important**: Save the access key ID and secret access key immediately - they won't be shown again!

## Workflow Behavior

### On Push to `main`:
- ✅ Builds all Docker images (backend, workers, frontend)
- ✅ Pushes images to ECR with both commit SHA and `latest` tags
- ✅ Updates ECS service to force new deployment
- ✅ Deploys frontend to S3

### On Pull Request:
- ✅ Builds all Docker images
- ✅ Pushes images to ECR (for testing)
- ❌ Does NOT update ECS service (safe for PRs)

### Manual Trigger:
- You can manually trigger the workflow from the **Actions** tab in GitHub

## Customization

### Environment-Specific Deployments

To deploy to different environments (staging/production), you can:

1. **Create separate workflows** for each environment
2. **Use environment secrets** in GitHub
3. **Modify the workflow** to check the branch/environment

Example:
```yaml
- name: Update ECS service
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  env:
    ENVIRONMENT: production
  run: |
    # Deploy to production
```

### Deployment Strategies

The current workflow uses `--force-new-deployment` which performs a rolling update.

For zero-downtime deployments, consider:
- **Blue/Green deployments** (requires ALB)
- **Canary deployments** (requires ALB and more complex setup)

## Monitoring Deployments

### Check ECS Service Status:
```bash
aws ecs describe-services \
  --cluster pulsegrid-cluster \
  --services pulsegrid-backend \
  --region eu-north-1 \
  --query "services[0].{Status:status,Deployments:deployments}"
```

### View CloudWatch Logs:
```bash
aws logs tail /ecs/pulsegrid-backend \
  --region eu-north-1 \
  --follow
```

### Check Task Status:
```bash
aws ecs list-tasks \
  --cluster pulsegrid-cluster \
  --service-name pulsegrid-backend \
  --region eu-north-1
```

## Troubleshooting

### Workflow Fails to Push to ECR
- Verify AWS credentials are correct
- Check IAM user has `ecr:PushImage` permission
- Ensure ECR repositories exist

### ECS Service Not Updating
- Check ECS service is in `ACTIVE` state
- Verify task definition exists
- Check CloudWatch logs for errors

### Frontend Not Deploying to S3
- Verify S3 bucket name is correct
- Check IAM user has `s3:PutObject` permission
- Ensure bucket exists and is accessible

