# PulseGrid Infrastructure as Code

This directory contains Terraform configurations for deploying PulseGrid on AWS.

## Prerequisites

- Terraform >= 1.5
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Setup

1. Copy `terraform.tfvars.example` to `terraform.tfvars`:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   - Set a secure database password
   - Choose a unique S3 bucket name
   - Set your SES verified email address

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Review the plan:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

## Resources Created

- VPC with public and private subnets
- RDS PostgreSQL database
- ECR repositories for backend and workers
- S3 bucket and CloudFront distribution for frontend
- Lambda function for health checks
- EventBridge rule for scheduling
- SNS topic for alerts
- Security groups and IAM roles

## Important Notes

- The RDS instance uses the Free Tier eligible `db.t3.micro` by default
- SES email verification must be done manually in AWS Console
- S3 bucket name must be globally unique
- CloudFront distribution takes 15-20 minutes to deploy

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

