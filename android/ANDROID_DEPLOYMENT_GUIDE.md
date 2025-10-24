# ShelfQuest Android Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the ShelfQuest PWA as an Android app using Trusted Web Activity (TWA) technology. The deployment targets **Android 14 (API 34)** and includes full Google Play Store compliance.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Setup](#environment-setup)
4. [Configuration](#configuration)
5. [Digital Asset Links](#digital-asset-links)
6. [Building the App](#building-the-app)
7. [Testing](#testing)
8. [Play Store Deployment](#play-store-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

---

## Prerequisites

### Development Environment

- **Java Development Kit (JDK)**: Version 17 or higher
- **Android Studio**: Latest stable version (recommended)
- **Android SDK**: API Level 34 (Android 14)
- **Android Build Tools**: Version 34.0.0
- **Gradle**: Version 8.0 or higher

### PWA Requirements

- **HTTPS**: Your PWA must be served over HTTPS
- **Service Worker**: Must be properly configured
- **Web App Manifest**: Must include required fields
- **PWA Score**: Should achieve a high Lighthouse PWA score

### Account Requirements

- **Google Play Console Account**: For app publishing
- **Google Developer Account**: $25 one-time registration fee

---

## Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml          # App manifest with TWA configuration
│   │   └── res/
│   │       ├── values/
│   │       │   ├── colors.xml           # Material Design 3 colors
│   │       │   ├── strings.xml          # App strings and store content
│   │       │   └── styles.xml           # Material Design 3 themes
│   │       └── xml/
│   │           ├── share_target.xml     # File sharing configuration
│   │           ├── file_paths.xml       # File provider paths
│   │           ├── backup_rules.xml     # Backup configuration
│   │           └── data_extraction_rules.xml
│   ├── build.gradle                     # App-level build configuration
│   └── proguard-rules.pro              # Code obfuscation rules
├── build.gradle                        # Project-level build configuration
├── gradle.properties.example           # Configuration template
├── generate-keystore.sh                # Keystore generation script (Unix)
├── generate-keystore.bat               # Keystore generation script (Windows)
└── docs/
    ├── ANDROID_DEPLOYMENT_GUIDE.md     # This file
    ├── target-sdk-compliance.md        # Target SDK 34 compliance
    └── play-store-listing.md           # Play Store listing content
```

---

## Environment Setup

### 1. Install Android Studio

1. Download from [developer.android.com](https://developer.android.com/studio)
2. Install with default settings
3. Open Android Studio and complete the setup wizard
4. Install Android SDK Platform 34 via SDK Manager

### 2. Configure Environment Variables

Add to your system PATH:
```bash
# Android SDK
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools

# Java (adjust path as needed)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### 3. Verify Installation

```bash
# Check Java version
java -version

# Check Android SDK
adb version

# Check Gradle
gradle --version
```

---

## Configuration

### 1. Generate Keystore

Run the keystore generation script:

**Unix/Linux/macOS:**
```bash
cd android
chmod +x generate-keystore.sh
./generate-keystore.sh
```

**Windows:**
```cmd
cd android
generate-keystore.bat
```

This script will:
- Generate a production keystore
- Extract SHA256 fingerprint
- Create `gradle.properties` with configuration
- Generate Digital Asset Links JSON

### 2. Configure gradle.properties

The keystore script creates `gradle.properties` automatically. Verify these key settings:

```properties
# PWA Configuration
PWA_URL=https://shelfquest.org
APP_PACKAGE_NAME=org.shelfquest.app

# Keystore Configuration
KEYSTORE_FILE=../shelfquest-release.keystore
KEYSTORE_PASSWORD=YOUR_SECURE_PASSWORD
KEY_ALIAS=shelfquest_key
KEY_PASSWORD=YOUR_KEY_PASSWORD

# SHA256 for Digital Asset Links
RELEASE_KEYSTORE_SHA256=YOUR_SHA256_FINGERPRINT
```

### 3. Customize App Details

Edit `app/src/main/res/values/strings.xml` to customize:
- App name and description
- Store listing content
- Feature descriptions

---

## Digital Asset Links

Digital Asset Links enable your app to open your PWA URLs directly without showing browser Chrome.

### 1. Upload assetlinks.json

Upload the generated `.well-known/assetlinks.json` to your web server:

**Required URL:**
```
https://shelfquest.org/.well-known/assetlinks.json
```

**File Content Example:**
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "org.shelfquest.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

### 2. Verify Digital Asset Links

Use Google's verification tool:
1. Go to [Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)
2. Enter your domain and package name
3. Verify the association

**Common Issues:**
- File not accessible (check HTTPS and CORS)
- Incorrect SHA256 fingerprint
- Wrong package name
- Missing or malformed JSON

---

## Building the App

### 1. Debug Build

For development and testing:

```bash
cd android
./gradlew assembleDebug
```

Output: `app/build/outputs/apk/debug/app-debug.apk`

### 2. Release Build (APK)

For direct distribution:

```bash
./gradlew assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

### 3. App Bundle (AAB) - Recommended for Play Store

For Google Play Store submission:

```bash
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

### 4. Build Variants

The project includes three build variants:

- **debug**: Development with localhost PWA URL
- **staging**: Testing with staging PWA URL
- **release**: Production with live PWA URL

---

## Testing

### 1. Local Testing

1. Install debug APK on device:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

2. Test TWA functionality:
   - App opens PWA content
   - No browser UI visible
   - Deep links work correctly
   - Share functionality works

### 2. Digital Asset Links Testing

1. Install release APK
2. Try opening your PWA URL in Chrome
3. Should show "Open in App" prompt
4. App should handle URLs directly

### 3. Play Store Testing

1. Upload AAB to Play Console
2. Use Internal Testing track
3. Test on multiple devices/Android versions
4. Verify all features work correctly

---

## Play Store Deployment

### 1. Prepare Store Listing

Use the content in `play-store-listing.md`:

- **App Title**: ShelfQuest - Your Digital Library
- **Short Description**: Personal digital library with AI-powered insights
- **Full Description**: Complete feature overview
- **Keywords**: Optimized for App Store Optimization (ASO)

### 2. Required Assets

Create and upload:

- **App Icon**: 512×512 PNG (high-quality)
- **Feature Graphic**: 1024×500 PNG
- **Screenshots**:
  - Phone: At least 2, up to 8 (16:9 or 9:16 ratio)
  - Tablet: At least 1, up to 8 (16:10 or 10:16 ratio)
- **TV Banner**: 1280×720 PNG (if supporting Android TV)

### 3. App Content Rating

Complete the content rating questionnaire:
- Educational content
- No inappropriate content
- Age rating will be assigned automatically

### 4. Target SDK Declaration

Declare Target SDK 34 compliance:
- Privacy policy URL required
- Data safety form completion
- Permissions justification

### 5. Release Process

1. **Upload AAB**: Use the generated app bundle
2. **Complete Store Listing**: All required fields
3. **Set Pricing**: Free or paid
4. **Choose Countries**: Select target markets
5. **Review and Publish**: Submit for review

### 6. Post-Launch

- Monitor crash reports
- Respond to user reviews
- Update regularly
- Monitor performance metrics

---

## Troubleshooting

### Common Build Issues

**Error: "Failed to find target with hash string 'android-34'"**
```bash
# Install Android SDK Platform 34
sdkmanager "platforms;android-34"
```

**Error: "Execution failed for task ':app:validateSigningRelease'"**
- Check keystore file path in `gradle.properties`
- Verify keystore password is correct
- Ensure key alias exists in keystore

**Error: "Digital Asset Links verification failed"**
- Verify assetlinks.json is accessible via HTTPS
- Check SHA256 fingerprint matches exactly
- Ensure package name is correct
- Test with Google's verification tool

### TWA Not Working

1. **URLs open in browser instead of app:**
   - Verify Digital Asset Links setup
   - Check Chrome flags: `chrome://flags/#enable-twa`
   - Clear Chrome data and try again

2. **App shows browser UI:**
   - Verify PWA requirements (HTTPS, Service Worker, Manifest)
   - Check PWA score with Lighthouse
   - Ensure manifest has `display: "standalone"`

3. **Deep links not working:**
   - Verify intent filters in manifest
   - Test with `adb shell am start` commands
   - Check URL patterns match exactly

### Performance Issues

1. **Slow app startup:**
   - Optimize PWA loading time
   - Implement app shell architecture
   - Use service worker caching

2. **Memory issues:**
   - Enable ProGuard optimizations
   - Remove unused dependencies
   - Monitor with Android Profiler

---

## Security Considerations

### 1. Keystore Security

- **Never commit keystore to version control**
- Store keystore in secure, encrypted location
- Use strong passwords (16+ characters)
- Consider using hardware security modules for production

### 2. Network Security

The app includes network security configuration:
- Enforces HTTPS for all network communication
- Pins certificates for production
- Prevents cleartext HTTP traffic

### 3. App Signing

- Use Google Play App Signing (recommended)
- Keep upload key separate from app signing key
- Enable Play Protect verification

### 4. Data Protection

- All sensitive data encrypted
- Comply with GDPR and privacy regulations
- Implement proper backup/restore exclusions

### 5. PWA Security

- Ensure PWA follows security best practices
- Implement Content Security Policy (CSP)
- Regular security audits
- Keep dependencies updated

---

## Performance Optimization

### 1. Build Optimization

- Enable R8 code shrinking
- Use ProGuard for additional optimizations
- Enable resource shrinking
- Optimize images and assets

### 2. PWA Optimization

- Implement efficient caching strategies
- Use compression (gzip/brotli)
- Optimize bundle size
- Implement code splitting

### 3. TWA-Specific Optimizations

- Preload critical resources
- Optimize splash screen duration
- Implement efficient deep linking
- Use appropriate display modes

---

## Maintenance and Updates

### 1. Regular Updates

- Monitor Android API changes
- Update target SDK annually
- Keep dependencies updated
- Follow Material Design guidelines

### 2. Monitoring

- Set up crash reporting
- Monitor performance metrics
- Track user engagement
- Gather user feedback

### 3. Compliance

- Stay updated with Play Store policies
- Monitor Target SDK requirements
- Ensure privacy policy compliance
- Regular security audits

---

## Additional Resources

### Documentation

- [Android Developers - TWA](https://developer.android.com/docs/app-bundle/trusted-web-activity)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Material Design Guidelines](https://material.io/design)
- [PWA Documentation](https://developers.google.com/web/progressive-web-apps)

### Tools

- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) - TWA generator
- [PWA Builder](https://www.pwabuilder.com/) - Microsoft's PWA tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA auditing

### Community

- [Android Developers Community](https://developer.android.com/community)
- [PWA Slack Community](https://aka.ms/pwadiscord)
- [Material Design Community](https://material.io/community)

---

**Generated for ShelfQuest PWA-to-Android Deployment**
**Target SDK**: Android 14 (API 34)
**Last Updated**: September 2024
