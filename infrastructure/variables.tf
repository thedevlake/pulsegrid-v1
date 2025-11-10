variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  type        = string
  default     = "pulsegrid-frontend"
}

variable "ses_from_email" {
  description = "SES verified email address"
  type        = string
  default     = "noreply@pulsegrid.com"
}

