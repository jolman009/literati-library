@echo off
echo ========================================
echo   MY LIBRARY APP - DEVELOPMENT STARTUP
echo ========================================
echo.

echo Step 1: Checking for existing processes...
netstat -ano | findstr ":3000 :5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Ports 3000 or 5000 are in use
    echo Please close any existing dev servers first
    pause
    exit /b 1
)

echo Step 2: Starting Backend Server (Port 5000)...
cd /d "%~dp0server2"
start "Backend Server" cmd /k "npm start"
echo Waiting 5 seconds for server to start...
timeout /t 5 >nul

echo Step 3: Starting Frontend Client (Port 3000)...
cd /d "%~dp0client2"
start "Frontend Client" cmd /k "npm run dev -- --port 3000"

echo.
echo ========================================
echo   DEVELOPMENT ENVIRONMENT READY!
echo ========================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Press any key to continue...
pause >nul