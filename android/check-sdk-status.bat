@echo off
echo ==========================================
echo Android SDK Status Check
echo ==========================================
echo.

echo Checking ANDROID_HOME environment variable...
if defined ANDROID_HOME (
    echo ✓ ANDROID_HOME is set to: %ANDROID_HOME%
) else (
    echo ✗ ANDROID_HOME is NOT set
    echo   Expected: %LOCALAPPDATA%\Android\Sdk
)
echo.

echo Checking SDK directory...
if exist "%LOCALAPPDATA%\Android\Sdk" (
    echo ✓ SDK directory exists: %LOCALAPPDATA%\Android\Sdk
) else (
    echo ✗ SDK directory NOT found: %LOCALAPPDATA%\Android\Sdk
    echo   You may need to complete Android Studio installation
)
echo.

echo Checking for platforms directory...
if exist "%LOCALAPPDATA%\Android\Sdk\platforms" (
    echo ✓ Platforms directory exists
    echo.
    echo Installed Android platforms:
    dir /b "%LOCALAPPDATA%\Android\Sdk\platforms"
) else (
    echo ✗ Platforms directory NOT found
    echo   No Android platforms installed yet
)
echo.

echo Checking for API 34 specifically...
if exist "%LOCALAPPDATA%\Android\Sdk\platforms\android-34" (
    echo ✓ API 34 (Android 14) IS INSTALLED
) else (
    echo ✗ API 34 (Android 14) NOT FOUND - REQUIRED FOR BUILD
)
echo.

echo Checking for build-tools...
if exist "%LOCALAPPDATA%\Android\Sdk\build-tools" (
    echo ✓ Build-tools directory exists
    echo.
    echo Installed build-tools versions:
    dir /b "%LOCALAPPDATA%\Android\Sdk\build-tools"
) else (
    echo ✗ Build-tools NOT found
)
echo.

echo ==========================================
echo Next Steps:
echo ==========================================
if not exist "%LOCALAPPDATA%\Android\Sdk\platforms\android-34" (
    echo 1. Open Android Studio
    echo 2. Go to Tools → SDK Manager
    echo 3. In SDK Platforms tab, check "Android 14.0 (API 34)"
    echo 4. Click Apply and wait for download
    echo 5. Run this script again to verify
)

if not defined ANDROID_HOME (
    echo.
    echo After API 34 is installed, set ANDROID_HOME:
    echo   setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
    echo   Then close and reopen your terminal
)
echo.
