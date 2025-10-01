# Sentry Error Tracking Setup Guide

This guide explains how to configure Sentry for error tracking and performance monitoring in production.

## Overview

Literati uses **Sentry** for:
- **Error tracking**: Automatic capture of JavaScript errors and exceptions
- **Performance monitoring**: Track API response times, database queries, and render performance
- **Session replay**: Understand user interactions leading to errors
- **Release tracking**: Associate errors with specific app versions

## Prerequisites

1. Create a Sentry account at [https://sentry.io](https://sentry.io)
2. Create two projects:
   - **Frontend**: `literati-frontend` (React)
   - **Backend**: `literati-backend` (Node.js)

## Frontend Setup (Client)

### Step 1: Get Your DSN

1. Go to Sentry Dashboard → Projects → `literati-frontend`
2. Navigate to **Settings** → **Client Keys (DSN)**
3. Copy the DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### Step 2: Configure Environment Variables

#### Production (.env.production)
```bash
# Sentry DSN for production error tracking
VITE_SENTRY_DSN=https://your-actual-production-dsn@sentry.io/project-id

# Enable crash reporting
VITE_ENABLE_CRASH_REPORTING=true

# App version for release tracking
VITE_APP_VERSION=1.0.0

# Environment identifier
VITE_ENVIRONMENT=production

# Sentry disabled in development by default
VITE_SENTRY_DEV_ENABLED=false
```

#### Development (.env.local) - Optional
```bash
# Leave empty to disable Sentry in development
VITE_SENTRY_DSN=

# Or enable for testing
VITE_SENTRY_DSN=https://your-dev-dsn@sentry.io/project-id
VITE_SENTRY_DEV_ENABLED=true
```

### Step 3: Deploy Configuration

The Sentry configuration is already integrated in:
- **client2/src/services/sentry.jsx** - Sentry initialization and helpers
- **client2/src/main.jsx** - Root-level error boundary
- **client2/src/App.jsx** - Route-specific error boundaries

No code changes needed! Just set the environment variables.

### Step 4: Verify Installation

After deploying with the DSN configured:

1. **Test error tracking**:
   - Trigger an intentional error in production
   - Check Sentry Dashboard → Issues

2. **Check performance**:
   - Navigate through the app
   - Check Sentry Dashboard → Performance

## Backend Setup (Server)

### Step 1: Get Your Backend DSN

1. Go to Sentry Dashboard → Projects → `literati-backend`
2. Navigate to **Settings** → **Client Keys (DSN)**
3. Copy the DSN

### Step 2: Configure Environment Variables

Add to `server2/.env.production` or deployment platform (Render):

```bash
# Sentry DSN for backend error tracking
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id

# App version
APP_VERSION=1.0.0

# Server identifier
SERVER_NAME=literati-api

# Node environment
NODE_ENV=production
```

### Step 3: Verify Integration

The Sentry configuration is already integrated in:
- **server2/src/config/sentry.js** - Server-side Sentry setup
- **server2/src/server.js** - Middleware integration

Check logs on server startup:
```
[Sentry] Initialized for environment: production
```

## Configuration Details

### Frontend Features

#### Error Filtering
Automatically filters out common non-critical errors:
- `ResizeObserver loop limit exceeded`
- `ChunkLoadError` (lazy loading failures)
- `AbortError` (cancelled requests)
- Browser extension errors

#### Performance Monitoring
- **Traces Sample Rate**: 10% in production (reduces quota usage)
- **Session Replay**: 10% of sessions, 100% on errors
- **Route tracking**: Automatic page view tracking
- **API call tracking**: Monitors fetch performance

#### Privacy
- **sendDefaultPII**: Enabled for better debugging
- **User context**: Automatically set after login
- **Breadcrumbs**: Tracks user actions leading to errors

### Backend Features

#### Error Filtering
Filters non-critical errors:
- Validation errors (handled properly)
- Client connection resets
- Expected 400-level responses

#### Performance Monitoring
- **Transaction sampling**: 10% in production
- **Health check sampling**: 1% (reduced noise)
- **Database query tracking**: Monitors slow queries
- **API endpoint tracking**: Response time monitoring

#### Release Tracking
- Ties errors to specific `APP_VERSION`
- Helps identify which deployment introduced bugs

## Usage Examples

### Manual Error Reporting (Frontend)

```javascript
import { captureSentryException, addSentryBreadcrumb } from './services/sentry.jsx';

try {
  // risky operation
  await processPayment();
} catch (error) {
  // Add context
  addSentryBreadcrumb('Payment failed', 'payment', 'error', {
    amount: 99.99,
    userId: currentUser.id
  });

  // Report to Sentry
  captureSentryException(error, {
    paymentMethod: 'credit_card',
    attemptNumber: retryCount
  });
}
```

### Setting User Context (Frontend)

```javascript
import { setSentryUser } from './services/sentry.jsx';

// After successful login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username
});
```

### Manual Error Reporting (Backend)

```javascript
import { reportError, addBreadcrumb } from './config/sentry.js';

try {
  await saveToDatabase(data);
} catch (error) {
  addBreadcrumb('Database save failed', 'database', 'error', {
    table: 'users',
    operation: 'insert'
  });

  reportError(error, {
    tags: { section: 'user-creation' },
    user: { id: req.user?.id }
  });

  throw error;
}
```

### Performance Tracking (Backend)

```javascript
import { withSentryTransaction } from './config/sentry.js';

async function fetchUserData(userId) {
  return await withSentryTransaction(
    `fetch-user-${userId}`,
    'db.query',
    async (transaction) => {
      // This operation is tracked
      const user = await db.users.findById(userId);
      transaction.setData('userId', userId);
      return user;
    }
  );
}
```

## Deployment Checklist

### Before First Production Deploy

- [ ] Create Sentry projects (frontend + backend)
- [ ] Copy DSNs from Sentry dashboard
- [ ] Add `VITE_SENTRY_DSN` to Vercel environment variables
- [ ] Add `SENTRY_DSN` to Render environment variables
- [ ] Set `VITE_ENABLE_CRASH_REPORTING=true`
- [ ] Set appropriate `VITE_APP_VERSION`
- [ ] Deploy and verify initialization in logs

### After Deploy

- [ ] Trigger test error to verify reporting
- [ ] Check Sentry dashboard for events
- [ ] Verify user context is being set
- [ ] Check performance transactions
- [ ] Set up alert rules in Sentry

## Sentry Dashboard Configuration

### Recommended Alert Rules

1. **Critical Error Alert**:
   - Condition: New issue with level = error
   - Action: Email + Slack notification
   - Frequency: Immediate

2. **High Volume Alert**:
   - Condition: > 100 events in 1 hour
   - Action: Email notification
   - Helps identify widespread issues

3. **Performance Degradation**:
   - Condition: P95 response time > 2 seconds
   - Action: Email notification
   - Helps catch performance regressions

### Release Management

Enable releases in Sentry to track which deploy introduced bugs:

```bash
# In CI/CD pipeline (GitHub Actions)
- name: Create Sentry Release
  run: |
    npm install @sentry/cli
    npx sentry-cli releases new ${{ github.sha }}
    npx sentry-cli releases set-commits ${{ github.sha }} --auto
    npx sentry-cli releases finalize ${{ github.sha }}
```

## Cost Management

### Free Tier Limits
- 5,000 errors/month
- 10,000 performance transactions/month
- 50 replays/month

### Optimization Tips

1. **Reduce sampling in production**:
   ```javascript
   tracesSampleRate: 0.1, // 10% of transactions
   replaysSessionSampleRate: 0.1, // 10% of sessions
   ```

2. **Filter noisy errors**:
   - Add common non-critical errors to `ignoreErrors`
   - Use `beforeSend` to filter dynamically

3. **Sample high-frequency endpoints**:
   - Health checks: 1% sampling
   - Read operations: 10% sampling
   - Critical operations: 100% sampling

## Troubleshooting

### Sentry Not Initialized

**Symptom**: No errors appearing in dashboard

**Solutions**:
1. Check `VITE_SENTRY_DSN` is set correctly
2. Verify `VITE_ENABLE_CRASH_REPORTING=true`
3. Check browser console for Sentry init messages
4. Ensure DSN matches your project

### Too Many Events

**Symptom**: Hitting quota limits quickly

**Solutions**:
1. Lower `tracesSampleRate` to 0.05 (5%)
2. Add more filters to `ignoreErrors`
3. Sample high-frequency endpoints less
4. Use `beforeSend` to filter programmatically

### Missing User Context

**Symptom**: Errors don't show which user experienced them

**Solutions**:
1. Ensure `setSentryUser()` called after login
2. Check `sendDefaultPII: true` in config
3. Verify user data structure matches expected format

## Security Considerations

1. **PII Filtering**: Be cautious with `sendDefaultPII`
   - Review what data is sent to Sentry
   - Use `beforeSend` to scrub sensitive data

2. **DSN Protection**: Keep DSNs in environment variables
   - Never commit DSNs to version control
   - Use different DSNs for dev/staging/production

3. **Data Retention**: Configure in Sentry settings
   - Set appropriate retention periods
   - Enable automatic PII scrubbing

## Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring Guide](https://docs.sentry.io/product/performance/)
- [Release Tracking Guide](https://docs.sentry.io/product/releases/)

## Support

For issues with Sentry integration:
1. Check this documentation first
2. Review Sentry dashboard for initialization errors
3. Check browser/server console logs
4. Contact Sentry support if needed
