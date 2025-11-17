# AWS Deployment Checklist

## ✅ Pre-Deployment Verification

### Infrastructure Status
- [x] **Terraform Applied**: All resources created successfully
- [x] **RDS Database**: Available at `pulsegrid-db.cxwyqsgeaqll.eu-north-1.rds.amazonaws.com`
- [x] **ECS Cluster**: `pulsegrid-cluster` exists
- [x] **ECS Service**: `pulsegrid-backend` configured
- [x] **VPC & Networking**: Configured with public/private subnets
- [x] **Security Groups**: ECS and RDS configured

### Docker Images
- [x] **Backend Image**: Pushed to ECR (`pulsegrid-backend:latest`)
- [x] **Workers Image**: Pushed to ECR (`pulsegrid-workers:latest`)
- [x] **Frontend Image**: Pushed to ECR (`pulsegrid-frontend:latest`)

### Secrets Management
- [x] **SSM Parameters**: Database password and JWT secret stored
- [x] **IAM Permissions**: ECS can read from SSM
- [x] **Task Definition**: Updated to use SSM secrets

### Configuration
- [x] **Task Definition**: Uses correct ECR image
- [x] **Environment Variables**: All required vars configured
- [x] **Secrets**: DB_PASSWORD and JWT_SECRET from SSM
- [x] **Logging**: CloudWatch logs configured

## 🔍 Current Status Check

Run these commands to verify deployment:

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster pulsegrid-cluster \
  --services pulsegrid-backend \
  --region eu-north-1

# Check running tasks
aws ecs list-tasks \
  --cluster pulsegrid-cluster \
  --service-name pulsegrid-backend \
  --region eu-north-1

# View logs
aws logs tail /ecs/pulsegrid-backend \
  --region eu-north-1 \
  --follow

# Get task public IP (if needed)
aws ecs describe-tasks \
  --cluster pulsegrid-cluster \
  --tasks <TASK_ARN> \
  --region eu-north-1 \
  --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" \
  --output text | xargs -I {} aws ec2 describe-network-interfaces \
  --network-interface-ids {} \
  --region eu-north-1 \
  --query "NetworkInterfaces[0].Association.PublicIp" \
  --output text
```

## 🚀 Deployment Steps

### 1. Verify ECS Service is Running
```bash
# Force new deployment if needed
aws ecs update-service \
  --cluster pulsegrid-cluster \
  --service pulsegrid-backend \
  --force-new-deployment \
  --region eu-north-1
```

### 2. Deploy Frontend to S3
```bash
cd frontend
npm install
npm run build
aws s3 sync dist/ s3://pulsegrid-frontend-777319172038 \
  --delete \
  --region eu-north-1
```

### 3. Access Your Application
- **Frontend**: `http://pulsegrid-frontend-777319172038.s3-website.eu-north-1.amazonaws.com`
- **Backend API**: Get public IP from ECS task (see commands above)

## ⚠️ Common Issues & Fixes

### ECS Task Not Starting
**Symptoms**: RunningCount = 0, tasks keep stopping

**Checks**:
1. Check CloudWatch logs for errors
2. Verify task definition image exists in ECR
3. Check security group allows outbound traffic
4. Verify RDS security group allows ECS security group

**Fix**:
```bash
# Check logs
aws logs tail /ecs/pulsegrid-backend --region eu-north-1 --since 1h

# Verify image
aws ecr describe-images \
  --repository-name pulsegrid-backend \
  --image-ids imageTag=latest \
  --region eu-north-1
```

### Database Connection Failed
**Symptoms**: "connection refused" or "timeout" in logs

**Checks**:
1. RDS endpoint is correct
2. Security group allows port 5432 from ECS
3. Database password in SSM is correct
4. VPC/subnet configuration is correct

**Fix**:
```bash
# Update RDS security group to allow ECS
# Already done in Terraform - just apply if needed
cd infrastructure
terraform apply
```

### Secrets Not Loading
**Symptoms**: "AccessDenied" or missing environment variables

**Checks**:
1. IAM role has SSM permissions
2. SSM parameter ARNs are correct
3. KMS decrypt permissions (for SecureString)

**Fix**:
```bash
# Verify SSM parameters exist
aws ssm get-parameters \
  --names /pulsegrid/database/password /pulsegrid/jwt/secret \
  --region eu-north-1
```

## 📊 Health Check Endpoints

Once deployed, test these endpoints:

- **Backend Health**: `http://<ECS_TASK_IP>:8080/api/v1/health`
- **API Base**: `http://<ECS_TASK_IP>:8080/api/v1`

## 🔐 Security Notes

- ✅ Secrets stored in SSM Parameter Store (SecureString)
- ✅ RDS in private subnet
- ✅ ECS tasks in public subnet with public IP
- ✅ Security groups restrict access appropriately
- ⚠️ **Note**: For production, consider using ALB instead of direct public IPs

## 📝 Next Steps After Deployment

1. **Test Backend API**: Verify health endpoint responds
2. **Test Database**: Create a test user/service
3. **Deploy Frontend**: Build and sync to S3
4. **Configure Domain**: (Optional) Set up custom domain
5. **Monitor Logs**: Set up CloudWatch alarms
6. **Set Up Alerts**: Configure SNS notifications

## 🆘 Troubleshooting Commands

```bash
# Get all ECS task details
aws ecs describe-tasks \
  --cluster pulsegrid-cluster \
  --tasks $(aws ecs list-tasks --cluster pulsegrid-cluster --service-name pulsegrid-backend --region eu-north-1 --query "taskArns[0]" --output text) \
  --region eu-north-1

# Check RDS connectivity from ECS
# (Run this from an ECS task or EC2 instance in same VPC)
psql -h pulsegrid-db.cxwyqsgeaqll.eu-north-1.rds.amazonaws.com \
  -U postgres \
  -d pulsegrid

# View recent CloudWatch events
aws logs filter-log-events \
  --log-group-name /ecs/pulsegrid-backend \
  --start-time $(date -u -d '1 hour ago' +%s)000 \
  --region eu-north-1
```

