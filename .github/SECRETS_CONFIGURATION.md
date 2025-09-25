# GitHub Repository Secrets Configuration

This document lists all the repository secrets needed for the CI/CD pipelines to work properly.

## 🔐 Required Repository Secrets

### Vercel Deployment Secrets
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_organization_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### Staging Environment
```
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
STAGING_DOMAIN=staging-literati.vercel.app
```

### Production Environment
```
PRODUCTION_SUPABASE_URL=https://your-production-project.supabase.co
PRODUCTION_SUPABASE_ANON_KEY=your_production_supabase_anon_key
PRODUCTION_DOMAIN=your-production-domain.vercel.app
```

### Docker Registry (if using)
```
DOCKER_USERNAME=your_docker_hub_username
DOCKER_PASSWORD=your_docker_hub_password
```

### Server Deployment (if using SSH deployment)
```
PRODUCTION_SSH_KEY=your_private_ssh_key
PRODUCTION_HOST_1=your.production.server1.com
PRODUCTION_HOST_2=your.production.server2.com
PRODUCTION_USER=deploy
```

### Production Server Environment (for SSH deployment)
```
PRODUCTION_JWT_SECRET=your_production_jwt_secret_32_characters_minimum
PRODUCTION_JWT_REFRESH_SECRET=your_production_jwt_refresh_secret_32_characters
PRODUCTION_GOOGLE_API_KEY=your_production_google_gemini_api_key
PRODUCTION_SUPABASE_SERVICE_KEY=your_production_supabase_service_key
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key
```

## 🛠️ How to Add Secrets

### In GitHub Repository:
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list above

### Environment-Specific Secrets:
For staging/production environments, also configure environment secrets:
1. Go to **Settings** → **Environments**
2. Create environments: `staging`, `production`, `production-approval`
3. Add environment-specific secrets

## 🔍 How to Get These Values

### Vercel Secrets:
1. **VERCEL_TOKEN**:
   - Go to Vercel Dashboard → Settings → Tokens
   - Create a new token with deployment scope

2. **VERCEL_ORG_ID**:
   - Found in Vercel team settings URL or CLI: `vercel teams ls`

3. **VERCEL_PROJECT_ID**:
   - Found in project settings or CLI: `vercel projects ls`

### Supabase Secrets:
1. **SUPABASE_URL**: Your project URL from Supabase dashboard
2. **SUPABASE_ANON_KEY**: Anon/public key from API settings
3. **SUPABASE_SERVICE_KEY**: Service role key (keep secret!)

### Docker Hub Secrets:
1. **DOCKER_USERNAME**: Your Docker Hub username
2. **DOCKER_PASSWORD**: Docker Hub access token (not password)

## 🧪 Testing Secrets Configuration

### Check Required Secrets:
```bash
# Run this workflow to test secret configuration
gh workflow run ci-cd-integrated.yml --ref main
```

### Local Secret Testing:
```bash
# Test with environment variables
export VITE_SUPABASE_URL="your_staging_url"
export VITE_SUPABASE_ANON_KEY="your_staging_key"

cd client2
pnpm run build:staging
```

## 🛡️ Security Best Practices

### Secret Rotation:
- Rotate JWT secrets monthly
- Rotate API keys quarterly
- Monitor secret usage in audit logs

### Access Control:
- Use environment-specific secrets
- Limit secret scope to necessary permissions
- Use service accounts for production

### Monitoring:
- Enable GitHub secret scanning
- Monitor Supabase logs for API usage
- Set up alerts for failed authentications

## 📋 Checklist

Before enabling CI/CD, verify you have:

- [ ] All Vercel secrets configured
- [ ] Staging environment secrets
- [ ] Production environment secrets
- [ ] GitHub environments created (`staging`, `production`)
- [ ] Repository secret scanning enabled
- [ ] Branch protection rules configured for `main`

## 🚨 Emergency Procedures

### If Secrets Are Compromised:
1. **Immediately rotate all affected secrets**
2. **Update repository secrets**
3. **Check audit logs for unauthorized access**
4. **Update environment variables in deployment platforms**
5. **Run security audit**: `pnpm audit`

### Rollback Procedure:
1. **Revert to previous deployment**: Use Vercel dashboard or CLI
2. **Disable compromised secrets**
3. **Deploy hotfix with new secrets**
4. **Notify team and document incident**