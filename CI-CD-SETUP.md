# 🚀 CI/CD Pipeline Setup Guide

This guide will help you set up the complete CI/CD pipeline for your Literati digital library application.

## 📋 Prerequisites

- ✅ GitHub repository created
- ✅ Vercel account (for client deployment)  
- ✅ Render.com account (for server deployment)
- ✅ Docker Hub account (for container registry)
- ✅ Environment variables configured

## 🔧 Setup Steps

### 1. **GitHub Repository Setup**

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit with CI/CD pipeline"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/literati-library.git
git branch -M main
git push -u origin main
```

### 2. **GitHub Secrets Configuration**

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### **Environment Variables**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-super-secure-jwt-secret
GOOGLE_API_KEY=your-google-gemini-api-key
```

#### **Deployment Secrets**
```
# Vercel (for client deployment)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

# Docker Hub (for container registry)
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password

# Optional: Lighthouse CI
LHCI_GITHUB_APP_TOKEN=your-lighthouse-github-token
```

### 3. **Vercel Setup**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel@latest
   ```

2. **Login and setup:**
   ```bash
   cd client2
   vercel login
   vercel link
   ```

3. **Configure Vercel project:**
   - Build Command: `pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
   - Development Command: `pnpm run dev`

4. **Get Vercel tokens:**
   ```bash
   # Get your tokens
   vercel whoami
   # Copy ORG ID and PROJECT ID from .vercel/project.json
   ```

### 4. **Docker Hub Setup**

1. Create repositories on Docker Hub:
   - `your-username/literati-client`
   - `your-username/literati-server` 
   - `your-username/literati-ai`

2. Generate access token:
   - Docker Hub → Account Settings → Security → Access Tokens

## 🔄 Workflow Overview

### **Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)**

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Jobs:**
1. **🧪 Test Suite** - Runs tests for all services
2. **🏗️ Build Client** - Builds React app with optimizations
3. **🐳 Build Docker** - Creates and pushes Docker images
4. **🚀 Deploy Staging** - Deploys to staging environment
5. **🌟 Deploy Production** - Deploys to production environment
6. **🔒 Security Scan** - Runs security audits on PRs
7. **🏃 Performance Tests** - Runs Lighthouse performance tests

### **Vercel Deployment (`.github/workflows/deploy-vercel.yml`)**

**Triggers:**
- Push to `main` branch with `client2/**` changes
- Manual workflow dispatch

**Process:**
1. Run tests and linting
2. Build with Vercel CLI
3. Deploy to production

### **Docker Integration Tests (`.github/workflows/docker-test.yml`)**

**Triggers:**
- Pull requests to `main`
- Push to `develop`

**Process:**
1. Build full Docker stack
2. Test service health endpoints
3. Verify inter-service communication

## 🎯 Branch Strategy

### **Recommended Git Flow:**

```
main (production)
├── develop (staging)
│   ├── feature/new-feature
│   ├── bugfix/fix-issue
│   └── hotfix/urgent-fix
```

**Branch Rules:**
- `main`: Production-ready code, requires PR reviews
- `develop`: Integration branch for features
- `feature/*`: New features, merge to develop
- `bugfix/*`: Bug fixes, merge to develop  
- `hotfix/*`: Urgent fixes, merge to main and develop

## 📊 Monitoring & Quality Gates

### **Automated Quality Checks:**
- ✅ **Tests must pass** (7+ passing tests)
- ✅ **Linting must pass** (ESLint)
- ✅ **Security audit** (pnpm audit)
- ✅ **Docker builds** (all services)
- ✅ **Performance budget** (Lighthouse CI)

### **Code Coverage:**
- Reports uploaded to Codecov
- Minimum coverage threshold enforced
- Coverage reports in PR comments

## 🚀 Deployment Environments

### **Staging:**
- Branch: `develop`
- URL: `https://literati-staging.vercel.app`
- Purpose: Feature testing and QA

### **Production:**
- Branch: `main` 
- URL: `https://literati.pro`
- Purpose: Live user environment

## 🛠️ Manual Commands

### **Local Testing:**
```bash
# Run full test suite
pnpm run test:unit

# Test Docker build locally
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up

# Deploy to Vercel manually
cd client2
vercel --prod
```

### **Emergency Rollback:**
```bash
# Rollback Vercel deployment
vercel rollback

# Rollback Docker images
docker pull your-username/literati-client:previous-tag
```

## 🔍 Troubleshooting

### **Common Issues:**

1. **Tests failing in CI:**
   - Check environment variables are set
   - Verify dependencies are installed
   - Review test logs in GitHub Actions

2. **Docker build failures:**
   - Check Dockerfile syntax
   - Verify base images are accessible
   - Review build context and .dockerignore

3. **Vercel deployment issues:**
   - Check build settings match local
   - Verify environment variables
   - Review build logs

### **Debug Commands:**
```bash
# Test CI locally with act
npm install -g @nektos/act
act push

# Debug Docker builds
docker build --no-cache -t debug-image ./client2
docker run -it debug-image sh

# Check Vercel logs
vercel logs
```

## 📈 Performance Monitoring

### **Metrics Tracked:**
- Build times
- Test execution time
- Bundle size changes
- Lighthouse scores
- Docker image sizes

### **Alerts:**
- Failed deployments
- Performance regressions
- Security vulnerabilities
- Test failures

## 🎉 Next Steps

Once your CI/CD pipeline is set up:

1. **Create first PR** to test the workflow
2. **Set up monitoring** dashboards  
3. **Configure notifications** for failures
4. **Add more comprehensive tests**
5. **Set up staging environment**

Your CI/CD pipeline is now ready to provide:
- 🔄 **Automated testing** on every change
- 🚀 **Zero-downtime deployments**
- 📊 **Performance monitoring**
- 🔒 **Security scanning**
- 📈 **Quality metrics tracking**