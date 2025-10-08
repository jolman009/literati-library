# Android Production Setup - Final Steps

## ✅ Completed Tasks

1. **PWA Deployment** - Your app is live at:
   - Production: `https://literati.pro`
   - Fallback: `https://my-library-app-2-joel-guzmans-projects-f8aa100e.vercel.app`

2. **Android Manifest Updated** - Now points to your production domain
   - Updated `AndroidManifest.xml` with `literati.pro`
   - Updated `build.gradle` TWA configuration
   - Configured deep linking for multiple domains

3. **App Icons Installed** - 10 icons copied to mipmap folders
   - All density folders populated (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
   - Both regular and round launcher icons added

4. **Digital Asset Links Template** - Created at:
   - `client2/public/.well-known/assetlinks.json`

---

## 🔑 NEXT STEP: Generate Your Keystore (REQUIRED)

You need to run this command **manually** because it requires interactive input for passwords:

```cmd
cd android
.\generate-keystore.bat
```

### What the Script Will Ask:

1. **Organization Name** (e.g., "Literati")
2. **Organizational Unit** (e.g., "Development")
3. **City** (e.g., "New York")
4. **State/Province** (e.g., "NY")
5. **Country Code** (2 letters, e.g., "US")
6. **Keystore Password** (minimum 6 characters - **SAVE THIS!**)
7. **Key Password** (can be same as keystore password - **SAVE THIS!**)

### What the Script Will Generate:

1. **`literati-release.keystore`** - Your signing key (NEVER commit to Git!)
2. **`gradle.properties`** - Build configuration with your passwords
3. **`.well-known/assetlinks.json`** - Updated with your SHA256 fingerprint
4. **`DEPLOYMENT_INSTRUCTIONS.md`** - Detailed next steps

### 🚨 IMPORTANT SECURITY NOTES:

- **NEVER commit `gradle.properties` or `*.keystore` files to Git**
- **SAVE your passwords in a secure password manager**
- **Backup the keystore file** to a secure, encrypted location
- If you lose the keystore, you cannot update your app on Play Store!

---

## 📤 After Generating Keystore

### 1. Update Digital Asset Links

After running the keystore script, it will generate `android/.well-known/assetlinks.json` with your SHA256 fingerprint.

**Copy this file to your PWA:**

```cmd
copy android\.well-known\assetlinks.json client2\public\.well-known\assetlinks.json
```

Then commit and push to deploy it:

```cmd
git add client2/public/.well-known/assetlinks.json
git commit -m "Add Digital Asset Links for Android TWA"
git push
```

Your GitHub Actions will automatically deploy it to `https://literati.pro/.well-known/assetlinks.json`

### 2. Verify Digital Asset Links

After deployment, verify it's accessible:

```cmd
curl https://literati.pro/.well-known/assetlinks.json
```

Then test with Google's verification tool:
https://developers.google.com/digital-asset-links/tools/generator

### 3. Build Your Android App

```cmd
cd android

# Test debug build first
.\gradlew assembleDebug

# Build release APK (signed)
.\gradlew assembleRelease

# Build AAB for Play Store (recommended)
.\gradlew bundleRelease
```

The signed outputs will be in:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. Test on Device

Install the release APK on a physical Android device:

```cmd
adb install android/app/build/outputs/apk/release/app-release.apk
```

Test that:
- App opens to `https://literati.pro`
- No browser UI is visible
- URLs open directly in the app
- File sharing works (share a PDF to the app)

### 5. Submit to Google Play Store

1. **Create Google Play Developer Account** ($25 one-time fee)
   - Visit: https://play.google.com/console/signup

2. **Create New App**
   - App name: "Literati - Your Digital Bookshelf"
   - Default language: English (United States)
   - App/Game: App
   - Free/Paid: Free

3. **Upload AAB**
   - Go to Production → Releases
   - Create new release
   - Upload `app-release.aab`

4. **Complete Store Listing** (use content from `android/play-store-listing.md`)
   - Short description
   - Full description
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (minimum 2 phone screenshots)

5. **Content Rating**
   - Complete the questionnaire
   - Literati is educational content with no inappropriate material

6. **Privacy Policy**
   - Add URL to your privacy policy (you'll need to host one)

7. **Target Audience & Content**
   - Select "13+" or appropriate age rating

8. **Submit for Review**
   - Review can take 1-7 days

---

## 📊 Production Readiness Status

### ✅ Complete (100%)
- [x] PWA deployed and accessible
- [x] Service worker with offline support
- [x] Production backend API live
- [x] CI/CD pipeline operational
- [x] Security middleware (Sentry, rate limiting, helmet)
- [x] Android TWA project configured
- [x] App manifest updated with production URLs
- [x] App icons installed
- [x] Digital Asset Links template created

### ⏳ In Progress (You Need To Do)
- [ ] Generate production keystore **(MANUAL STEP REQUIRED)**
- [ ] Deploy Digital Asset Links to production
- [ ] Test release build on device
- [ ] Create Google Play Developer account
- [ ] Prepare store listing assets (screenshots, feature graphic)
- [ ] Write and host privacy policy
- [ ] Submit AAB to Google Play Store

### 🔮 Future (Post-Launch)
- [ ] Windows MSIX package (use PWABuilder.com)
- [ ] iOS Capacitor project (6-8 weeks development)
- [ ] Apple App Store submission

---

## 🎯 Timeline to Google Play Store

- **Today**: Generate keystore (15 minutes)
- **Today**: Deploy Digital Asset Links (5 minutes)
- **Today**: Build and test app (30 minutes)
- **Tomorrow**: Create Play Console account ($25)
- **This Week**: Prepare store listing assets (screenshots, graphics)
- **This Week**: Write privacy policy
- **Next Week**: Submit to Play Store
- **1-7 days later**: App goes live!

---

## 🆘 Troubleshooting

### Keystore Script Fails
- Ensure Java JDK is installed: `java -version`
- keytool should be in PATH: `keytool -help`
- Run from the `android` folder

### Build Fails
- Check `gradle.properties` exists in `android/` folder
- Verify keystore password is correct
- Ensure keystore file path is correct

### TWA Doesn't Open App (Opens Browser Instead)
- Verify assetlinks.json is accessible: `curl https://literati.pro/.well-known/assetlinks.json`
- Check SHA256 fingerprint matches exactly
- Test with Google's verification tool
- Wait 24-48 hours for Google to cache the verification

### Digital Asset Links Verification Fails
- File must be EXACTLY at `https://literati.pro/.well-known/assetlinks.json`
- Must return `Content-Type: application/json`
- Must be accessible without authentication
- SHA256 must match keytool output

---

## 📚 Resources

- [Android Deployment Guide](android/ANDROID_DEPLOYMENT_GUIDE.md) - Comprehensive 498-line guide
- [Play Store Listing Content](android/play-store-listing.md) - Ready-to-use descriptions
- [Target SDK Compliance](android/target-sdk-compliance.md) - API 34 requirements
- [Google's Digital Asset Links Tool](https://developers.google.com/digital-asset-links/tools/generator)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

---

## 🎉 You're Almost There!

Your project is **85% production-ready**. The remaining 15% is operational tasks (keystore generation, store listing) rather than development work.

**Next immediate action**: Run `cd android && .\generate-keystore.bat`

Good luck with your Play Store launch! 🚀
