output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.address
}

output "ecr_backend_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_workers_repository_url" {
  description = "ECR repository URL for workers"
  value       = aws_ecr_repository.workers.repository_url
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.bucket
}

# CloudFront outputs - Commented out until AWS account is verified
# output "cloudfront_distribution_id" {
#   description = "CloudFront distribution ID"
#   value       = aws_cloudfront_distribution.frontend.id
# }
#
# output "cloudfront_domain_name" {
#   description = "CloudFront distribution domain name"
#   value       = aws_cloudfront_distribution.frontend.domain_name
# }

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "nlb_dns_name" {
  description = "Network Load Balancer DNS name (stable endpoint)"
  value       = aws_lb.main.dns_name
}

output "backend_api_url" {
  description = "Backend API URL (use this in frontend)"
  value       = "http://${aws_lb.main.dns_name}/api/v1"
}

output "alb_dns_name" {
  description = "Alias for NLB DNS name (for backward compatibility)"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_1_id" {
  description = "First public subnet ID"
  value       = aws_subnet.public[0].id
}

output "public_subnet_2_id" {
  description = "Second public subnet ID"
  value       = aws_subnet.public[1].id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = aws_security_group.ecs.id
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

