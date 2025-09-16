# 🚀 Deployment Guide

This guide covers the complete CI/CD pipeline setup and deployment process for the Literati Library App.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Environment Setup](#environment-setup)
- [Deployment Workflows](#deployment-workflows)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The CI/CD pipeline consists of:

- **Continuous Integration (CI)**: Automated testing, linting, security scanning
- **Staging Deployment**: Automatic deployment to staging on `develop` branch
- **Production Deployment**: Manual approval-gated deployment on version tags
- **Dependency Management**: Automated security updates and dependency management

## 🔧 Prerequisites

### Infrastructure Requirements

1. **Production Servers**: 2 Linux servers (Ubuntu 20.04+ recommended)
2. **Staging Server**: 1 Linux server
3. **Domain**: Registered domain with DNS management
4. **Container Registry**: GitHub Container Registry (ghcr.io)
5. **Database**: Supabase project for each environment

### Software Requirements

- Docker & Docker Compose
- SSH access to servers
- SSL certificates (Let's Encrypt recommended)

## 🔐 GitHub Secrets Configuration

### Repository Secrets

Configure these secrets in GitHub repository settings:

#### Staging Environment
```
STAGING_DOMAIN=staging.literati.pro
STAGING_HOST=your-staging-server-ip
STAGING_USER=deploy
STAGING_SSH_KEY=<staging-server-ssh-private-key>

STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_SERVICE_KEY=<staging-service-key>
STAGING_SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
STAGING_SUPABASE_ANON_KEY=<staging-anon-key>

STAGING_JWT_SECRET=<staging-jwt-secret-256-bits>
STAGING_JWT_REFRESH_SECRET=<staging-refresh-secret-256-bits>
STAGING_GOOGLE_API_KEY=<staging-gemini-api-key>
```

#### Production Environment
```
PRODUCTION_DOMAIN=literati.pro
PRODUCTION_HOST_1=your-production-server-1-ip
PRODUCTION_HOST_2=your-production-server-2-ip
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=<production-servers-ssh-private-key>

PRODUCTION_SUPABASE_URL=https://your-production-project.supabase.co
PRODUCTION_SUPABASE_SERVICE_KEY=<production-service-key>
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
PRODUCTION_SUPABASE_ANON_KEY=<production-anon-key>

PRODUCTION_JWT_SECRET=<production-jwt-secret-256-bits>
PRODUCTION_JWT_REFRESH_SECRET=<production-refresh-secret-256-bits>
PRODUCTION_GOOGLE_API_KEY=<production-gemini-api-key>
```

#### Build/Client Environment
```
VITE_API_BASE_URL=https://api.literati.pro
VITE_SUPABASE_URL=<production-supabase-url>
VITE_SUPABASE_ANON_KEY=<production-anon-key>
VITE_AI_SERVICE_URL=https://ai.literati.pro
```

#### Optional Services
```
SNYK_TOKEN=<snyk-security-token>
CODECOV_TOKEN=<codecov-token>
```

### Environment Configuration

#### GitHub Environments

Create these environments in GitHub repository settings:

1. **staging**: For staging deployments
2. **production-approval**: For manual approval gates
3. **production**: For production deployments with protection rules

### Protection Rules

Configure branch protection rules:

- **main branch**: Require PR reviews, status checks
- **develop branch**: Require status checks
- **production environment**: Require manual approval

## 🏗️ Environment Setup

### Server Preparation

#### 1. Create Deploy User
```bash
# On each server
sudo adduser deploy
sudo usermod -aG docker deploy
sudo su - deploy

# Generate SSH key pair
ssh-keygen -t ed25519 -C "deploy@literati"

# Add public key to GitHub Deploy Keys
# Add private key to GitHub Secrets
```

#### 2. Setup Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. Prepare Application Directory
```bash
sudo mkdir -p /opt/literati
sudo chown deploy:deploy /opt/literati
cd /opt/literati

# Create necessary directories
mkdir -p logs backups storage ssl
```

#### 4. DNS Configuration

Configure DNS records:

```
# Production
literati.pro          A    <production-server-1-ip>
api.literati.pro      A    <production-server-1-ip>
ai.literati.pro       A    <production-server-1-ip>

# Staging
staging.literati.pro  A    <staging-server-ip>
```

#### 5. SSL Certificates

Using Let's Encrypt with Traefik (automatic):

```yaml
# In docker-compose.production.yml
labels:
  - "traefik.http.routers.client.tls.certresolver=letsencrypt"
```

Or manual certificate setup:

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d literati.pro -d api.literati.pro -d ai.literati.pro

# Copy to application directory
sudo cp /etc/letsencrypt/live/literati.pro/* /opt/literati/ssl/
sudo chown deploy:deploy /opt/literati/ssl/*
```

## 🔄 Deployment Workflows

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

**Workflow**: CI pipeline runs automatically on PR creation

### 2. Staging Deployment

```bash
# Merge to develop branch
git checkout develop
git merge feature/new-feature
git push origin develop
```

**Workflow**: Automatic deployment to staging environment

### 3. Production Deployment

```bash
# Create release tag
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags
```

**Workflow**: Production deployment with manual approval

### 4. Hotfix Deployment

```bash
# Create hotfix branch
git checkout -b hotfix/critical-fix main

# Make fix and commit
git add .
git commit -m "fix: critical security issue"

# Tag and push
git tag v1.0.1
git push origin hotfix/critical-fix --tags
```

## 📊 Monitoring & Maintenance

### Health Checks

The deployment includes comprehensive health monitoring:

- **Application Health**: `/health` endpoints
- **API Health**: `/api/monitoring/health`
- **Database Health**: Connection and query tests
- **Performance Metrics**: Response times, memory usage

### Monitoring Dashboard

Access monitoring at: `https://literati.pro/api/monitoring/dashboard`

### Log Management

```bash
# View application logs
docker-compose logs -f client
docker-compose logs -f server
docker-compose logs -f ai-service

# View system logs
journalctl -u docker -f
```

### Backup Management

Automated backups are created before each deployment:

```bash
# Manual backup
cd /opt/literati
./scripts/deploy.sh --create-backup-only

# Restore from backup
cd /opt/literati/backups
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
./backup_YYYYMMDD_HHMMSS/restore.sh
```

### Security Updates

Automated dependency updates run weekly:

- Security vulnerability scanning
- Dependency updates with testing
- Automatic PR creation for review

## 🔧 Troubleshooting

### Common Issues

#### 1. Deployment Fails

```bash
# Check deployment logs
ssh deploy@production-server
cd /opt/literati
docker-compose logs

# Check system resources
docker system df
free -h
df -h
```

#### 2. Health Checks Fail

```bash
# Check service status
docker-compose ps

# Check individual service logs
docker-compose logs service-name

# Test endpoints manually
curl -f http://localhost:3000/health
curl -f http://localhost:5000/api/monitoring/health
```

#### 3. SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in /opt/literati/ssl/cert.pem -text -noout | grep "Not After"

# Renew certificates
sudo certbot renew
```

#### 4. Database Connection Issues

```bash
# Test database connectivity
docker-compose exec server npm run db:test

# Check Supabase status
curl -f https://your-project.supabase.co/rest/v1/
```

### Emergency Procedures

#### Rollback Deployment

```bash
# Automatic rollback (if deployment fails)
# - Rollback is triggered automatically by deployment script

# Manual rollback
cd /opt/literati/backups
ls -lt backup_*.tar.gz | head -1  # Find latest backup
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz
./backup_YYYYMMDD_HHMMSS/restore.sh
```

#### Database Restore

```bash
# Restore from Supabase backup
# Use Supabase dashboard or CLI tools
```

### Support Contacts

- **Infrastructure**: DevOps team
- **Application**: Development team
- **Security**: Security team

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Documentation](https://supabase.com/docs)
- [Traefik Documentation](https://doc.traefik.io/traefik/)

For questions or issues, create a GitHub issue or contact the development team.