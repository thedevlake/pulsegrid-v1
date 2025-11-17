# AWS Systems Manager Parameter Store for secrets

# Database Password
resource "aws_ssm_parameter" "db_password" {
  name        = "/pulsegrid/database/password"
  description = "RDS PostgreSQL database password"
  type        = "SecureString"
  value       = var.db_password

  tags = {
    Name = "pulsegrid-db-password"
  }
}

# JWT Secret
resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/pulsegrid/jwt/secret"
  description = "JWT secret key for authentication"
  type        = "SecureString"
  value       = var.jwt_secret

  tags = {
    Name = "pulsegrid-jwt-secret"
  }
}

# Optional: AWS Access Key ID (if not using IAM roles)
# resource "aws_ssm_parameter" "aws_access_key_id" {
#   name        = "/pulsegrid/aws/access_key_id"
#   description = "AWS Access Key ID"
#   type        = "SecureString"
#   value       = var.aws_access_key_id
#   count       = var.aws_access_key_id != "" ? 1 : 0
# }

# Optional: AWS Secret Access Key (if not using IAM roles)
# resource "aws_ssm_parameter" "aws_secret_access_key" {
#   name        = "/pulsegrid/aws/secret_access_key"
#   description = "AWS Secret Access Key"
#   type        = "SecureString"
#   value       = var.aws_secret_access_key
#   count       = var.aws_secret_access_key != "" ? 1 : 0
# }

# Optional: SMTP Configuration (if using SMTP instead of SES)
# resource "aws_ssm_parameter" "smtp_host" {
#   name        = "/pulsegrid/smtp/host"
#   description = "SMTP server hostname"
#   type        = "String"
#   value       = var.smtp_host
#   count       = var.smtp_host != "" ? 1 : 0
# }

# resource "aws_ssm_parameter" "smtp_user" {
#   name        = "/pulsegrid/smtp/user"
#   description = "SMTP username"
#   type        = "SecureString"
#   value       = var.smtp_user
#   count       = var.smtp_user != "" ? 1 : 0
# }

# resource "aws_ssm_parameter" "smtp_password" {
#   name        = "/pulsegrid/smtp/password"
#   description = "SMTP password"
#   type        = "SecureString"
#   value       = var.smtp_password
#   count       = var.smtp_password != "" ? 1 : 0
# }

