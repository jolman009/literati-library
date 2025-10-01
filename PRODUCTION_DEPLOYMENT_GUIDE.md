# Literati Production Deployment Guide
*Based on Production Readiness Review - September 2025*

## 🚀 Immediate Actions (Ready to Deploy)

### ✅ Core Infrastructure Status
Your application has already achieved several production-ready milestones:
- **Domain configured**: literati.pro with HTTPS
- **Backend deployed**: library-server-m6gr.onrender.com
- **Frontend deployed**: Vercel with automated GitHub integration
- **Database connected**: Supabase with proper authentication
- **CORS issues resolved**: Custom headers properly configured

### 🎯 Priority 1: Production Deployment (Next 1-2 Days)

#### 1.1 Environment Configuration
```bash
# Required: Replace hardcoded API URLs with environment variables
# Current issue: window.location.hostname checks in AuthContext.jsx

# Update client2/.env.production
VITE_API_BASE_URL=https://library-server-m6gr.onrender.com
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CRASH_REPORTING=true
```

**Action Required:**
- [ ] Update [AuthContext.jsx:28-30](client2/src/contexts/AuthContext.jsx#L28-30) to remove hardcoded domain checks
- [ ] Use `import.meta.env.VITE_API_BASE_URL` consistently across all API calls

#### 1.2 Security Hardening ✅ PARTIALLY COMPLETED

**Status:** HttpOnly cookies implemented, rate limiting pending

**What was completed:**
- [x] Implemented HttpOnly cookies for authentication tokens
- [x] Updated all backend auth endpoints (register, login, refresh, logout)
- [x] Migrated frontend to cookie-based authentication
- [x] Removed localStorage token storage (more secure)
- [x] Implemented automatic token refresh mechanism
- [x] Fixed logout functionality to clear server-side cookies
- [x] Added proper async/await patterns for auth operations

**Remaining tasks:**
- [ ] Add rate limiting middleware to `server2/src/server.js`
  ```bash
  npm install express-rate-limit express-slow-down
  ```

#### 1.3 Monitoring & Error Tracking ✅ COMPLETED & TESTED

**Status:** Sentry is fully operational and tested in development!

**What was completed:**
- [x] Enhanced `.env.production` with Sentry DSN configuration
- [x] Added Sentry DSN to `server2/.env.example`
- [x] Wrapped app with root-level Sentry error boundary in `main.jsx`
- [x] Route-specific error boundaries already configured in `App.jsx`
- [x] Created comprehensive setup guide: [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md)
- [x] Frontend and backend Sentry integration fully configured
- [x] Performance monitoring configured (10% sampling in production)
- [x] Session replay configured (10% sessions, 100% on errors)
- [x] **Created Sentry projects for frontend and backend**
- [x] **Configured DSNs in local development environment**
- [x] **Tested error tracking - confirmed working!**
- [x] **Added DSNs to Vercel and Render production environments**

**Configured Sentry Projects:**
- **Frontend:** literati-frontend project
- **Backend:** literati-backend project
- **DSNs:** Already added to Vercel (frontend) and Render (backend) environment variables

**Critical Fix Applied:**
Fixed `.env.development` conflict where empty `VITE_SENTRY_DSN=` was overriding `.env.local`. Removed the conflicting line to allow proper environment variable priority.

**Testing Results:**
- ✅ Error tracking verified in development
- ✅ Errors appearing in Sentry dashboard
- ✅ Browser integration working (GlobalHandlers, BrowserApiErrors, etc.)
- ✅ Debug mode active in development for verification

**Production Ready:**
Sentry will automatically activate when deployed to production. No additional configuration needed - DSNs are already in place on Vercel and Render.

**Documentation:** See [docs/SENTRY_SETUP.md](docs/SENTRY_SETUP.md) for complete setup instructions

## 📊 Priority 2: CI/CD Pipeline (Next 3-5 Days)

### 2.1 GitHub Actions Enhancement
Your existing workflows need production-ready improvements:

```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment
on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Run Full Test Suite
        run: |
          pnpm run test:all
          pnpm run test:e2e

      - name: Security Audit
        run: |
          pnpm audit --audit-level moderate
          npm audit signatures

      - name: Deploy to Production
        if: success()
        run: |
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 2.2 Staging Environment
Create a staging environment that mirrors production:

```bash
# New staging domain
staging.literati.pro

# Staging environment variables
VITE_API_BASE_URL=https://staging-library-server.onrender.com
VITE_ENVIRONMENT=staging
```

## 🔒 Priority 3: Security & Performance (Next Week)

### 3.1 Backend Security Improvements
```javascript
// server2/src/middleware/security.js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts'
});

app.use('/auth', authLimiter);
```

### 3.2 Frontend Performance Optimization
Your vite.config.mjs already has good optimization, but add:

```javascript
// Additional optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Your existing chunks are good
          'error-tracking': ['@sentry/react'],
          'auth-core': ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

