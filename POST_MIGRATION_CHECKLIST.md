# 📋 Post-Migration Checklist

After successfully migrating to your unified monorepo, complete these steps to ensure everything is working correctly.

## ✅ Immediate Actions (Do These First)

### 1. Verify Repository Migration
- [ ] New repository created on GitHub
- [ ] All files pushed to new repository
- [ ] All branches migrated correctly
- [ ] Repository is public/private as intended

### 2. Update Deployment Services

#### Vercel (Frontend Deployment)
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Update project settings:
  - **Git Repository**: Change to new `jolman009/literati-monorepo`
  - **Root Directory**: Keep as `client2`
  - **Build Command**: `pnpm run build:production`
  - **Install Command**: `pnpm install`
- [ ] Copy environment variables from old project to new
- [ ] Test deployment with a dummy commit

#### Render (Backend Services)
- [ ] Update Server deployment:
  - **Repository**: Change to new monorepo
  - **Root Directory**: `server2`
  - **Build Command**: `pnpm install`
  - **Start Command**: `pnpm start`
- [ ] Update AI Service deployment:
  - **Repository**: Change to new monorepo
  - **Root Directory**: `ai-service`
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. GitHub Repository Configuration

#### Copy Secrets from Old Repositories
Navigate to each old repository → Settings → Secrets and copy to new repo:
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID`
- [ ] `PRODUCTION_SUPABASE_URL`
- [ ] `PRODUCTION_SUPABASE_ANON_KEY`
- [ ] `STAGING_SUPABASE_URL` (if applicable)
- [ ] `STAGING_SUPABASE_ANON_KEY` (if applicable)

#### Set Up Branch Protection
- [ ] Go to Settings → Branches → Add rule for `main`:
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - ✅ Include administrators
  - ✅ Required status checks:
    - `Quality Gates & Testing`
    - `security-scan-enhanced`

#### Configure GitHub Environments
- [ ] Go to Settings → Environments
- [ ] Create environments:
  - `staging` (auto-deploy from develop)
  - `production` (require manual approval)

## 🧪 Testing & Validation

### 4. Test CI/CD Pipeline
- [ ] Create test branch: `git checkout -b test/monorepo-validation`
- [ ] Make small change: `echo "// Monorepo test" >> client2/src/main.jsx`
- [ ] Commit and push: `git add -A && git commit -m "Test monorepo CI/CD"`
- [ ] Create PR and verify all checks pass
- [ ] Merge PR and verify deployment works

### 5. Test Local Development
- [ ] Clone new repository in separate directory for testing
- [ ] Run `pnpm install` (should install all workspace dependencies)
- [ ] Run `pnpm run dev` (should start all services)
- [ ] Verify all services are accessible:
  - Frontend: http://localhost:3000
  - Backend: http://localhost:5000
  - AI Service: http://localhost:8000

### 6. Test Production Deployments
- [ ] Visit your deployed frontend URL
- [ ] Test user login/registration
- [ ] Test book upload and reading features
- [ ] Test AI note summarization
- [ ] Verify all API calls work correctly

## 📱 Mobile App Updates

### 7. Android App Configuration
- [ ] Update API endpoints in Android app to point to production/staging
- [ ] Test Android app with new backend
- [ ] Update any hardcoded repository references

## 📚 Documentation Updates

### 8. Update Documentation
- [ ] Update README.md with new repository links
- [ ] Update CLAUDE.md with new structure
- [ ] Update any documentation referencing old repositories
- [ ] Update deployment guides with new repository info

## 🧹 Cleanup Old Repositories

### 9. Deprecate Old Repositories (Do This Last!)
Once everything is working:
- [ ] Add deprecation notice to old repositories:
  ```markdown
  # ⚠️ DEPRECATED - MOVED TO MONOREPO

  This repository has been merged into our unified monorepo:
  **[literati-monorepo](https://github.com/jolman009/literati-monorepo)**

  Please update your bookmarks and use the new repository for:
  - Issues and discussions
  - Pull requests
  - Releases
  ```
- [ ] Archive old repositories (Settings → Archive this repository)
- [ ] Update any external references (documentation, badges, etc.)

## 🎉 Success Criteria

Your monorepo migration is complete when:
- ✅ All services deploy successfully from new repository
- ✅ CI/CD pipeline runs without errors
- ✅ Local development works with `pnpm run dev`
- ✅ All environment configurations work correctly
- ✅ Security scanning passes
- ✅ No broken links or references to old repositories

## 🚨 Rollback Plan (If Needed)

If something goes wrong:
1. **Don't delete old repositories** until everything is verified working
2. **Revert deployment services** to point back to old repositories
3. **Use git to restore** previous remote configuration:
   ```bash
   git remote remove origin
   git remote add client2-origin https://github.com/jolman009/client2.git
   git remote add server2-origin https://github.com/jolman009/server2.git
   git remote add ai-repo https://github.com/jolman009/literati-ai.git
   ```

---

**Estimated Time**: 1-2 hours for complete migration and testing
**Risk Level**: Low (old repositories remain as backup)
**Benefits**: Unified development experience, simplified CI/CD, industry standard structure