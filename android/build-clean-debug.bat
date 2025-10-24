@echo off
echo ========================================
echo   Clean Build - Literati Android (DEBUG)
echo ========================================
echo.

REM Set JAVA_HOME to Android Studio's JDK
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Step 1: Stopping all Gradle daemons...
call gradlew --stop
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Cleaning Gradle caches...
if exist ".gradle" rmdir /s /q ".gradle"
if exist "app\build" rmdir /s /q "app\build"
if exist "build" rmdir /s /q "build"

REM Clean the problematic transforms cache
echo Cleaning global transforms cache...
if exist "%USERPROFILE%\.gradle\caches\transforms-3" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\transforms-3" 2>nul
)
if exist "%USERPROFILE%\.gradle\caches\8.2" (
    rmdir /s /q "%USERPROFILE%\.gradle\caches\8.2" 2>nul
)

echo.
echo Step 3: Building DEBUG APK with fresh configuration...
echo This will take 2-5 minutes (downloading dependencies)...
echo.

call gradlew assembleDebug --no-daemon --stacktrace

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
if exist app\build\outputs\apk\debug\app-debug.apk (
    dir app\build\outputs\apk\debug\app-debug.apk | findstr "app-debug.apk"
) else (
    echo APK file not found!
)
echo.
pause
