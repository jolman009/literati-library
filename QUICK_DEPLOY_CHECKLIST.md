# 🚀 Quick Deploy Checklist

## Android Play Store - Fast Track (5 Days)

### ☐ Day 1: Generate Keystore (15 min)
```cmd
cd android
.\generate-keystore.bat
```
**SAVE THE PASSWORDS!** You'll never be able to update your app without them.

---

### ☐ Day 1: Deploy Digital Asset Links (5 min)
```cmd
copy android\.well-known\assetlinks.json client2\public\.well-known\assetlinks.json
git add .
git commit -m "Add Digital Asset Links for Android"
git push
```

Wait 2 minutes, then verify:
```cmd
curl https://literati.pro/.well-known/assetlinks.json
```

---

### ☐ Day 1: Build & Test (30 min)
```cmd
cd android
.\gradlew assembleRelease
adb install app\build\outputs\apk\release\app-release.apk
```

Test on phone:
- [ ] App opens
- [ ] No browser UI visible
- [ ] URLs open in app
- [ ] Share PDF works

---

### ☐ Day 2: Create Play Console Account (10 min)
- Visit: https://play.google.com/console/signup
- Pay $25 one-time fee
- Verify email

---

### ☐ Day 3: Prepare Assets (2 hours)
- [ ] Take 2-4 phone screenshots (16:9 or 9:16, max 8)
- [ ] Create feature graphic (1024×500 PNG)
- [ ] Export app icon (512×512 PNG) - use `client2/public/logo512.png`
- [ ] Write privacy policy (host on your website)

---

### ☐ Day 4: Build AAB & Create Listing (1 hour)
```cmd
cd android
.\gradlew bundleRelease
```

Upload to Play Console:
- Go to Production → Create Release
- Upload `app\build\outputs\bundle\release\app-release.aab`
- Complete store listing (copy from `android/play-store-listing.md`)
- Add screenshots and graphics
- Complete content rating
- Add privacy policy URL

---

### ☐ Day 5: Submit for Review
- Review all sections
- Click "Submit for Review"
- Wait 1-7 days
- **You're live!** 🎉

---

## Windows Store - Fast Track (1 Week)

### ☐ Step 1: Generate MSIX (30 min)
1. Visit: https://www.pwabuilder.com/
2. Enter: `https://literati.pro`
3. Download Windows package
4. Test installation on Windows 10/11

### ☐ Step 2: Microsoft Partner Account (10 min)
- Visit: https://partner.microsoft.com/dashboard
- Register ($19/year or free in some regions)

### ☐ Step 3: Submit
- Upload MSIX
- Complete store listing
- Submit for certification
- Wait 1-3 days
- **You're live!** 🎉

---

## iOS App Store - Long Track (8-12 Weeks)

### ☐ Week 1-2: Setup Capacitor
```cmd
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
```

### ☐ Week 3-4: Implement Native Features
- [ ] Push notifications (APNs)
- [ ] Sign in with Apple
- [ ] Offline file storage
- [ ] System search integration

### ☐ Week 5-6: Testing
- [ ] Test on iPhone/iPad
- [ ] Fix layout issues
- [ ] Optimize performance

### ☐ Week 7: Apple Developer Account
- Visit: https://developer.apple.com/programs/
- Pay $99/year
- Set up certificates

### ☐ Week 8: Build & Submit
- Generate IPA
- Upload via App Store Connect
- Complete metadata
- Submit for review

### ☐ Week 9-10: Review Process
- Wait 1-7 days
- Respond to feedback if rejected
- Resubmit if needed

### ☐ Week 11-12: Launch
- **You're live!** 🎉

---

## Current Status: Android Ready (85% Complete)

### ✅ What's Done:
- Production PWA live at literati.pro
- Backend API operational
- CI/CD pipeline working
- Security hardened (Sentry, rate limiting, helmet)
- Android TWA configured
- App icons installed
- Manifest updated with production URLs
- Digital Asset Links template created

### 🔴 What You Need To Do (Critical Path):
1. **Generate keystore** (15 min - BLOCKING)
2. **Deploy Digital Asset Links** (5 min - BLOCKING)
3. **Test release build** (30 min - RECOMMENDED)
4. Create Play Console account ($25 - REQUIRED)
5. Prepare store assets (screenshots, etc.)
6. Submit to Play Store

### Estimated Time to Play Store: **3-5 days**

---

## 💡 Pro Tips

### Before You Generate the Keystore:
- [ ] Have a password manager ready
- [ ] Use a strong password (16+ characters)
- [ ] Know your organization details (city, state, country)

### Before You Submit:
- [ ] Test on multiple Android devices if possible
- [ ] Verify all features work (book upload, reading, notes)
- [ ] Check offline mode works
- [ ] Ensure no crashes occur

### After Submission:
- [ ] Monitor Play Console for review feedback
- [ ] Set up crash reporting (already have Sentry configured!)
- [ ] Respond to user reviews promptly

---

## 🆘 Need Help?

1. Check [ANDROID_SETUP_COMPLETE.md](ANDROID_SETUP_COMPLETE.md) for detailed instructions
2. Review [android/ANDROID_DEPLOYMENT_GUIDE.md](android/ANDROID_DEPLOYMENT_GUIDE.md) for troubleshooting
3. Use Google's Digital Asset Links tester if TWA doesn't work
4. Verify assetlinks.json is accessible at the correct URL

---

## 🎯 Your Next Command

```cmd
cd android
.\generate-keystore.bat
```

**That's it!** Run this command now, follow the prompts, and you're on your way to the Play Store! 🚀
