# 🔄 Automatic Backend IP Update (Free Solution)

## Overview

This project uses a **completely free** solution to handle changing ECS task IPs: a GitHub Actions workflow that automatically detects IP changes and updates the frontend configuration.

## How It Works

1. **Scheduled Check**: Every hour, a GitHub Actions workflow runs automatically
2. **IP Detection**: It queries AWS ECS to get the current backend task's public IP
3. **Comparison**: Compares the current IP with the IPs in your workflow files
4. **Auto-Update**: If the IP changed, it automatically:
   - Updates `.github/workflows/deploy.yml`
   - Updates `.github/workflows/deploy-frontend.yml`
   - Updates `deploy-frontend.sh`
   - Commits and pushes the changes
5. **Auto-Deploy**: The push triggers the frontend deployment workflow, which rebuilds and redeploys the frontend with the new IP

## Benefits

✅ **100% Free** - No AWS costs (uses GitHub Actions free tier)  
✅ **Fully Automated** - No manual intervention needed  
✅ **Fast Updates** - IP changes detected within 1 hour  
✅ **Zero Downtime** - Frontend automatically redeploys with correct IP  

## Manual Trigger

You can manually trigger the workflow anytime:

1. Go to GitHub → Actions → "Auto-Update Backend IP"
2. Click "Run workflow"
3. Or use GitHub CLI: `gh workflow run "Auto-Update Backend IP"`

## Workflow Schedule

The workflow runs automatically every hour via cron:
```yaml
schedule:
  - cron: '0 * * * *'  # Every hour at minute 0
```

## Files Updated

When an IP change is detected, these files are automatically updated:
- `.github/workflows/deploy.yml` - Main deployment workflow
- `.github/workflows/deploy-frontend.yml` - Frontend deployment workflow  
- `deploy-frontend.sh` - Manual deployment script

## Monitoring

To check if the workflow is working:
1. Go to GitHub → Actions
2. Look for "Auto-Update Backend IP" workflow runs
3. Check the logs to see if IP changes were detected

## Alternative Solutions (Not Free)

If you need faster updates or want a different approach:

1. **Application Load Balancer (ALB)** - ~$16/month, provides stable DNS endpoint
2. **Network Load Balancer (NLB)** - ~$16/month, lower latency
3. **Elastic IP (EIP)** - Not directly supported by ECS Fargate

## Troubleshooting

**Workflow not running?**
- Check GitHub Actions is enabled for your repository
- Verify AWS credentials are set in GitHub Secrets
- Check workflow logs for errors

**IP not updating?**
- Verify ECS service is running: `aws ecs describe-services --cluster pulsegrid-cluster --services pulsegrid-backend`
- Check if workflow has permission to push to main branch
- Review workflow logs for specific errors

## Cost

This solution is **completely free**:
- GitHub Actions: 2,000 minutes/month free (this workflow uses ~2 minutes per run)
- AWS API calls: Free (ECS/EC2 API calls are free)
- No infrastructure costs

At 1-hour intervals, you get ~720 runs/month, using ~1,440 minutes, which is well within the GitHub Actions free tier (2,000 minutes/month for private repos).

For public repos, GitHub Actions is unlimited and completely free!

