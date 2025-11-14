# ⚠️ SECRET ROTATION REQUIRED

## Critical Security Action

The file `infrastructure/terraform.tfvars` was removed from the repository because it contained **exposed secrets**:

### Exposed Secrets:
- **JWT Secret**: `/NUjKJSRzOg+09ORszcMIfkoenWfOhk8qaR937rrSwc=`
- Database password placeholder

### Action Required:

#### 1. Generate New JWT Secret
```bash
openssl rand -base64 32
```

#### 2. Update Production Environment

**Option A: Update Terraform Variables**
- Create a new `terraform.tfvars` file locally (NOT in git)
- Set new JWT secret:
  ```hcl
  jwt_secret = "<NEW_GENERATED_SECRET>"
  ```
- Apply Terraform changes

**Option B: Update Environment Variables**
- If using environment variables, update the `JWT_SECRET` in your deployment environment
- Restart backend services to pick up new secret

#### 3. Update Backend Configuration
- Update `backend/.env` or environment variables with new JWT secret
- Restart backend API service

#### 4. Verify
- Test authentication (login/logout)
- Verify JWT tokens are being generated with new secret
- Check that old tokens are invalidated

### Prevention:
- ✅ `terraform.tfvars` is now in `.gitignore`
- ✅ Use `terraform.tfvars.example` for documentation
- ✅ Store secrets in:
  - Environment variables
  - AWS Secrets Manager
  - HashiCorp Vault
  - CI/CD secrets (GitHub Secrets, etc.)

### Timeline:
**URGENT**: Rotate JWT secret within 24-48 hours to prevent unauthorized access.

---

**Note**: This file can be deleted after secret rotation is complete.