## 📱 Priority 4: Mobile App Store Preparation (Next 2-3 Weeks)

### 4.1 Android Play Store (Highest Priority)
Your Android deployment guide is comprehensive. Next steps:

```bash
# Generate production keystore
./android/scripts/generate-keystore.sh production

# Build AAB for Play Store
./gradlew bundleRelease

# Upload Digital Asset Links
curl -X PUT https://literati.pro/.well-known/assetlinks.json \
  -d @android/assetlinks.json
```

**Store Assets Needed:**
- [ ] Feature graphic (1024 x 500)
- [ ] App icon (512 x 512)
- [ ] Screenshots (phone + tablet)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire

### 4.2 iOS App Store (Medium Priority)
Since iOS doesn't support TWA, use Capacitor:

```bash
# Initialize Capacitor project
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init literati com.literati.app
npx cap add ios

# Build and sync
npm run build
npx cap sync ios
npx cap open ios
```

**Native Features to Add:**
- [ ] Push notifications via Firebase
- [ ] Offline file downloads
- [ ] Sign in with Apple integration
- [ ] iOS-specific file handling

### 4.3 Windows Store (Lower Priority)
Use PWABuilder for quick deployment:

```bash
# Generate Windows package
1. Go to pwabuilder.com
2. Enter: https://literati.pro
3. Download generated MSIX
4. Test on Windows 10/11
5. Submit to Microsoft Partner Center
```

## 🛠️ Implementation Timeline

### Week 1: Production Ready
**✶ Insight ─────────────────────────────────────**
- Focus on environment configuration and security hardening
- Your app is already technically deployable - these are optimizations
- Sentry integration you worked on earlier becomes critical here
**─────────────────────────────────────────────────**

- [ ] **Day 1-2**: Fix environment variable configuration
- [ ] **Day 3-4**: Implement rate limiting and security improvements
- [ ] **Day 5-7**: Set up production monitoring and error tracking

### Week 2: Mobile Preparation
- [ ] **Day 8-10**: Complete Android build setup and keystore generation
- [ ] **Day 11-12**: Prepare store assets and descriptions
- [ ] **Day 13-14**: Submit to Play Store for review

### Week 3: iOS Development
- [ ] **Day 15-17**: Set up Capacitor and iOS project
- [ ] **Day 18-19**: Implement native iOS features
- [ ] **Day 20-21**: Test and submit to App Store

### Week 4: Windows & Polish
- [ ] **Day 22-24**: Generate and test Windows package
- [ ] **Day 25-26**: Submit to Microsoft Store
- [ ] **Day 27-28**: Final testing and documentation

## 🎯 Success Metrics

### Technical Metrics
- [ ] **Load time**: < 3 seconds on 3G
- [ ] **Lighthouse score**: > 90 across all categories
- [ ] **Error rate**: < 0.1% in production
- [ ] **Uptime**: > 99.9%

### App Store Metrics
- [ ] **Play Store approval**: < 7 days
- [ ] **App Store approval**: < 14 days
- [ ] **User rating**: > 4.0 stars
- [ ] **Crash rate**: < 0.5%

## 🚨 Critical Dependencies

### Immediate Blockers
1. **Environment variable migration**: Required for staging/production separation
2. **Rate limiting implementation**: Required for security compliance
3. **Token security improvement**: Required for mobile app stores

### Nice-to-Have Features
1. **Push notifications**: Increases engagement but not required for launch
2. **Offline editing**: Complex feature that can be added post-launch
3. **Multi-language support**: Can be added based on user feedback

## 📋 Pre-Launch Checklist

### Technical Requirements
- [ ] All environment variables properly configured
- [ ] Rate limiting implemented and tested
- [ ] Error tracking working in production
- [ ] Security headers properly configured
- [ ] HTTPS enforced across all domains
- [ ] Database backups automated

### Legal & Compliance
- [ ] Privacy policy published and linked
- [ ] Terms of service created
- [ ] GDPR compliance reviewed (if EU users)
- [ ] Content rating completed for all stores
- [ ] Digital Asset Links configured for Android

### Store Preparation
- [ ] All store assets created and optimized
- [ ] App descriptions written and localized
- [ ] Screenshots taken across all device types
- [ ] Developer accounts created and verified
- [ ] Payment methods configured for paid features

## 🎉 Launch Strategy

### Soft Launch (Week 1)
- Deploy to production with limited user access
- Monitor error rates and performance
- Fix any critical issues discovered

### Public Launch (Week 2)
- Remove deployment protection
- Announce on social media and to beta users
- Monitor app store approval status

### Post-Launch (Week 3+)
- Collect user feedback and crash reports
- Plan feature updates based on usage analytics
- Scale infrastructure based on user growth

Your Literati application is remarkably close to production-ready. The main focus should be on the environment configuration and security improvements outlined in Priority 1. The mobile app store deployments can follow once the web application is stable in production.