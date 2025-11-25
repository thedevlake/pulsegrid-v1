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

variable "jwt_secret" {
  description = "JWT secret key for authentication"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for AI predictions (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "smtp_host" {
  description = "SMTP server hostname (AWS SES SMTP endpoint)"
  type        = string
  default     = "" # Will default based on region
}

variable "smtp_user" {
  description = "SMTP username (AWS SES SMTP username)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "smtp_password" {
  description = "SMTP password (AWS SES SMTP password)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "frontend_url" {
  description = "Frontend URL for email verification links"
  type        = string
  default     = ""
}

variable "ollama_enabled" {
  description = "Enable Ollama for AI predictions"
  type        = bool
  default     = true
}

variable "ollama_model" {
  description = "Ollama model to use (e.g., llama2, mistral, codellama)"
  type        = string
  default     = "llama2"
}

variable "ollama_timeout" {
  description = "Timeout for Ollama API requests"
  type        = string
  default     = "30s"
}

