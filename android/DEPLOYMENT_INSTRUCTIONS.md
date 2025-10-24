# Android Deployment Instructions

## Generated Files

This script has generated the following files:

1. **shelfquest-release.keystore** - Your release keystore (keep this secure)
2. **gradle.properties** - Gradle configuration with keystore settings
3. **.well-known/assetlinks.json** - Digital Asset Links verification file

## Next Steps

### 1. Secure Your Keystore
- Move `shelfquest-release.keystore` to a secure location
- **NEVER** commit the keystore to version control
- Consider backing it up to a secure, encrypted location
- Update the `KEYSTORE_FILE` path in `gradle.properties` if you move it

### 2. Upload Digital Asset Links
Upload the `.well-known/assetlinks.json` file to your web server at:
```
https://shelfquest.org/.well-known/assetlinks.json
```

The file should be accessible at this exact URL for Digital Asset Links verification to work.

### 3. Build Your App
```bash
# Debug build
gradlew assembleDebug

# Release build (signed)
gradlew assembleRelease

# Generate AAB for Play Store
gradlew bundleRelease
```

### 4. Verify Digital Asset Links
Use Google's Digital Asset Links tester:
https://developers.google.com/digital-asset-links/tools/generator

### 5. Upload to Play Store
1. Create a new app in Google Play Console
2. Upload the AAB file (`app/build/outputs/bundle/release/app-release.aab`)
3. Complete the store listing with the provided content
4. Submit for review

## Important Security Notes

- **Keystore Password**: Keep your keystore password secure
- **Key Password**: Keep your key password secure
- **SHA256 Fingerprint**: SHA256:
- **Digital Asset Links**: Must be accessible at the exact URL above

## Troubleshooting

If TWA doesn't work:
1. Verify assetlinks.json is accessible at the correct URL
2. Check that the SHA256 fingerprint matches
3. Ensure the package name matches exactly
4. Test with Google's verification tools

Generated on: Fri 10/24/2025 16:57:34.45
