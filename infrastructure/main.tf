terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Locals for IAM role ARNs
locals {
  ecs_task_role_arn = aws_iam_role.ecs_task.arn
  lambda_role_arn   = aws_iam_role.lambda.arn
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "pulsegrid-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "pulsegrid-igw"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "pulsegrid-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "pulsegrid-private-subnet-${count.index + 1}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "pulsegrid-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Security Groups
resource "aws_security_group" "rds" {
  name        = "pulsegrid-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "pulsegrid-rds-sg"
  }
}

resource "aws_security_group" "ecs" {
  name        = "pulsegrid-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "pulsegrid-ecs-sg"
  }
}

# RDS PostgreSQL Database
resource "aws_db_subnet_group" "main" {
  name       = "pulsegrid-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "pulsegrid-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier             = "pulsegrid-db"
  engine                 = "postgres"
  engine_version         = "14.20"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  storage_type           = "gp3"
  db_name                = "pulsegrid"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name = "pulsegrid-db"
  }
}

# ECR Repository for Backend
resource "aws_ecr_repository" "backend" {
  name                 = "pulsegrid-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECR Repository for Workers
resource "aws_ecr_repository" "workers" {
  name                 = "pulsegrid-workers"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# S3 Bucket for Frontend
resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name

  tags = {
    Name = "pulsegrid-frontend"
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

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
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

# CloudFront Distribution for Frontend
# CloudFront Distribution - Commented out until AWS account is verified
# Uncomment after verifying your AWS account with AWS Support
# resource "aws_cloudfront_distribution" "frontend" {
#   origin {
#     domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
#     origin_id   = "S3-${aws_s3_bucket.frontend.bucket}"
#
#     custom_origin_config {
#       http_port              = 80
#       https_port             = 443
#       origin_protocol_policy = "http-only"
#       origin_ssl_protocols   = ["TLSv1.2"]
#     }
#   }
#
#   enabled             = true
#   is_ipv6_enabled     = true
#   default_root_object = "index.html"
#
#   default_cache_behavior {
#     allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
#     cached_methods   = ["GET", "HEAD"]
#     target_origin_id = "S3-${aws_s3_bucket.frontend.bucket}"
#
#     forwarded_values {
#       query_string = false
#       cookies {
#         forward = "none"
#       }
#     }
#
#     viewer_protocol_policy = "redirect-to-https"
#     min_ttl                = 0
#     default_ttl            = 3600
#     max_ttl                = 86400
#   }
#
#   restrictions {
#     geo_restriction {
#       restriction_type = "none"
#     }
#   }
#
#   viewer_certificate {
#     cloudfront_default_certificate = true
#   }
# }

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task" {
  name = "pulsegrid-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional IAM policy for ECS execution role to read SSM parameters
resource "aws_iam_role_policy" "ecs_execution_ssm" {
  name = "pulsegrid-ecs-execution-ssm-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          aws_ssm_parameter.db_password.arn,
          aws_ssm_parameter.jwt_secret.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# EventBridge Rule for Health Checks
resource "aws_cloudwatch_event_rule" "health_check" {
  name                = "pulsegrid-health-check"
  description         = "Trigger health checks for services"
  schedule_expression = "rate(1 minute)"
}

# Lambda Function for Health Checks
# TODO: Create health_check.zip before enabling this
# resource "aws_lambda_function" "health_check" {
#   filename      = "health_check.zip"
#   function_name = "pulsegrid-health-check"
#   role          = local.lambda_role_arn
#   handler       = "main"
#   runtime       = "go1.x"
#   timeout       = 30
#   memory_size   = 256

#   environment {
#     variables = {
#       DB_HOST     = aws_db_instance.main.address
#       DB_PORT     = "5432"
#       DB_USER     = var.db_username
#       DB_PASSWORD = var.db_password
#       DB_NAME     = "pulsegrid"
#       DB_SSLMODE  = "require"
#     }
#   }
#
#   vpc_config {
#     subnet_ids         = aws_subnet.private[*].id
#     security_group_ids = [aws_security_group.ecs.id]
#   }
# }

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "pulsegrid-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# CloudWatch Event Target - Commented out until Lambda function is created
# resource "aws_cloudwatch_event_target" "health_check" {
#   rule      = aws_cloudwatch_event_rule.health_check.name
#   target_id = "TriggerHealthCheck"
#   arn       = aws_lambda_function.health_check.arn
# }

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "pulsegrid-alerts"
}

# SES Configuration (requires manual verification in AWS Console)
resource "aws_ses_email_identity" "noreply" {
  email = var.ses_from_email
}

