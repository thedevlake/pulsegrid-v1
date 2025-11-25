# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "pulsegrid-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "pulsegrid-cluster"
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs_backend" {
  name              = "/ecs/pulsegrid-backend"
  retention_in_days = 7

  tags = {
    Name = "pulsegrid-backend-logs"
  }
}

# CloudWatch Log Group for Ollama
resource "aws_cloudwatch_log_group" "ecs_ollama" {
  name              = "/ecs/pulsegrid-ollama"
  retention_in_days = 7

  tags = {
    Name = "pulsegrid-ollama-logs"
  }
}

# ECS Task Definition for Backend
resource "aws_ecs_task_definition" "backend" {
  family                   = "pulsegrid-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"  # Increased for Ollama (256 for backend + 768 for Ollama)
  memory                   = "2048"  # Increased for Ollama (512 for backend + 1536 for Ollama model)
  execution_role_arn       = local.ecs_task_role_arn
  task_role_arn            = local.ecs_task_role_arn

  container_definitions = jsonencode([
    {
      name  = "pulsegrid-backend"
      image = "${aws_ecr_repository.backend.repository_url}:latest"

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = "8080"
        },
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.address
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_USER"
          value = var.db_username
        },
        {
          name  = "DB_NAME"
          value = "pulsegrid"
        },
        {
          name  = "DB_SSLMODE"
          value = "require"
        },
        {
          name = "CORS_ORIGIN"
          # value = "https://${aws_cloudfront_distribution.frontend.domain_name}"  # Uncomment when CloudFront is enabled
          value = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}" # Using S3 website endpoint
        },
        {
          name  = "BACKEND_URL"
          value = "http://${aws_lb.main.dns_name}"
        },
        {
          name  = "SNS_TOPIC_ARN"
          value = aws_sns_topic.alerts.arn
        },
        {
          name  = "SES_FROM_EMAIL"
          value = var.ses_from_email
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "ENV"
          value = "production"
        },
        {
          name  = "SMTP_HOST"
          value = var.smtp_host != "" ? var.smtp_host : "email-smtp.${var.aws_region}.amazonaws.com"
        },
        {
          name  = "SMTP_PORT"
          value = "587"
        },
        {
          name  = "FRONTEND_URL"
          value = var.frontend_url != "" ? var.frontend_url : "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
        },
        {
          name  = "OLLAMA_ENABLED"
          value = var.ollama_enabled ? "true" : "false"
        },
        {
          name  = "OLLAMA_BASE_URL"
          value = "http://localhost:11434"
        },
        {
          name  = "OLLAMA_MODEL"
          value = var.ollama_model
        },
        {
          name  = "OLLAMA_TIMEOUT"
          value = var.ollama_timeout
        }
      ]

      # Secrets from SSM Parameter Store
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_password.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = aws_ssm_parameter.openai_api_key.arn
        },
        {
          name      = "SMTP_USER"
          valueFrom = aws_ssm_parameter.smtp_user.arn
        },
        {
          name      = "SMTP_PASSWORD"
          valueFrom = aws_ssm_parameter.smtp_password.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = true
      
      # Health check for backend container
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/api/v1/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
      
      dependsOn = [
        {
          containerName = "pulsegrid-ollama"
          condition     = "START"
        }
      ]
    },
    {
      name  = "pulsegrid-ollama"
      image = "ollama/ollama:latest"

      portMappings = [
        {
          containerPort = 11434
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "OLLAMA_MODELS"
          value = var.ollama_model
        }
      ]

      # Start Ollama server and pull model
      entryPoint = ["/bin/sh", "-c"]
      command = ["ollama serve & sleep 10 && ollama pull ${var.ollama_model} && wait"]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_ollama.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      essential = false  # Make Ollama non-essential so backend can start even if Ollama fails
      
      # Health check to ensure Ollama is ready and model is available
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:11434/api/tags || exit 1"]
        interval    = 60
        timeout     = 10
        retries     = 3
        startPeriod = 300  # Give Ollama 5 minutes to pull model
      }
    }
  ])

  tags = {
    Name = "pulsegrid-backend-task"
  }
}

# Network Load Balancer - Provides stable DNS endpoint (simpler than ALB, might work with account limitations)
resource "aws_lb" "main" {
  name               = "pulsegrid-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "pulsegrid-nlb"
  }
}

# Security Group for NLB (NLB doesn't use security groups, but we keep ECS security group open to NLB)
# Note: NLB operates at Layer 4, security is handled at ECS level

# NLB Target Group
resource "aws_lb_target_group" "backend" {
  name        = "pulsegrid-backend-tg"
  port        = 8080
  protocol    = "TCP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 10
    interval            = 30
    protocol            = "TCP"
    port                = "traffic-port"
  }

  deregistration_delay = 30

  tags = {
    Name = "pulsegrid-backend-tg"
  }
}

# NLB Listener
resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Update ECS Security Group to allow NLB (NLB uses source IP preservation, allow from anywhere on port 8080)
resource "aws_security_group_rule" "ecs_from_nlb" {
  type              = "ingress"
  from_port         = 8080
  to_port           = 8080
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs.id
  description       = "Allow traffic from NLB to ECS"
}

# ECS Service
resource "aws_ecs_service" "backend" {
  name            = "pulsegrid-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "pulsegrid-backend"
    container_port   = 8080
  }

  depends_on = [
    aws_lb_listener.backend
  ]

  tags = {
    Name = "pulsegrid-backend-service"
  }
}

# IAM Policy for ECS Task Role to access SNS, SES, and SSM Parameter Store
resource "aws_iam_role_policy" "ecs_task_sns_ses_ssm" {
  name = "pulsegrid-ecs-task-sns-ses-ssm-policy"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish",
          "sns:GetTopicAttributes"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = var.ses_from_email
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          aws_ssm_parameter.db_password.arn,
          aws_ssm_parameter.jwt_secret.arn,
          aws_ssm_parameter.openai_api_key.arn,
          aws_ssm_parameter.smtp_host.arn,
          aws_ssm_parameter.smtp_user.arn,
          aws_ssm_parameter.smtp_password.arn
        ]
      }
    ]
  })
}

