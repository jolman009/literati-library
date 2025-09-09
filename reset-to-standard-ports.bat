@echo off
echo ========================================
echo   RESET TO STANDARD PORTS (5000/3000)
echo ========================================
echo.

echo Step 1: Aggressive cleanup of ALL Node.js processes...
echo Killing all node.exe processes (this may close other Node apps!)
taskkill /IM node.exe /F >nul 2>&1
echo Waiting 5 seconds for complete shutdown...
timeout /t 5 >nul

echo Step 2: Verifying ports 5000 and 3000 are free...
netstat -ano | findstr ":5000 :3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Ports still in use after cleanup
    netstat -ano | findstr ":5000 :3000"
    echo.
    echo Manual intervention may be required.
    echo Try restarting your computer or using different ports.
    pause
    exit /b 1
)

echo Step 3: Updating configuration files to standard ports...
echo Updating server to use port 5000...
cd /d "%~dp0server2"
powershell -Command "(Get-Content .env) -replace 'PORT=8000', 'PORT=5000' | Set-Content .env"

echo Updating client to use port 5000 API...
cd /d "%~dp0client2"  
powershell -Command "(Get-Content .env) -replace 'VITE_API_BASE_URL=http://localhost:8000', 'VITE_API_BASE_URL=http://localhost:5000' | Set-Content .env"

echo Step 4: Starting Backend Server (Port 5000)...
cd /d "%~dp0server2"
start "Backend Server" cmd /k "npm start"
echo Waiting 5 seconds for server to start...
timeout /t 5 >nul

echo Step 5: Starting Frontend Client (Port 3000)...
cd /d "%~dp0client2"
start "Frontend Client" cmd /k "npm run dev -- --port 3000"

echo.
echo ========================================
echo   STANDARD PORTS RESTORED!
echo ========================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo If you still get port conflicts, consider:
echo 1. Restarting your computer
echo 2. Using the existing 8000/3003 setup (it works fine)
echo 3. Checking for other applications using these ports
echo.
echo Press any key to exit...
pause >nul