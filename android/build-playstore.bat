@echo off
echo ========================================
echo   Building AAB for Google Play Store
echo ========================================
echo.

REM Set JAVA_HOME to Android Studio's JDK (has jlink and all required tools)
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java from: %JAVA_HOME%
echo.

echo Cleaning previous builds and stopping Gradle daemon...
call gradlew --stop
timeout /t 2 /nobreak >nul

echo.
echo Cleaning build artifacts...
call gradlew clean

echo.
echo Building Android App Bundle (AAB)...
echo This is the file you'll upload to Play Store
echo This may take 5-10 minutes...
echo.

REM Build AAB with updated optimization settings
call gradlew bundleRelease --no-daemon

if errorlevel 1 (
    echo.
    echo ❌ Build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   AAB BUILD SUCCESSFUL!
echo ========================================
echo.
echo App Bundle location:
echo app\build\outputs\bundle\release\app-release.aab
echo.
echo File size:
dir app\build\outputs\bundle\release\app-release.aab | findstr "app-release.aab"
echo.
echo ✅ This file is ready for Google Play Store submission!
echo.
echo Next steps:
echo 1. Create Google Play Developer account ($25)
echo 2. Create new app in Play Console
echo 3. Upload this AAB file
echo 4. Complete store listing
echo 5. Submit for review
echo.
pause
