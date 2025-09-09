@echo off
echo ========================================
echo   CLEANUP AND RESTART DEVELOPMENT SERVERS
echo ========================================
echo.

echo Step 1: Killing existing Node.js processes on ports 3000-3003 and 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process %%a on port 3000...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a on port 3001...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
    echo Killing process %%a on port 3002...
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do (
    echo Killing process %%a on port 3003...
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Killing process %%a on port 8000...
    taskkill /PID %%a /F >nul 2>&1
)

echo Waiting 3 seconds for cleanup...
timeout /t 3 >nul

echo Step 2: Verifying ports are free...
netstat -ano | findstr ":3000 :8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Some processes may still be running
    echo Manual cleanup may be required
    netstat -ano | findstr ":3000 :5000"
    pause
)

echo Step 3: Starting Backend Server (Port 8000)...
cd /d "%~dp0server2"
echo Starting server...
start "Backend Server" cmd /k "npm start"
echo Waiting 5 seconds for server to start...
timeout /t 5 >nul

echo Step 4: Starting Frontend Client (Port 3000)...
cd /d "%~dp0client2"
echo Starting client...
start "Frontend Client" cmd /k "npm run dev -- --port 3000"

echo.
echo ========================================
echo   DEVELOPMENT ENVIRONMENT READY!
echo ========================================
echo Frontend: http://localhost:3000 (or next available port)
echo Backend:  http://localhost:8000
echo.
echo Your application should now be accessible at:
echo http://localhost:3000
echo.
echo Press any key to exit...
pause >nul