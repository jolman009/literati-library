@echo off
setlocal enabledelayedexpansion

REM =============================================================================
REM LITERATI ANDROID KEYSTORE - MANUAL GENERATION (Using WebStorm JDK)
REM =============================================================================

echo ========================================
echo   Literati Keystore Generator
echo   (Using WebStorm JDK)
echo ========================================
echo.

REM Set keytool path (found on your system)
set KEYTOOL="C:\Program Files\JetBrains\WebStorm 2025.1\jbr\bin\keytool.exe"

REM Configuration
set KEYSTORE_NAME=shelfquest-release.keystore
set KEY_ALIAS=shelfquest_key
set VALIDITY_DAYS=10000
set KEY_SIZE=2048
set ALGORITHM=RSA
set APP_PACKAGE=org.shelfquest.app
set PWA_URL=https://shelfquest.org

REM Check if keystore already exists
if exist "%KEYSTORE_NAME%" (
    echo Warning: Keystore %KEYSTORE_NAME% already exists.
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "!OVERWRITE!"=="y" (
        echo Keystore generation cancelled.
        pause
        exit /b 0
    )
    del "%KEYSTORE_NAME%"
)

REM Collect information
echo Please provide the following information:
echo.
set /p ORG_NAME="Organization Name (e.g., Literati): "
set /p ORG_UNIT="Organizational Unit (e.g., Development): "
set /p CITY="City: "
set /p STATE="State/Province: "
set /p COUNTRY="Country Code (2 letters, e.g., US): "

REM Build distinguished name
set DISTINGUISHED_NAME=CN=Literati, OU=%ORG_UNIT%, O=%ORG_NAME%, L=%CITY%, ST=%STATE%, C=%COUNTRY%

echo.
echo Generating keystore with:
echo - Keystore: %KEYSTORE_NAME%
echo - Alias: %KEY_ALIAS%
echo - Distinguished Name: %DISTINGUISHED_NAME%
echo - Validity: %VALIDITY_DAYS% days (~27 years)
echo.
echo IMPORTANT: You will be prompted for passwords.
echo - Use a STRONG password (16+ characters recommended)
echo - SAVE these passwords in a password manager!
echo - Without these passwords, you cannot update your app!
echo.
pause

REM Generate the keystore
echo.
echo Generating keystore...
echo.

%KEYTOOL% -genkeypair ^
  -alias "%KEY_ALIAS%" ^
  -keyalg "%ALGORITHM%" ^
  -keysize %KEY_SIZE% ^
  -validity %VALIDITY_DAYS% ^
  -keystore "%KEYSTORE_NAME%" ^
  -dname "%DISTINGUISHED_NAME%"

