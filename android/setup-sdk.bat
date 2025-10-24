@echo off
echo ========================================
echo   Android SDK Quick Setup
echo ========================================
echo.
echo This script will download and install minimal Android SDK components
echo needed to build your app (~200MB download).
echo.
echo Target location: %LOCALAPPDATA%\Android\Sdk
echo.
pause

REM Create SDK directory
set SDK_ROOT=%LOCALAPPDATA%\Android\Sdk
echo Creating SDK directory...
if not exist "%SDK_ROOT%" mkdir "%SDK_ROOT%"
if not exist "%SDK_ROOT%\cmdline-tools" mkdir "%SDK_ROOT%\cmdline-tools"

REM Download command line tools
set CMDLINE_TOOLS_URL=https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
set CMDLINE_TOOLS_ZIP=%TEMP%\cmdline-tools.zip

echo.
echo Downloading Android Command Line Tools...
echo This may take a few minutes (~150MB)...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%CMDLINE_TOOLS_URL%' -OutFile '%CMDLINE_TOOLS_ZIP%'}"

if errorlevel 1 (
    echo ERROR: Failed to download command line tools
    pause
    exit /b 1
)

echo Download complete!
echo.

echo Extracting...
powershell -Command "& {Expand-Archive -Path '%CMDLINE_TOOLS_ZIP%' -DestinationPath '%SDK_ROOT%\cmdline-tools' -Force}"

REM Rename to 'latest'
if exist "%SDK_ROOT%\cmdline-tools\cmdline-tools" (
    move "%SDK_ROOT%\cmdline-tools\cmdline-tools" "%SDK_ROOT%\cmdline-tools\latest"
)

echo.
echo Installing required SDK components...
echo This will download Android 14 SDK and build tools (~200MB more)
echo.

cd /d "%SDK_ROOT%\cmdline-tools\latest\bin"

REM Accept licenses automatically
echo y | sdkmanager.bat --licenses

REM Install required components
sdkmanager.bat "platform-tools" "platforms;android-34" "build-tools;34.0.0"

if errorlevel 1 (
    echo.
    echo WARNING: SDK component installation had issues
    echo You may need to run this manually:
    echo cd "%SDK_ROOT%\cmdline-tools\latest\bin"
    echo sdkmanager.bat "platform-tools" "platforms;android-34" "build-tools;34.0.0"
    echo.
)

REM Set environment variable
echo.
echo Setting ANDROID_HOME environment variable...
setx ANDROID_HOME "%SDK_ROOT%"

REM Create local.properties
echo.
echo Creating local.properties...
cd /d "%~dp0"
echo sdk.dir=%SDK_ROOT:\=\\%> local.properties

REM Clean up
del "%CMDLINE_TOOLS_ZIP%"

echo.
echo ========================================
echo   SDK SETUP COMPLETE!
echo ========================================
echo.
echo SDK Location: %SDK_ROOT%
echo.
echo IMPORTANT: Close and reopen your terminal for ANDROID_HOME to take effect
echo.
echo Next step: Run build-release.bat to build your app
echo.
pause
