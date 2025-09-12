# 🚀 LITERATI PRODUCTION DEPLOYMENT GUIDE

This guide covers deploying Literati to production with Vercel (client), Render (server + AI), and Supabase (database).

## 📋 Prerequisites

- [x] Vercel account with project linked
- [x] Render.com account  
- [x] Supabase project with production database
- [x] Domain name (optional but recommended)

## 🛠 Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Render.com     │    │   Supabase      │
│   (Client)      │───▶│   (Server + AI)  │───▶│   (Database)    │
│                 │    │                  │    │                 │
│ React + Vite    │    │ Express + FastAPI│    │ PostgreSQL      │
│ literati.pro    │    │ Node.js + Python │    │ + Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Step 1: Environment Variables Setup

### Vercel Environment Variables
In your Vercel dashboard, add these variables:

```bash
# Production API URL
VITE_API_BASE_URL=https://literati-server.onrender.com

# App Configuration  
VITE_APP_NAME=Literati

# Push Notifications (optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### Render Environment Variables
In your Render dashboard, set up an **Environment Variable Group** called `production-secrets`:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# AI Service
GOOGLE_API_KEY=your_gemini_api_key_here
```

Additional environment variables for each service:

**Express Server:**
```bash
NODE_ENV=production
PORT=10000
JWT_SECRET=auto-generated-by-render
ALLOWED_ORIGINS=https://literati.pro,https://www.literati.pro
MAX_FILE_SIZE=50MB
UPLOAD_TIMEOUT=300000
```

**AI Service:**
```bash
ENVIRONMENT=production
```

## 🚀 Step 2: Deploy Services

### Deploy Client to Vercel
```bash
cd client2
vercel --prod
```

### Deploy Server & AI to Render
If using the `render.yaml` configuration:
1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` file
3. Services will deploy automatically on git push

### Manual Render Deployment (alternative)
1. **Create Express Server:**
   - Service Type: Web Service
   - Build Command: `pnpm install`
   - Start Command: `pnpm start`
   - Root Directory: `server2`

2. **Create AI Service:**
   - Service Type: Web Service  
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port 10000`
   - Root Directory: `ai-service`

## 🌐 Step 3: Domain Configuration (Optional)

### Custom Domain Setup
1. **Purchase domain** (e.g., literati.pro)
2. **Vercel:** Add custom domain in project settings
3. **DNS Configuration:**
   ```
   A     literati.pro          ▶ Vercel IP
   CNAME www.literati.pro      ▶ literati.pro
   ```

### SSL Certificate
- Vercel automatically provides SSL certificates
- Render provides SSL for custom domains

## 🔍 Step 4: Health Checks & Monitoring

### Service Health Endpoints
- **Client:** https://literati.pro/
- **Server:** https://literati-server.onrender.com/health
- **AI Service:** https://literati-ai.onrender.com/health

### Monitoring Setup
Consider adding:
- **Uptime monitoring** (UptimeRobot, Pingdom)
- **Error tracking** (Sentry)
- **Performance monitoring** (New Relic, DataDog)

## 🔒 Step 5: Security Checklist

- [x] Environment variables secure (not in code)
- [x] CORS properly configured
- [x] Security headers enabled (CSP, XSS protection)
- [x] JWT secrets auto-generated
- [x] HTTPS everywhere
- [x] Supabase Row Level Security (RLS) enabled

## 📊 Step 6: Performance Optimization

### Vercel Configuration
- [x] Build optimization enabled
- [x] Chunk splitting configured
- [x] Console logs removed in production
- [x] Service worker caching rules
- [x] CDN asset optimization

### Render Configuration  
- [x] Health check endpoints
- [x] Auto-deploy on git push
- [x] Environment variable management
- [x] Build optimization (pnpm for faster installs)

## 🧪 Step 7: Testing Production Deployment

### Pre-Launch Checklist
- [ ] **Authentication flow** works end-to-end
- [ ] **Book upload** and file storage functional
- [ ] **Reading sessions** sync across pages
- [ ] **Notes and AI summarization** working
- [ ] **Gamification** tracking properly
- [ ] **PWA features** installable and offline-capable
- [ ] **Cross-device sync** via database
- [ ] **Performance** meets targets (Core Web Vitals)

### Load Testing
Consider testing with tools like:
- Artillery.io
- k6
- Apache JMeter

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `ALLOWED_ORIGINS` in server environment variables
   - Ensure client URL matches exactly

2. **Database Connection**
   - Verify Supabase service role key is correct
   - Check RLS policies allow server access

3. **File Upload Issues**  
   - Check Supabase storage bucket permissions
   - Verify MAX_FILE_SIZE setting

4. **AI Service Errors**
   - Confirm Google API key is valid
   - Check Gemini API quotas and billing

### Debugging Production
- Check Render service logs
- Use Vercel function logs
- Monitor Supabase dashboard for database errors

## 📈 Post-Launch

### Analytics Setup
- Google Analytics 4
- Supabase Dashboard analytics
- Custom event tracking for reading sessions

### User Feedback
- Error reporting integration
- User feedback forms
- Feature usage analytics

---

## 🎯 Current Status

✅ **Development:** Complete and tested
✅ **Testing Infrastructure:** Comprehensive test framework
✅ **Build Configuration:** Optimized for production
✅ **Deployment Config:** Ready for production
⬜ **Domain Setup:** Pending custom domain
⬜ **Monitoring:** Pending setup

The application is **production-ready** and can be deployed immediately!