@echo off
echo ========================================
echo   Building Literati Android App (DEBUG)
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
echo Building DEBUG APK (no signing required)...
echo This will take 2-5 minutes on first run (downloads dependencies)
echo.

REM Build debug APK (doesn't require keystore password)
call gradlew.bat assembleDebug --stacktrace

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
echo Debug APK location:
echo app\build\outputs\apk\debug\app-debug.apk
echo.
echo File size:
if exist app\build\outputs\apk\debug\app-debug.apk (
    dir app\build\outputs\apk\debug\app-debug.apk | findstr "app-debug.apk"
) else (
    echo APK file not found!
)
echo.
echo This is a DEBUG build - for testing only
echo For Play Store submission, use build-playstore.bat
echo.
pause
