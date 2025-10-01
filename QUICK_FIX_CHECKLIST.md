# 🚨 URGENT FIX CHECKLIST - Literati Deployment

## ⚡ Quick Fix (Choose ONE method)

### METHOD A: Vercel Dashboard (5 minutes - EASIEST)

1. [ ] Go to https://vercel.com/dashboard
2. [ ] Click on your Literati project
3. [ ] Go to **Settings** → **General**
4. [ ] Update these fields:
   ```
   Framework Preset: Vite
   Build Command: cd client2 && pnpm install --frozen-lockfile && pnpm run build:production
   Output Directory: client2/dist
   Install Command: npm install -g pnpm@8 && cd client2 && pnpm install --frozen-lockfile
   ```
5. [ ] Click **Save**
6. [ ] Go to **Environment Variables** tab
7. [ ] Add these variables (if missing):
   ```
   VITE_API_BASE_URL=https://library-server-m6gr.onrender.com
   VITE_AI_SERVICE_URL=https://literati-ai-production.onrender.com
   VITE_SUPABASE_URL=<your-supabase-project-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_ENABLE_SERVICE_WORKER=true
   VITE_APP_ENV=production
   ```
8. [ ] Go to **Deployments** tab
9. [ ] Click **...** on latest deployment → **Redeploy**
10. [ ] **IMPORTANT**: Uncheck "Use existing Build Cache"
11. [ ] Click **Redeploy**
12. [ ] Wait 2-3 minutes
13. [ ] Visit literati.pro - Should work! 🎉

---

### METHOD B: Git Update (10 minutes)

```bash
# 1. Update vercel.json in your project root
# Copy the new vercel.json I created to your project

# 2. Commit changes
git add vercel.json
git commit -m "fix: update vercel config for pnpm and correct build"
git push origin main

# 3. Wait for auto-deployment (2-3 min)
# Check: https://vercel.com/[your-name]/[project]/deployments

# 4. If auto-deploy didn't trigger:
vercel --prod

# 5. Done! Check literati.pro
```

---

## 🔍 After Deployment - Verify

1. [ ] Visit https://literati.pro
2. [ ] See login/register page? ✅
3. [ ] Open browser console (F12)
4. [ ] No red errors? ✅
5. [ ] Try to register an account ✅

---

## ❌ If Still Not Working

### Check Build Logs:
1. Go to Vercel → Deployments
2. Click latest deployment
3. Look for errors (red text)
4. **Copy error message** and share with me

### Check Browser Console:
1. Press F12 on literati.pro
2. Go to Console tab
3. Any errors? **Screenshot and share**

### Quick Diagnostics:
```bash
# Test if backend is up
curl https://library-server-m6gr.onrender.com

# Should return: "Literati API is running" or similar
```

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Blank white screen | Check browser console for errors |
| "Module not found" error | Rebuild with correct pnpm command |
| 404 on assets | Wrong output directory in config |
| Environment vars undefined | Add ALL VITE_* vars in Vercel dashboard |
| Domain not working | Check DNS settings, wait for propagation |

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ literati.pro loads a page (not blank)
- ✅ You see the Literati logo/branding  
- ✅ Login/Register buttons are visible
- ✅ No errors in browser console (F12)
- ✅ Page loads in < 3 seconds

---

## 🎓 Learning Moment

**What was wrong?**
- Your `vercel.json` used `npm` but project uses `pnpm`
- This caused dependencies to not install correctly
- Build failed silently, creating an empty/broken deployment

**Key lesson:**
Always match your build config with your actual tools!

---

## 📸 Need Help?

Share these with me:
1. Screenshot of Vercel build logs (if failing)
2. Screenshot of browser console on literati.pro
3. Screenshot of your Vercel environment variables

---

**Time to fix**: 5-10 minutes
**Difficulty**: Easy (just copy/paste settings!)

Let's get your site live! 🚀
