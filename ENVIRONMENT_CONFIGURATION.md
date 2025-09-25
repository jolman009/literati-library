# Environment Configuration Guide

This document explains the new environment-based configuration system for the Literati Digital Library application.

## Overview

The application now uses proper environment variables instead of hardcoded hostname detection for API configuration. This resolves production readiness issues and enables proper staging/production separation.

## Key Changes Made

### 🔧 API Configuration (`client2/src/config/api.js`)
- **Removed**: Hardcoded `window.location.hostname` checks
- **Added**: Strict environment variable requirement for `VITE_API_BASE_URL`
- **Benefit**: Prevents deployment issues and enables flexible staging environments

### 🔄 Service Worker Registration (`client2/src/main.jsx`)
- **Removed**: Hostname-based service worker registration
- **Added**: Environment variable control via `VITE_ENABLE_SERVICE_WORKER`
- **Benefit**: Precise control over PWA features across environments

### 🎯 Debug Display (`client2/src/components/AppLayout.jsx`)
- **Removed**: Hostname-dependent debug overlay
- **Added**: Environment-specific debug indicators
- **Benefit**: Clear visual feedback without hardcoded domain dependencies

## Environment Files

### 📁 `.env.development`
```bash
# Local development configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_ENABLE_SERVICE_WORKER=false
VITE_DEBUG_MODE=true
VITE_APP_ENV=development
```

### 📁 `.env.staging`
```bash
# Staging environment configuration
VITE_API_BASE_URL=https://literati-api-staging.onrender.com
VITE_AI_SERVICE_URL=https://literati-ai-staging.onrender.com
VITE_ENABLE_SERVICE_WORKER=true
VITE_DEBUG_MODE=false
VITE_APP_ENV=staging
```

### 📁 `.env.production`
```bash
# Production environment configuration
VITE_API_BASE_URL=https://library-server-m6gr.onrender.com
VITE_AI_SERVICE_URL=https://literati-ai-production.onrender.com
VITE_ENABLE_SERVICE_WORKER=true
VITE_DEBUG_MODE=false
VITE_APP_ENV=production
```

## Build Scripts

New environment-specific build commands have been added to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "preview:staging": "vite build --mode staging && vite preview --port 5174",
    "preview:production": "vite build --mode production && vite preview --port 5174"
  }
}
```

## Deployment Configurations

### 🚀 Production (Vercel)
- **File**: `vercel.json`
- **Build Command**: `pnpm run build:production`
- **Environment**: Automatically uses `.env.production`

### 🧪 Staging (Vercel)
- **File**: `vercel.staging.json`
- **Build Command**: `pnpm run build:staging`
- **Environment**: Automatically uses `.env.staging`
- **Features**: Includes staging-specific headers (noindex, nofollow)

## Usage Instructions

### Development
```bash
cd client2
pnpm install
pnpm run dev  # Uses .env.development automatically
```

### Testing Staging Build Locally
```bash
cd client2
pnpm run preview:staging  # Builds with staging config and serves locally
```

### Testing Production Build Locally
```bash
cd client2
pnpm run preview:production  # Builds with production config and serves locally
```

### Deployment

**Production Deployment:**
```bash
vercel --prod  # Uses vercel.json with production settings
```

**Staging Deployment:**
```bash
vercel --local-config vercel.staging.json  # Uses staging configuration
```

## Environment Variables Reference

| Variable | Development | Staging | Production | Description |
|----------|-------------|---------|------------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Staging API URL | Production API URL | **Required** - Backend API endpoint |
| `VITE_AI_SERVICE_URL` | `http://localhost:8000` | Staging AI URL | Production AI URL | AI service endpoint |
| `VITE_ENABLE_SERVICE_WORKER` | `false` | `true` | `true` | Controls PWA service worker |
| `VITE_DEBUG_MODE` | `true` | `false` | `false` | Enables debug logging |
| `VITE_APP_ENV` | `development` | `staging` | `production` | Environment identifier |
| `VITE_SUPABASE_URL` | Dev Supabase URL | Staging Supabase | Prod Supabase | Database connection |
| `VITE_SUPABASE_ANON_KEY` | Dev anon key | Staging anon key | Prod anon key | Database auth |

## Benefits of This Approach

### ✅ Production Readiness
- No more hardcoded hostname dependencies
- Proper environment separation
- Flexible deployment configurations

### ✅ Development Experience
- Clear environment boundaries
- Easy local testing of production builds
- Consistent configuration patterns

### ✅ Deployment Flexibility
- Support for multiple staging environments
- Platform-agnostic configuration
- Native mobile app compatibility

## Migration Notes

### For Developers
- Update local `.env` files with required variables
- Use new build scripts for environment-specific builds
- Test staging builds locally before deployment

### For DevOps
- Set environment variables in deployment platforms
- Use appropriate build commands for each environment
- Monitor for missing environment variable errors

## Troubleshooting

### Error: "VITE_API_BASE_URL environment variable is required"
**Solution**: Ensure the environment file contains `VITE_API_BASE_URL=your_api_url`

### Service Worker Not Working
**Solution**: Check that `VITE_ENABLE_SERVICE_WORKER=true` in production/staging environments

### API Calls Failing
**Solution**: Verify the `VITE_API_BASE_URL` points to the correct backend service

---

This configuration system resolves the production readiness issues identified in the review and provides a solid foundation for multi-platform deployment.