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

# ECS Task Definition for Backend
resource "aws_ecs_task_definition" "backend" {
  family                   = "pulsegrid-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
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
    }
  ])

  tags = {
    Name = "pulsegrid-backend-task"
  }
}

# Application Load Balancer - Provides stable DNS endpoint
resource "aws_lb" "main" {
  name               = "pulsegrid-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "pulsegrid-alb"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "pulsegrid-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP traffic"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS traffic"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "pulsegrid-alb-sg"
  }
}

# ALB Target Group
resource "aws_lb_target_group" "backend" {
  name        = "pulsegrid-backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/api/v1/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "pulsegrid-backend-tg"
  }
}

# ALB Listener
resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# Update ECS Security Group to allow ALB
resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  from_port                = 8080
  to_port                  = 8080
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ecs.id
  description              = "Allow traffic from ALB to ECS"
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

