# Requirements Setup Guide

This guide walks you through setting up all the required components for PulseGrid.

## 1. PostgreSQL Database (for Local Development)

### Option A: Install PostgreSQL Locally

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user

### Create Database

Once PostgreSQL is installed, create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Or if you need to specify host
psql -U postgres -h localhost
```

Then run:
```sql
CREATE DATABASE pulsegrid;
\q
```

### Verify Installation

```bash
# Check if PostgreSQL is running
pg_isready

# List databases
psql -U postgres -l
```

### Update Backend Configuration

In `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=pulsegrid
DB_SSLMODE=disable
```

### Option B: Use Docker (Alternative)

If you prefer Docker:

```bash
docker run --name pulsegrid-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=pulsegrid \
  -p 5432:5432 \
  -d postgres:14
```

Then use:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pulsegrid
```

---

## 2. AWS Account and Credentials (for Deployment)

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the registration process
4. You'll need a credit card (but we'll use Free Tier resources)

### Step 2: Create IAM User

**Important**: Don't use your root account credentials. Create an IAM user instead.

1. **Log into AWS Console**
   - Go to https://console.aws.amazon.com/
   - Sign in with your root account

2. **Navigate to IAM**
   - Search for "IAM" in the top search bar
   - Click on "IAM" service

3. **Create New User**
   - Click "Users" in the left sidebar
   - Click "Add users"
   - Username: `pulsegrid-deploy` (or any name you prefer)
   - Select "Provide user access to the AWS Management Console" (optional, for console access)
   - Click "Next"

4. **Set Permissions**
   - Select "Attach policies directly"
   - Search and select these policies:
     - `AmazonS3FullAccess`
     - `AmazonEC2FullAccess`
     - `AmazonRDSFullAccess`
     - `AWSLambda_FullAccess`
     - `AmazonSNSFullAccess`
     - `AmazonSESFullAccess`
     - `AmazonEC2ContainerRegistryFullAccess`
     - `CloudFrontFullAccess`
     - `AmazonEventBridgeFullAccess`
     - `IAMFullAccess` (for creating roles)
   - Click "Next"

