# 🔧 ShelfQuest Troubleshooting & Maintenance Guide

Comprehensive troubleshooting guide and maintenance procedures for the ShelfQuest Digital Library.

## 🚨 **Emergency Response**

### **Service Down Checklist**
When users report the service is down:

1. **Check Service Status** (2 minutes)
```bash
# Check all health endpoints
curl https://your-frontend.vercel.app/              # Frontend
curl https://your-backend.onrender.com/health       # Backend
curl https://your-ai-service.onrender.com/health    # AI Service
```

2. **Check External Service Status** (1 minute)
- [Vercel Status](https://www.vercel-status.com/)
- [Render Status](https://status.render.com/)
- [Supabase Status](https://status.supabase.com/)
- [Google Cloud Status](https://status.cloud.google.com/)

3. **Check Recent Deployments** (1 minute)
```bash
# Check recent GitHub Actions
gh run list --limit 5

# Check Vercel deployments
vercel ls

# Check Render dashboard for failed deployments
```

4. **Immediate Actions**
```bash
# If recent deployment caused issue, rollback immediately
vercel rollback                    # Frontend rollback
# Use Render dashboard for backend rollback

# If database issue, check Supabase dashboard
# If critical, enable maintenance mode (if implemented)
```

## 🔍 **Diagnostic Tools**

### **Health Check Commands**
```bash
# Complete system health check
./scripts/health-check.sh

# Or manual checks:
echo "🔍 Checking Frontend..."
curl -s -o /dev/null -w "%{http_code}" https://your-frontend.vercel.app/
echo "Frontend Status: $?"

echo "🔍 Checking Backend API..."
curl -s https://your-backend.onrender.com/health | jq '.'

echo "🔍 Checking AI Service..."
curl -s https://your-ai-service.onrender.com/health | jq '.'

echo "🔍 Checking Database..."
curl -s https://your-backend.onrender.com/debug/db-connection | jq '.'
```

### **Log Analysis**
```bash
# View recent logs (if using centralized logging)
# GitHub Actions logs
gh run view --log

# Vercel logs
vercel logs

# Render logs (via dashboard or CLI if available)
```

## 🖥️ **Frontend Issues**

### **Common Frontend Problems**

#### **1. Application Won't Load**
**Symptoms**: White screen, loading forever, or immediate error

**Diagnostic Steps**:
```bash
# Check browser console for errors
# Press F12 -> Console tab

# Check if API is responding
curl https://your-backend.onrender.com/health

# Check environment variables in build
vercel env ls
```

**Common Causes & Fixes**:
```javascript
// API URL misconfiguration
// Check client2/.env.production
VITE_API_BASE_URL=https://your-backend.onrender.com  // ✅ Correct
VITE_API_BASE_URL=http://localhost:5000              // ❌ Wrong for prod

// Service worker issues
// Clear browser cache or disable service worker temporarily
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}
```

#### **2. Authentication Issues**
**Symptoms**: Can't login, redirected to login repeatedly, token errors

**Diagnostic Steps**:
```bash
# Test login endpoint directly
curl -X POST https://your-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123"}'

# Check if JWT_SECRET matches between client and server
```

**Common Fixes**:
```javascript
// Clear localStorage and try again
localStorage.clear();
sessionStorage.clear();

// Check token expiration
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires:', new Date(payload.exp * 1000));
}
```

#### **3. Performance Issues**
**Symptoms**: Slow loading, large bundle size, poor Core Web Vitals

**Diagnostic Steps**:
```bash
# Analyze bundle size
cd client2
pnpm run build
pnpm exec vite-bundle-analyzer dist

# Check Core Web Vitals
# Use Chrome DevTools Lighthouse tab
```

**Performance Fixes**:
```javascript
// Enable code splitting for large pages
const BookReader = lazy(() => import('./pages/BookReader'));

// Optimize images
// Use WebP format and responsive images
<img src="book-cover.webp" loading="lazy" alt="Book cover" />

// Preload critical resources
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
```

## ⚙️ **Backend Issues**

### **Common Backend Problems**

#### **1. API Endpoints Not Responding**
**Symptoms**: 500 errors, timeouts, connection refused

**Diagnostic Steps**:
```bash
# Check if server is running
curl -v https://your-backend.onrender.com/health

# Check server logs in Render dashboard
# Look for startup errors or crashes

# Test database connection
curl https://your-backend.onrender.com/debug/db-connection
```

**Common Fixes**:
```javascript
// Environment variable issues
console.log('Environment check:');
console.log('PORT:', process.env.PORT);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

// Database connection pool exhaustion
// Add connection limits in Supabase client
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
});
```

#### **2. Database Issues**
**Symptoms**: Query timeouts, connection errors, data inconsistency

**Diagnostic Steps**:
```sql
-- Check active connections in Supabase
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

-- Check database size and growth
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Database Fixes**:
```sql
-- Add missing indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_books_user_id
ON books(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_book_id_created_at
ON notes(book_id, created_at DESC);

-- Update table statistics
ANALYZE books;
ANALYZE notes;
ANALYZE reading_sessions;
```

#### **3. Rate Limiting Issues**
**Symptoms**: 429 errors, legitimate users blocked

**Diagnostic Steps**:
```bash
# Check current rate limit status
curl -I https://your-backend.onrender.com/books

# Look for rate limit headers:
# RateLimit-Limit: 100
# RateLimit-Remaining: 95
# RateLimit-Reset: 1640995200
```

**Rate Limit Fixes**:
```javascript
// Temporarily increase limits for emergency
const emergencyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100
  message: 'Rate limit temporarily increased for maintenance'
});

// Or disable rate limiting temporarily (use with caution)
// Comment out rate limiting middleware in emergency situations
```

## 🤖 **AI Service Issues**

### **Common AI Service Problems**

#### **1. AI Summaries Not Working**
**Symptoms**: Summarization fails, timeouts, poor quality summaries

**Diagnostic Steps**:
```bash
# Test AI service directly
curl -X POST https://your-ai-service.onrender.com/summarize-note \
  -H "Content-Type: application/json" \
  -d '{"content":"This is a test note for summarization","summaryType":"brief"}'

# Check Google Cloud Console for API quotas
# Check Gemini API key validity
```

**AI Service Fixes**:
```python
# Implement retry logic with exponential backoff
import time
import random

def retry_with_backoff(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait_time)

# Add request timeout handling
import asyncio
from asyncio import timeout

async def summarize_with_timeout(content):
    async with timeout(30):  # 30 second timeout
        return await generate_summary(content)
```

#### **2. High Latency Issues**
**Symptoms**: Slow AI responses, request timeouts

**Fixes**:
```python
# Implement caching for common requests
import hashlib
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_summary(content):
    content_hash = hashlib.md5(content.encode()).hexdigest()
    cached_result = redis_client.get(f"summary:{content_hash}")
    if cached_result:
        return json.loads(cached_result)
    return None

def cache_summary(content, summary):
    content_hash = hashlib.md5(content.encode()).hexdigest()
    redis_client.setex(f"summary:{content_hash}", 3600, json.dumps(summary))
```

## 💾 **Database Maintenance**

### **Regular Maintenance Tasks**

#### **Weekly Tasks**
```sql
-- Update table statistics (Sunday night)
ANALYZE books;
ANALYZE notes;
ANALYZE reading_sessions;
ANALYZE users;

-- Check for unused indexes
SELECT
    schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

-- Vacuum analyze to reclaim space
VACUUM ANALYZE books;
VACUUM ANALYZE notes;
```

#### **Monthly Tasks**
```sql
-- Check database size growth
SELECT
    pg_size_pretty(pg_database_size(current_database())) as db_size,
    pg_size_pretty(pg_total_relation_size('books')) as books_size,
    pg_size_pretty(pg_total_relation_size('notes')) as notes_size;

-- Identify slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    min_time,
    max_time
FROM pg_stat_statements
WHERE calls > 100
ORDER BY mean_time DESC
LIMIT 20;

-- Check for table bloat
SELECT
    tablename,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as size,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

#### **Backup Verification**
```bash
# Verify Supabase backups are working
# Check Supabase Dashboard > Settings > Database > Backups

# Test backup restoration (staging environment)
# This should be done monthly to ensure backups are valid

# Export critical data for additional backup
pg_dump "postgresql://user:pass@host:port/db" \
  --table=books --table=users --table=notes \
  > critical_data_backup.sql
```

### **Performance Monitoring**
```sql
-- Monitor connection usage
SELECT
    state,
    count(*) as connections
FROM pg_stat_activity
GROUP BY state;

-- Check for long-running queries
SELECT
    pid,
    now() - pg_stat_activity.query_start as duration,
    query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state = 'active';

-- Monitor cache hit ratios (should be >95%)
SELECT
    'heap_read' as name,
    heap_blks_hit / (heap_blks_hit + heap_blks_read)::float * 100 as ratio
FROM pg_statio_user_tables
WHERE heap_blks_read > 0;
```

## 🔐 **Security Incident Response**

### **Security Alert Procedures**

#### **1. Suspected Data Breach**
```bash
# Immediate actions (within 5 minutes):
# 1. Preserve evidence - don't delete logs
# 2. Identify affected systems
# 3. Contain the breach

# Check for suspicious activity
grep -i "failed\|error\|unauthorized" /var/log/app.log | tail -100

# Review recent admin actions
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://your-backend.onrender.com/admin/audit-logs

# If confirmed breach:
# 1. Invalidate all user sessions
# 2. Reset API keys and secrets
# 3. Force password resets for affected users
# 4. Document incident timeline
```

#### **2. DDoS Attack Response**
```bash
# Enable stricter rate limiting
# Update rate limits in security middleware:
const emergencyRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Very restrictive
  message: 'Emergency rate limiting active'
});

# Check attack patterns
grep "429" /var/log/nginx/access.log | \
  awk '{print $1}' | sort | uniq -c | sort -nr | head -20

# Consider enabling maintenance mode
# Update frontend to show maintenance message
```

#### **3. Vulnerability Disclosure**
```bash
# Immediate patch workflow:
# 1. Assess severity (Critical/High/Medium/Low)
# 2. Develop and test fix
# 3. Deploy to staging for verification
# 4. Emergency deployment to production
# 5. Verify fix is effective
# 6. Document and notify affected users if necessary

# Check for vulnerable dependencies
cd server2 && pnpm audit --audit-level high
cd client2 && pnpm audit --audit-level high
cd ai-service && pip-audit
```

## 📊 **Monitoring and Alerts**

### **Key Metrics to Monitor**

#### **Application Metrics**
```javascript
// Custom health check endpoint with metrics
app.get('/health-detailed', (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    database: {
      connected: supabase.connected,
      activeConnections: getActiveConnectionCount(),
    },
    cache: {
      hitRate: getCacheHitRate(),
      size: getCacheSize(),
    },
    rateLimits: {
      activeBlocks: getActiveRateLimitBlocks(),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(metrics);
});
```

#### **Alert Thresholds**
```yaml
# Example alert configuration
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    severity: "critical"

  - name: "Database Connection Issues"
    condition: "db_connection_errors > 10"
    duration: "2m"
    severity: "critical"

  - name: "High Memory Usage"
    condition: "memory_usage > 85%"
    duration: "10m"
    severity: "warning"

  - name: "Slow API Response"
    condition: "response_time_p95 > 5s"
    duration: "5m"
    severity: "warning"
```

### **Monitoring Scripts**
```bash
#!/bin/bash
# scripts/monitoring/health-check.sh

# Service health check script
echo "=== ShelfQuest Health Check ==="
echo "Date: $(date)"

# Check frontend
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" https://your-frontend.vercel.app/)
echo "Frontend: $frontend_status"

# Check backend API
backend_response=$(curl -s https://your-backend.onrender.com/health)
backend_status=$(echo $backend_response | jq -r '.status // "unhealthy"')
echo "Backend: $backend_status"

# Check AI service
ai_response=$(curl -s https://your-ai-service.onrender.com/health)
ai_status=$(echo $ai_response | jq -r '.status // "unhealthy"')
echo "AI Service: $ai_status"

# Check database
db_response=$(curl -s https://your-backend.onrender.com/debug/db-connection)
db_status=$(echo $db_response | jq -r '.connected // false')
echo "Database: $db_status"

# Overall health
if [ "$frontend_status" = "200" ] && [ "$backend_status" = "healthy" ] && [ "$ai_status" = "healthy" ] && [ "$db_status" = "true" ]; then
  echo "Overall Status: HEALTHY ✅"
  exit 0
else
  echo "Overall Status: UNHEALTHY ❌"
  exit 1
fi
```

## 🛠️ **Common Maintenance Tasks**

### **Routine Maintenance Checklist**

#### **Daily Tasks** (Automated)
- [ ] Health checks for all services
- [ ] Log rotation and cleanup
- [ ] Security scan results review
- [ ] Database connection monitoring
- [ ] Error rate monitoring

#### **Weekly Tasks**
- [ ] Database performance review
- [ ] Security patch assessment
- [ ] Backup verification
- [ ] Dependency updates (non-breaking)
- [ ] Performance metrics review

#### **Monthly Tasks**
- [ ] Full security audit
- [ ] Database optimization
- [ ] Log analysis and insights
- [ ] Capacity planning review
- [ ] Documentation updates

#### **Quarterly Tasks**
- [ ] Disaster recovery testing
- [ ] Security penetration testing
- [ ] Performance benchmarking
- [ ] Infrastructure cost optimization
- [ ] Team runbook updates

### **Update Procedures**

#### **Dependency Updates**
```bash
# Check for outdated packages
cd client2 && pnpm outdated
cd server2 && pnpm outdated
cd ai-service && pip list --outdated

# Update non-breaking changes
cd client2 && pnpm update --latest
cd server2 && pnpm update --latest
cd ai-service && pip-review --auto

# Test thoroughly before deploying
pnpm run test:all
pnpm run build:production
```

#### **Security Updates**
```bash
# Emergency security update process:
# 1. Identify vulnerable package
pnpm audit --audit-level critical

# 2. Update specific package
pnpm add package@latest

# 3. Test critical paths
pnpm run test:security

# 4. Deploy immediately if critical
git add . && git commit -m "security: update vulnerable dependency"
git push origin main  # Triggers immediate deployment
```

## 📞 **Emergency Contacts and Procedures**

### **Escalation Matrix**
```
Level 1 - Service Degradation:
- Primary: Development Team
- Response Time: 4 hours during business hours

Level 2 - Service Outage:
- Primary: Senior Developer/DevOps
- Secondary: Technical Lead
- Response Time: 1 hour

Level 3 - Security Incident:
- Primary: Security Team/CTO
- Secondary: All senior staff
- Response Time: 30 minutes

Level 4 - Data Breach:
- Primary: Executive Team + Legal
- Secondary: All stakeholders
- Response Time: 15 minutes
```

### **Communication Templates**

#### **Service Status Update**
```
🚨 Service Status Update - [TIMESTAMP]

Issue: [Brief description of the problem]
Impact: [Who/what is affected]
Status: [Investigating/Identified/Fixing/Resolved]
ETA: [Estimated resolution time]
Next Update: [When the next update will be provided]

Workaround: [If available, provide temporary solution]
```

#### **Post-Incident Report Template**
```markdown
# Incident Report - [DATE]

## Summary
Brief description of what happened.

## Timeline
- HH:MM - Issue first detected
- HH:MM - Investigation began
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service fully restored

## Root Cause
Detailed explanation of what caused the incident.

## Impact
- Users affected: X
- Duration: X minutes
- Services affected: [List]

## Resolution
Steps taken to resolve the issue.

## Action Items
- [ ] Action 1 - Owner - Due date
- [ ] Action 2 - Owner - Due date

## Lessons Learned
What we learned and how we'll prevent this in the future.
```

---

## 🎯 **Quick Reference**

### **Emergency Commands**
```bash
# Check all services
curl -s https://your-frontend.vercel.app/ && echo "Frontend OK"
curl -s https://your-backend.onrender.com/health && echo "Backend OK"
curl -s https://your-ai-service.onrender.com/health && echo "AI Service OK"

# Rollback deployments
vercel rollback  # Frontend
# Use Render dashboard for backend rollback

# Clear rate limits (emergency)
# Restart backend service via Render dashboard

# Emergency maintenance mode
# Update frontend environment variable: VITE_MAINTENANCE_MODE=true
```

### **Key URLs**
- **Frontend**: https://your-frontend.vercel.app/
- **Backend API**: https://your-backend.onrender.com/
- **AI Service**: https://your-ai-service.onrender.com/
- **Database**: Supabase Dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com/

Your ShelfQuest application now has comprehensive troubleshooting and maintenance procedures! 🚀

---

*For development issues, see [Developer Onboarding](./DEVELOPER_ONBOARDING.md)*
*For security incidents, see [Security Documentation](../server2/SECURITY_DOCUMENTATION.md)*