@echo off
setlocal ENABLEDELAYEDEXPANSION
REM Ensure we run from this script's folder (android directory)
pushd "%~dp0"
echo ========================================
echo   Building AAB for Google Play Store
echo ========================================
echo.

REM Prefer Android Studio's bundled JDK 17 if available
set "PREF_JDK=C:\Program Files\Android\Android Studio\jbr"
if exist "%PREF_JDK%\bin\java.exe" (
  set "JAVA_HOME=%PREF_JDK%"
) else (
  REM Fallback: try Adoptium Temurin 17 (most common install path)
  for /d %%G in ("C:\Program Files\Eclipse Adoptium\jdk-17.*") do (
    if exist "%%G\bin\java.exe" (
      set "JAVA_HOME=%%G"
    )
  )
)

if not defined JAVA_HOME (
  echo ❌ Could not find JDK 17.
  echo    Install Android Studio OR Temurin JDK 17.
  echo    Temurin download: https://adoptium.net/temurin/releases/?version=17
  echo.
  echo    After installing, re-run this script.
  pause
  exit /b 1
)

set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Using Java from: %JAVA_HOME%
"%JAVA_HOME%\bin\java.exe" -version
echo.

echo Cleaning previous builds and stopping Gradle daemon...
call .\gradlew.bat --stop

echo.
echo Cleaning build artifacts...
call .\gradlew.bat clean

echo.
echo Building Android App Bundle (AAB)...
echo This is the file you'll upload to Play Store
echo This may take 5-10 minutes...
echo.

REM Build AAB with updated optimization settings
call .\gradlew.bat bundleRelease --no-daemon --stacktrace

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
endlocal
popd
