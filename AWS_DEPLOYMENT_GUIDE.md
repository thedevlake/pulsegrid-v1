# AWS Deployment Guide - PulseGrid

This guide provides step-by-step instructions for deploying PulseGrid to AWS infrastructure.

## Architecture Overview

```
┌─────────────┐
│  CloudFront │ (CDN for Frontend)
└──────┬──────┘
       │
┌──────▼──────┐
│     S3      │ (Frontend Static Hosting)
└─────────────┘

┌─────────────┐
│ API Gateway │ (Backend API)
└──────┬──────┘
       │
┌──────▼──────┐
│ ECS Fargate │ (Backend API Container)
└─────────────┘

┌─────────────┐
│  EventBridge│ (Scheduled Health Checks)
└──────┬──────┘
       │
┌──────▼──────┐
│   Lambda    │ (Health Check Workers)
└─────────────┘

┌─────────────┐
│     RDS     │ (PostgreSQL Database)
└─────────────┘

┌─────────────┐
│     SNS     │ (SMS Notifications)
└─────────────┘

┌─────────────┐
│     SES     │ (Email Notifications)
└─────────────┘
```

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Terraform installed (v1.0+)
4. Docker installed
5. Domain name (optional, for custom domain)

## Step 1: Infrastructure Setup with Terraform

### 1.1 Create Terraform Configuration

Create `terraform/main.tf`:

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "pulsegrid-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "pulsegrid"
}

variable "environment" {
  default = "production"
}
```

### 1.2 RDS PostgreSQL Database

```hcl
resource "aws_db_instance" "pulsegrid_db" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  
  db_name  = "pulsegrid"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"
  
  tags = {
    Name        = "${var.project_name}-database"
    Environment = var.environment
  }
}
```

### 1.3 S3 Bucket for Frontend

```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${var.environment}"
  
  tags = {
    Name        = "${var.project_name}-frontend"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}
```

### 1.4 CloudFront Distribution

```hcl
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols    = ["TLSv1.2"]
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

### 1.5 ECS Fargate for Backend

```hcl
resource "aws_ecs_cluster" "pulsegrid" {
  name = "${var.project_name}-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  
  container_definitions = jsonencode([{
    name  = "backend"
    image = "${var.ecr_repository_url}:latest"
    
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
    
    environment = [
      {
        name  = "DATABASE_URL"
        value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.pulsegrid_db.endpoint}/pulsegrid"
      },
      {
        name  = "JWT_SECRET"
        value = var.jwt_secret
      },
      {
        name  = "CORS_ORIGIN"
        value = "https://${aws_cloudfront_distribution.frontend.domain_name}"
      }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.backend.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend"
  cluster         = aws_ecs_cluster.pulsegrid.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }
}
```

### 1.6 Lambda for Health Checks

```hcl
resource "aws_lambda_function" "health_check" {
  filename         = "health-check.zip"
  function_name    = "${var.project_name}-health-check"
  role            = aws_iam_role.lambda.arn
  handler         = "main"
  runtime         = "go1.x"
  timeout         = 30
  
  environment {
    variables = {
      DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.pulsegrid_db.endpoint}/pulsegrid"
    }
  }
}

resource "aws_cloudwatch_event_rule" "health_check" {
  name                = "${var.project_name}-health-check-rule"
  description         = "Trigger health checks every minute"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "health_check" {
  rule      = aws_cloudwatch_event_rule.health_check.name
  target_id = "HealthCheckTarget"
  arn       = aws_lambda_function.health_check.arn
}
```

### 1.7 SNS for SMS

```hcl
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action   = "sns:Publish"
      Resource = aws_sns_topic.alerts.arn
    }]
  })
}
```

### 1.8 SES for Email

```hcl
resource "aws_ses_email_identity" "sender" {
  email = "noreply@${var.domain_name}"
}
```

## Step 2: Build and Push Docker Images

### 2.1 Build Backend Image

```bash
cd backend
docker build -t pulsegrid-backend:latest .
docker tag pulsegrid-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/pulsegrid-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/pulsegrid-backend:latest
```

### 2.2 Build Frontend

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://pulsegrid-frontend-production/ --delete
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

## Step 3: Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Step 4: Configure Environment Variables

Set the following environment variables in ECS task definition:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `CORS_ORIGIN`: CloudFront distribution URL
- `AWS_REGION`: AWS region
- `SES_FROM_EMAIL`: Verified SES email
- `SNS_TOPIC_ARN`: SNS topic ARN for SMS

## Step 5: Database Migrations

Run migrations on the RDS instance:

```bash
export DATABASE_URL="postgresql://user:pass@rds-endpoint/pulsegrid"
cd backend
go run cmd/migrate/main.go
```

## Step 6: Verify Deployment

1. **Frontend**: Visit CloudFront distribution URL
2. **Backend**: Test API health endpoint
3. **Health Checks**: Verify Lambda is triggered by EventBridge
4. **Notifications**: Test email/SMS/Slack alerts

## Step 7: Monitoring Setup

### CloudWatch Alarms

```hcl
resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.project_name}-api-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxError"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API errors"
}
```

## Cost Optimization

1. **Use Reserved Instances** for RDS (if long-term)
2. **Enable Auto Scaling** for ECS (scale down during low traffic)
3. **Use S3 Lifecycle Policies** for old logs
4. **Monitor CloudWatch Costs** (set billing alerts)
5. **Use AWS Free Tier** where possible

## Security Best Practices

1. **Encrypt RDS** at rest and in transit
2. **Use Secrets Manager** for sensitive data
3. **Enable WAF** on CloudFront
4. **Use IAM Roles** (not access keys)
5. **Enable CloudTrail** for audit logging
6. **Use VPC** for network isolation

## Troubleshooting

### Common Issues

1. **Database Connection**: Check security groups and VPC configuration
2. **CORS Errors**: Verify CORS_ORIGIN matches CloudFront URL
3. **Lambda Timeout**: Increase timeout or optimize code
4. **SES Not Verified**: Verify sender email in SES console

## Next Steps

- Set up CI/CD pipeline with GitHub Actions
- Configure custom domain with Route 53
- Set up monitoring dashboards in CloudWatch
- Implement auto-scaling policies
- Set up disaster recovery procedures