5. **Create Access Keys**
   - Click on the user you just created
   - Go to "Security credentials" tab
   - Click "Create access key"
   - Select "Command Line Interface (CLI)"
   - Click "Next"
   - Add description: "PulseGrid deployment"
   - Click "Create access key"
   - **IMPORTANT**: Copy both:
     - Access Key ID
     - Secret Access Key
   - Store these securely (you won't see the secret again!)

### Step 3: Configure AWS CLI

**Install AWS CLI:**

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download from: https://aws.amazon.com/cli/

**Configure:**
```bash
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: [Your Access Key ID from Step 2]
- **AWS Secret Access Key**: [Your Secret Access Key from Step 2]
- **Default region name**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

**Verify:**
```bash
aws sts get-caller-identity
```

You should see your account details.

### Step 4: Set Environment Variables (Alternative to AWS CLI)

If you prefer not to use AWS CLI, you can set environment variables:

**macOS/Linux:**
```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_REGION=us-east-1
```

**Windows (PowerShell):**
```powershell
$env:AWS_ACCESS_KEY_ID="your_access_key_id"
$env:AWS_SECRET_ACCESS_KEY="your_secret_access_key"
$env:AWS_REGION="us-east-1"
```

Or add to your backend `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

---

## 3. JWT Secret Key (Generate Secure Random String)

### Option A: Using OpenSSL (Recommended)

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Option B: Using Online Generator

1. Go to https://www.random.org/strings/
2. Set:
   - Length: 32
   - Character set: Alphanumeric
   - Generate: 1 string
3. Copy the generated string

### Option C: Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Add to Backend Configuration

In `backend/.env`:
```env
JWT_SECRET=your_generated_secret_key_here
JWT_EXPIRY=24h
```

**Important**: 
- Never commit this to version control
- Use a different secret for production
- Keep it secure and private

---

## 4. Verified Email in AWS SES (for Notifications)

### Step 1: Access AWS SES

1. Log into AWS Console
2. Search for "SES" (Simple Email Service)
3. Click on "SES" service

### Step 2: Verify Email Address

**Note**: If you're in the SES Sandbox (default for new accounts), you can only send to verified emails.

1. **Navigate to Verified Identities**
   - In SES Console, click "Verified identities" in the left sidebar
   - Click "Create identity"

2. **Create Email Identity**
   - Select "Email address"
   - Enter your email address (e.g., `noreply@yourdomain.com` or your personal email)
   - Click "Create identity"

3. **Verify Email**
   - AWS will send a verification email to the address you provided
   - Check your inbox (and spam folder)
   - Click the verification link in the email
   - You should see "Verification successful"

### Step 3: Request Production Access (Optional but Recommended)

If you want to send to any email address (not just verified ones):

1. In SES Console, click "Account dashboard"
2. Click "Request production access"
3. Fill out the form:
   - Use case: "Transactional emails for monitoring alerts"
   - Website URL: Your website (if you have one)
   - Describe your use case
4. Submit and wait for approval (usually 24 hours)

### Step 4: Update Configuration

In `backend/.env`:
```env
SES_FROM_EMAIL=your_verified_email@example.com
```

In `infrastructure/terraform.tfvars`:
```hcl
ses_from_email = "your_verified_email@example.com"
```

### Step 5: Verify Domain (Advanced - Optional)

If you have your own domain:

1. In SES, click "Verified identities" → "Create identity"
2. Select "Domain"
3. Enter your domain name
4. Follow DNS verification steps
5. This allows sending from any email @yourdomain.com

---

## 5. Unique S3 Bucket Name (for Frontend)

### Understanding S3 Bucket Names

- S3 bucket names must be **globally unique** across all AWS accounts
- They must be 3-63 characters long
- Can contain lowercase letters, numbers, hyphens, and periods
- Must start and end with a letter or number

### Generate a Unique Name

**Format suggestions:**
- `pulsegrid-frontend-[yourname]-[random]`
- `pulsegrid-[your-initials]-[date]`
- `pulsegrid-[random-string]`

**Examples:**
- `pulsegrid-frontend-sofia-2024`
- `pulsegrid-sas-20241031`
- `pulsegrid-frontend-abc123xyz`

### Check if Name is Available

```bash
aws s3api head-bucket --bucket your-bucket-name
```

If you get an error, the bucket doesn't exist (name is available).
If you get "404", the name is available.

### Update Configuration

In `infrastructure/terraform.tfvars`:
```hcl
frontend_bucket_name = "pulsegrid-frontend-your-unique-name"
```

**Important**: 
- Choose a name you'll remember
- The bucket will be created automatically by Terraform
- Once created, you can't change the name (only delete and recreate)

### Alternative: Let Terraform Generate (Advanced)

You can modify Terraform to auto-generate a unique name, but for simplicity, manually choosing is recommended.

---

## Quick Checklist

Before deploying, ensure you have:

- [ ] PostgreSQL installed and database created
- [ ] AWS account created
- [ ] IAM user with access keys
- [ ] AWS CLI configured (`aws configure`)
- [ ] JWT secret key generated
- [ ] Email verified in AWS SES
- [ ] Unique S3 bucket name chosen
- [ ] All environment variables set in `.env` files

## Testing Your Setup

### Test PostgreSQL:
```bash
psql -U postgres -d pulsegrid -c "SELECT version();"
```

### Test AWS Credentials:
```bash
aws sts get-caller-identity
```

### Test SES:
```bash
aws ses list-verified-email-addresses
```

### Test S3 Bucket Name:
```bash
aws s3api head-bucket --bucket your-bucket-name 2>&1 | grep -q '404' && echo "Available" || echo "Taken"
```

---

## Troubleshooting

### PostgreSQL Issues
- **Can't connect**: Check if PostgreSQL is running (`pg_isready`)
- **Permission denied**: Check username/password
- **Database doesn't exist**: Create it with `createdb pulsegrid`

### AWS Issues
- **Access denied**: Check IAM user permissions
- **Invalid credentials**: Re-run `aws configure`
- **Region issues**: Ensure you're using the correct region

### SES Issues
- **Email not verified**: Check spam folder, resend verification
- **Sandbox mode**: You can only send to verified emails until production access is granted
- **Bounce rate**: Keep bounce rate below 5% to maintain good standing

### S3 Bucket Issues
- **Name taken**: Try a different name with more randomness
- **Invalid name**: Follow naming rules (lowercase, no underscores)

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env` files (already in `.gitignore`)
   - Use AWS Secrets Manager for production

2. **Rotate credentials regularly**
   - Change JWT secret periodically
   - Rotate AWS access keys every 90 days

3. **Use least privilege**
   - IAM user should only have necessary permissions
   - Don't use root account for deployment

4. **Enable MFA**
   - Enable Multi-Factor Authentication on AWS account
   - Protect your AWS account with MFA

---

## Next Steps

Once you have all requirements set up:

1. Follow [SETUP.md](./SETUP.md) for local development
2. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS deployment
3. Test the application locally first
4. Deploy to AWS when ready

Good luck! 🚀