if errorlevel 1 (
    echo.
    echo ❌ Failed to generate keystore.
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Keystore generated successfully!
echo.

REM Prompt for keystore password to extract SHA256
echo Now we need to extract the SHA256 fingerprint...
echo Please enter your keystore password again:
echo.

REM Extract SHA256 fingerprint
echo Extracting SHA256 fingerprint...
%KEYTOOL% -list -v -keystore "%KEYSTORE_NAME%" -alias "%KEY_ALIAS%" > keystore_info.txt

REM Parse SHA256 from output
for /f "tokens=2 delims= " %%a in ('findstr "SHA256:" keystore_info.txt') do set SHA256_FINGERPRINT=%%a

if "%SHA256_FINGERPRINT%"=="" (
    echo.
    echo ⚠️ Could not automatically extract SHA256 fingerprint.
    echo Please check keystore_info.txt file for the SHA256 value.
    echo You'll need to manually add it to gradle.properties and assetlinks.json
    pause
) else (
    echo.
    echo ✅ SHA256 Fingerprint: %SHA256_FINGERPRINT%
    echo.
)

REM Clean up temp file
del keystore_info.txt 2>nul

echo.
echo ========================================
echo   CRITICAL - SAVE THESE DETAILS
echo ========================================
echo.
echo Keystore File: %KEYSTORE_NAME%
echo Key Alias: %KEY_ALIAS%
echo SHA256: %SHA256_FINGERPRINT%
echo.
echo ⚠️  IMPORTANT SECURITY NOTES:
echo 1. SAVE your keystore password in a password manager NOW
echo 2. NEVER commit %KEYSTORE_NAME% to version control
echo 3. BACKUP %KEYSTORE_NAME% to a secure location
echo 4. If you lose this keystore, you CANNOT update your app!
echo.

REM Create gradle.properties
echo Creating gradle.properties...
echo.

echo You'll need to manually add your passwords to gradle.properties
echo.
set /p KEYSTORE_PASSWORD="Enter keystore password to save (or press Enter to skip): "
set /p KEY_PASSWORD="Enter key password to save (or press Enter to skip): "

(
echo # Project-wide Gradle settings
echo # Generated on %DATE% %TIME%
echo.
echo org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
echo org.gradle.parallel=true
echo android.useAndroidX=true
echo kotlin.code.style=official
echo android.nonTransitiveRClass=true
echo android.enableR8.fullMode=true
echo.
echo # ==============================================================================
echo # PWA CONFIGURATION
echo # ==============================================================================
echo PWA_URL=%PWA_URL%
echo APP_NAME=Literati
echo APP_PACKAGE_NAME=%APP_PACKAGE%
echo APP_VERSION_NAME=1.0.0
echo APP_VERSION_CODE=1
echo.
echo # TWA Configuration
echo TWA_DISPLAY_MODE=standalone
echo TWA_ORIENTATION=portrait
echo TWA_THEME_COLOR=#6750A4
echo TWA_BACKGROUND_COLOR=#FFFBFE
echo TWA_START_URL=/
echo.
echo # ==============================================================================
echo # KEYSTORE CONFIGURATION
echo # ==============================================================================
echo KEYSTORE_FILE=%KEYSTORE_NAME%
echo KEYSTORE_PASSWORD=%KEYSTORE_PASSWORD%
echo KEY_ALIAS=%KEY_ALIAS%
echo KEY_PASSWORD=%KEY_PASSWORD%
echo.
echo # SHA256 Fingerprint for Digital Asset Links
echo RELEASE_KEYSTORE_SHA256=%SHA256_FINGERPRINT%
echo.
echo # ==============================================================================
echo # TARGET SDK COMPLIANCE
echo # ==============================================================================
echo MIN_SDK_VERSION=24
echo TARGET_SDK_VERSION=34
echo COMPILE_SDK_VERSION=34
echo BUILD_TOOLS_VERSION=34.0.0
echo.
echo # Build optimizations
echo org.gradle.caching=true
echo org.gradle.configuration-cache=true
echo android.enableR8=true
echo android.enableCodeShrinking=true
) > gradle.properties

echo ✅ gradle.properties created!

REM Create Digital Asset Links
if not "%SHA256_FINGERPRINT%"=="" (
    echo.
    echo Creating Digital Asset Links (assetlinks.json^)...

    if not exist ".well-known" mkdir ".well-known"

    (
    echo [{
    echo   "relation": ["delegate_permission/common.handle_all_urls"],
    echo   "target": {
    echo     "namespace": "android_app",
    echo     "package_name": "%APP_PACKAGE%",
    echo     "sha256_cert_fingerprints": ["%SHA256_FINGERPRINT%"]
    echo   }
    echo }]
    ) > .well-known\assetlinks.json

    echo ✅ assetlinks.json created in .well-known\
)

REM Create instructions
echo.
echo Creating NEXT_STEPS.md...

(
echo # ✅ Keystore Generated Successfully!
echo.
echo ## Generated Files
echo.
echo 1. **%KEYSTORE_NAME%** - Your release keystore
echo 2. **gradle.properties** - Build configuration
echo 3. **.well-known/assetlinks.json** - Digital Asset Links
echo.
echo ## Critical Information
echo.
echo - **Keystore**: %KEYSTORE_NAME%
echo - **Alias**: %KEY_ALIAS%
echo - **SHA256**: %SHA256_FINGERPRINT%
echo - **PWA URL**: %PWA_URL%
echo.
echo ## ⚠️ IMMEDIATE ACTION REQUIRED
echo.
echo ### 1. Save Your Passwords
echo.
echo Open your password manager RIGHT NOW and save:
echo - Keystore password
echo - Key password
echo - Location of keystore file
echo.
echo **WITHOUT THESE, YOU CANNOT UPDATE YOUR APP!**
echo.
echo ### 2. Backup Your Keystore
echo.
echo ```cmd
echo copy %KEYSTORE_NAME% D:\Backups\literati-keystore-backup\
echo ```
echo.
echo Store in:
echo - External hard drive
echo - Cloud storage ^(encrypted^)
echo - USB drive in safe location
echo.
echo ### 3. Deploy Digital Asset Links
echo.
echo Copy assetlinks.json to your PWA:
echo.
echo ```cmd
echo copy .well-known\assetlinks.json ..\client2\public\.well-known\assetlinks.json
echo git add .
echo git commit -m "Add Digital Asset Links for Android TWA"
echo git push
echo ```
echo.
echo Wait 2 minutes for deployment, then verify:
echo ```cmd
echo curl https://shelfquest.org/.well-known/assetlinks.json
echo ```
echo.
echo ### 4. Build Your App
echo.
echo ```cmd
echo # Debug build
echo gradlew assembleDebug
echo.
echo # Release build ^(signed^)
echo gradlew assembleRelease
echo.
echo # AAB for Play Store
echo gradlew bundleRelease
echo ```
echo.
echo ### 5. Test on Device
echo.
echo ```cmd
echo adb install app\build\outputs\apk\release\app-release.apk
echo ```
echo.
echo Test that:
echo - App opens to shelfquest.org
echo - No browser UI visible
echo - Deep links work
echo - File sharing works
echo.
echo ### 6. Verify Digital Asset Links
echo.
echo Use Google's tool:
echo https://developers.google.com/digital-asset-links/tools/generator
echo.
echo Enter:
echo - Site domain: shelfquest.org
echo - Package name: org.shelfquest.app
echo - SHA256: %SHA256_FINGERPRINT%
echo.
echo ## 🚀 Next Steps Timeline
echo.
echo - **Today**: Deploy assetlinks.json ^(5 min^)
echo - **Today**: Build and test app ^(30 min^)
echo - **Tomorrow**: Create Play Console account ^($25^)
echo - **This week**: Prepare store assets
echo - **This week**: Submit to Play Store
echo - **1-7 days**: App goes live!
echo.
echo ## 📁 File Locations
echo.
echo - Keystore: `android\%KEYSTORE_NAME%`
echo - Config: `android\gradle.properties`
echo - Asset Links: `android\.well-known\assetlinks.json`
echo - Build outputs: `android\app\build\outputs\`
echo.
echo ## 🆘 If Something Goes Wrong
echo.
echo **Keystore issues**: Re-run this script to generate a new one
echo **Build fails**: Check gradle.properties has correct passwords
echo **TWA doesn't work**: Verify assetlinks.json is accessible online
echo.
echo ---
echo Generated: %DATE% %TIME%
) > NEXT_STEPS.md

echo ✅ NEXT_STEPS.md created!

echo.
echo ========================================
echo         GENERATION COMPLETE!
echo ========================================
echo.
echo ✅ Keystore: %KEYSTORE_NAME%
echo ✅ Configuration: gradle.properties
echo ✅ Asset Links: .well-known\assetlinks.json
echo ✅ Instructions: NEXT_STEPS.md
echo.
echo 📋 IMMEDIATE NEXT STEPS:
echo.
echo 1. SAVE your passwords in a password manager NOW
echo 2. BACKUP %KEYSTORE_NAME% to a secure location
echo 3. Deploy assetlinks.json:
echo    copy .well-known\assetlinks.json ..\client2\public\.well-known\assetlinks.json
echo 4. Read NEXT_STEPS.md for detailed instructions
echo.
echo 🎉 You're ready to build your Android app!
echo.
pause
