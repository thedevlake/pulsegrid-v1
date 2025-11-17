aws_region           = "eu-north-1"
db_instance_class    = "db.t3.micro"
db_username          = "postgres"
db_password          = "CHANGE_ME_SECURE_PASSWORD"
frontend_bucket_name = "pulsegrid-frontend-777319172038"
ses_from_email       = "noreply@yourdomain.com"

# JWT Secret (generate with: openssl rand -base64 32)
jwt_secret = "CHANGE_ME_GENERATE_SECURE_JWT_SECRET"

