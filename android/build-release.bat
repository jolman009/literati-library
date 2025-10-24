@echo off
echo ========================================
echo   Building Literati Android App
echo ========================================
echo.

REM Set JAVA_HOME to Android Studio's JDK (has jlink and all required tools)
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%

echo Using Java from: %JAVA_HOME%
echo.

REM Verify Java is accessible
"%JAVA_HOME%\bin\java.exe" -version
if errorlevel 1 (
    echo ERROR: Java not found at %JAVA_HOME%
    pause
    exit /b 1
)

echo.
echo Building release APK...
echo This will take 2-5 minutes on first run (downloads dependencies)
echo.

REM Build release APK
gradlew.bat assembleRelease

if errorlevel 1 (
    echo.
    echo ❌ Build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BUILD SUCCESSFUL!
echo ========================================
echo.
echo Release APK location:
echo app\build\outputs\apk\release\app-release.apk
echo.
echo File size:
dir app\build\outputs\apk\release\app-release.apk | findstr "app-release.apk"
echo.
echo Next steps:
echo 1. Install on device: adb install app\build\outputs\apk\release\app-release.apk
echo 2. Or build AAB for Play Store: gradlew.bat bundleRelease
echo.
pause
