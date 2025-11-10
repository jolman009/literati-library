@echo off
REM ShelfQuest Monitoring Stack Startup Script for Windows

echo.
echo 🚀 Starting ShelfQuest Monitoring Stack...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "monitoring\prometheus" mkdir "monitoring\prometheus"
if not exist "monitoring\loki" mkdir "monitoring\loki"
if not exist "monitoring\promtail" mkdir "monitoring\promtail"
if not exist "monitoring\tempo" mkdir "monitoring\tempo"
if not exist "monitoring\alertmanager" mkdir "monitoring\alertmanager"
if not exist "monitoring\grafana\provisioning\datasources" mkdir "monitoring\grafana\provisioning\datasources"
if not exist "monitoring\grafana\provisioning\dashboards" mkdir "monitoring\grafana\provisioning\dashboards"
if not exist "monitoring\grafana\dashboards" mkdir "monitoring\grafana\dashboards"
if not exist "logs" mkdir "logs"
if not exist "server2\logs" mkdir "server2\logs"
if not exist "client2\logs" mkdir "client2\logs"
if not exist "ai-service\logs" mkdir "ai-service\logs"

REM Set default password if not set
if not defined GRAFANA_ADMIN_PASSWORD set GRAFANA_ADMIN_PASSWORD=admin

REM Start monitoring stack
echo 🐳 Starting Docker containers...
docker-compose -f docker-compose.monitoring.yml up -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✨ Monitoring Stack Started!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📊 Access Points:
echo    Grafana:       http://localhost:3001
echo                   User: admin
echo                   Pass: %GRAFANA_ADMIN_PASSWORD%
echo.
echo    Prometheus:    http://localhost:9090
echo    Loki:          http://localhost:3100
echo    Tempo:         http://localhost:3200
echo    Alertmanager:  http://localhost:9093
echo.
echo 📈 Metrics Endpoint:
echo    Server:        http://localhost:5000/metrics
echo.
echo 🔧 Management Commands:
echo    Stop:          stop-monitoring.bat
echo    Logs:          docker-compose -f docker-compose.monitoring.yml logs -f
echo    Restart:       docker-compose -f docker-compose.monitoring.yml restart
echo.
echo 📚 Documentation: monitoring\README.md
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
pause
