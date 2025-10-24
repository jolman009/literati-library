@echo off
echo ========================================
echo   Building ShelfQuest Android App (STAGING)
echo ========================================
echo.

REM Set JAVA_HOME to Android Studio's JDK
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

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
echo Building STAGING APK (points to https://shelfquest.org)...
echo This connects to your production website for testing
echo.

REM Build staging APK
call gradlew.bat assembleStaging --stacktrace

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
echo Staging APK location:
echo app\build\outputs\apk\staging\app-staging.apk
echo.
echo Package: org.shelfquest.app.staging
echo URL: https://shelfquest.org
echo.
echo File size:
if exist app\build\outputs\apk\staging\app-staging.apk (
    dir app\build\outputs\apk\staging\app-staging.apk | findstr "app-staging.apk"
) else (
    echo APK file not found!
)
echo.
echo This is a STAGING build - for testing with production website
echo For Play Store submission, use build-playstore.bat
echo.
pause
