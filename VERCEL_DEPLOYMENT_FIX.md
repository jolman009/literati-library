# Literati Vercel Deployment Fix Guide

## 🔍 Issues Identified

Your site isn't rendering because of **configuration mismatches** in `vercel.json`:

### 1. **Package Manager Mismatch** ❌
- **Problem**: Using `npm` but project uses `pnpm`
- **Impact**: Dependencies not installed correctly, build fails
- **Old**: `"installCommand": "cd client2 && npm install --legacy-peer-deps"`
- **Fixed**: `"installCommand": "npm install -g pnpm@8 && cd client2 && pnpm install --frozen-lockfile"`

### 2. **Build Command Issues** ❌
- **Problem**: Inconsistent build commands
- **Old**: `"buildCommand": "cd client2 && npm run build:production"`
- **Fixed**: `"buildCommand": "cd client2 && pnpm install --frozen-lockfile && pnpm run build:production"`

### 3. **Routing Configuration** ⚠️
- **Problem**: Complex rewrites that might not catch all routes
- **Fixed**: Simplified catch-all routing

---

## 🚀 Quick Fix Steps

### Option 1: Via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Update Settings → General**
   - **Framework Preset**: `Vite`
   - **Root Directory**: Leave empty (or `/`)
   - **Build Command**: 
     ```bash
     cd client2 && pnpm install --frozen-lockfile && pnpm run build:production
     ```
   - **Output Directory**: `client2/dist`
   - **Install Command**:
     ```bash
     npm install -g pnpm@8 && cd client2 && pnpm install --frozen-lockfile
     ```

3. **Add Environment Variables**
   Go to Settings → Environment Variables and add:
   
   **Production Environment:**
   ```
   VITE_API_BASE_URL=https://library-server-m6gr.onrender.com
   VITE_AI_SERVICE_URL=https://literati-ai-production.onrender.com
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_ENABLE_SERVICE_WORKER=true
   VITE_APP_ENV=production
   VITE_APP_NAME=Literati
   ```

4. **Redeploy**
   - Go to Deployments tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - ✅ Check "Use existing Build Cache" = OFF

---

### Option 2: Via Git (Recommended for Self-Taught Coders)

1. **Replace vercel.json**
   ```bash
   # In your project root
   cp /home/claude/vercel.json ./vercel.json
   ```

2. **Commit and Push**
   ```bash
   git add vercel.json
   git commit -m "Fix: Update Vercel config to use pnpm"
   git push origin main
   ```

3. **Vercel Auto-Deploys** 
   - Vercel will detect the push and auto-deploy
   - Monitor at: https://vercel.com/[your-username]/[your-project]/deployments

---

## 🔧 Additional Checks

### 1. Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables, ensure ALL these are set:

```bash
✅ VITE_API_BASE_URL
✅ VITE_AI_SERVICE_URL  
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_ENABLE_SERVICE_WORKER
✅ VITE_APP_ENV
```

### 2. Check Build Logs

If deployment fails:
1. Go to Deployments tab
2. Click on the failed deployment
3. Look for errors in the build log
4. Common errors:
   - `ENOENT: no such file or directory` → Wrong paths
   - `Module not found` → Missing dependencies
   - `Environment variable not set` → Add missing vars

### 3. Test Locally First

```bash
# Navigate to client2 directory
cd client2

# Install dependencies
pnpm install

# Build production
pnpm run build:production

# Test the build locally
pnpm preview
# Visit http://localhost:5174
```

If local build works but Vercel fails, it's a configuration issue.

---

## 🌐 Domain Configuration (literati.pro)

### If Domain Isn't Working:

1. **Check DNS Settings**
   - Go to your domain provider (GoDaddy, Namecheap, etc.)
   - Ensure DNS points to Vercel:
     ```
     Type: CNAME
     Name: @ (or www)
     Value: cname.vercel-dns.com
     ```

2. **Verify in Vercel**
   - Settings → Domains
   - literati.pro should show ✅ "Active"
   - If showing "Invalid Configuration", check DNS propagation

3. **DNS Propagation**
   - DNS changes can take 24-48 hours
   - Check status: https://dnschecker.org
   - Enter: literati.pro

### SSL Certificate Issues:

If you see SSL/HTTPS errors:
1. Vercel auto-provisions SSL (Let's Encrypt)
2. Wait 5-10 minutes after domain configuration
3. Force refresh: Shift + Ctrl + R (Windows) or Shift + Cmd + R (Mac)

---

## 🐛 Common Errors & Solutions

### Error: "No Output Directory Found"
**Solution**: Check `outputDirectory` in vercel.json points to `client2/dist`

### Error: "Build Failed: Command Not Found"
**Solution**: Ensure pnpm is installed globally in build command

### Error: "Module Not Found: Can't resolve '@/...'"
**Solution**: Check `vite.config.js` has correct path aliases

### Error: "Blank White Screen"
**Solution**: 
1. Check browser console (F12)
2. Look for errors like:
   - `Failed to load module` → Build issue
   - `CORS error` → Backend CORS config
   - `404 on assets` → Wrong base path

### Error: "Environment Variables Not Defined"
**Solution**:
1. Add all VITE_* vars in Vercel dashboard
2. Redeploy (don't use cache)

---

## ✅ Verification Checklist

After deploying, check:

- [ ] Site loads at literati.pro (no blank screen)
- [ ] No console errors (F12 → Console tab)
- [ ] Can register/login
- [ ] Can upload books
- [ ] Backend API calls work (Network tab shows 200 responses)
- [ ] Service worker registers (if enabled)
- [ ] Site works on mobile

---

## 📞 Still Having Issues?

### Check These:

1. **Vercel Build Logs**
   - Deployments → Click deployment → View logs
   - Look for red error messages

2. **Browser Console**
   - F12 → Console tab
   - Any errors? (Red text)

3. **Network Tab**
   - F12 → Network tab
   - Are API calls returning 404/500?
   - Check if API_BASE_URL is correct

4. **Backend Status**
   - Visit: https://library-server-m6gr.onrender.com
   - Should return: "Literati API is running"
   - If not, backend is down

### Get Help:
- Vercel Discord: https://vercel.com/discord
- Share your deployment URL
- Share build logs (copy/paste errors)

---

## 🎯 Expected Behavior After Fix

✅ **literati.pro loads instantly**
✅ **Shows login/register page**
✅ **No console errors**
✅ **Fast page loads (<2s)**
✅ **Works on mobile**

---

## 🚀 Next Steps After Deployment

1. **Set up monitoring** (optional)
   - Add Vercel Analytics
   - Set up error tracking (Sentry)

2. **Optimize performance**
   - Enable caching
   - Compress images
   - Use CDN for assets

3. **Test thoroughly**
   - Test all features
   - Try on different devices
   - Share with beta users

---

## 📝 Notes for Self-Taught Coders

**You're doing great!** Deployment issues are normal. Here's what's happening:

- **Local dev** uses `vite dev` (dev server)
- **Production** uses `vite build` (static files)
- Settings must match between:
  - Your `vite.config.js`
  - Your `vercel.json`
  - Vercel dashboard settings

**Learning tip**: Always test production builds locally first:
```bash
pnpm run build:production
pnpm preview
```
This catches issues before deploying!

---

Good luck! Your site will be live soon 🎉
