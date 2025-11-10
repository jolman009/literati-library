@echo off
REM ShelfQuest Monitoring Stack Stop Script for Windows

echo.
echo 🛑 Stopping ShelfQuest Monitoring Stack...
echo.

docker-compose -f docker-compose.monitoring.yml down

echo.
echo ✅ Monitoring stack stopped
echo.
echo To remove all data (volumes), run:
echo    docker-compose -f docker-compose.monitoring.yml down -v
echo.
pause
