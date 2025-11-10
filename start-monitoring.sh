#!/bin/bash

# ShelfQuest Monitoring Stack Startup Script
# Starts Grafana + Prometheus + Loki + Tempo + Alertmanager

set -e

echo "🚀 Starting ShelfQuest Monitoring Stack..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p monitoring/prometheus
mkdir -p monitoring/loki
mkdir -p monitoring/promtail
mkdir -p monitoring/tempo
mkdir -p monitoring/alertmanager
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/dashboards
mkdir -p logs
mkdir -p server2/logs
mkdir -p client2/logs
mkdir -p ai-service/logs

# Check if configuration files exist
echo "🔍 Checking configuration files..."
required_files=(
    "monitoring/prometheus/prometheus.yml"
    "monitoring/loki/loki-config.yml"
    "monitoring/promtail/promtail-config.yml"
    "monitoring/tempo/tempo.yml"
    "monitoring/alertmanager/alertmanager.yml"
    "monitoring/grafana/provisioning/datasources/datasources.yml"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Error: Missing configuration files:"
    printf '   - %s\n' "${missing_files[@]}"
    echo ""
    echo "Please ensure all configuration files are in place."
    exit 1
fi

# Set default environment variables if not set
export GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}

# Start monitoring stack
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.monitoring.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
services=("shelfquest-prometheus" "shelfquest-loki" "shelfquest-grafana" "shelfquest-tempo" "shelfquest-alertmanager")
all_healthy=true

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
        echo "✅ $service is running"
    else
        echo "❌ $service failed to start"
        all_healthy=false
    fi
done

echo ""
if [ "$all_healthy" = true ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ Monitoring Stack Started Successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 Access Points:"
    echo "   Grafana:       http://localhost:3001"
    echo "                  User: admin"
    echo "                  Pass: $GRAFANA_ADMIN_PASSWORD"
    echo ""
    echo "   Prometheus:    http://localhost:9090"
    echo "   Loki:          http://localhost:3100"
    echo "   Tempo:         http://localhost:3200"
    echo "   Alertmanager:  http://localhost:9093"
    echo ""
    echo "📈 Metrics Endpoint:"
    echo "   Server:        http://localhost:5000/metrics"
    echo ""
    echo "🔧 Management Commands:"
    echo "   Stop:          ./stop-monitoring.sh"
    echo "   Logs:          docker-compose -f docker-compose.monitoring.yml logs -f"
    echo "   Restart:       docker-compose -f docker-compose.monitoring.yml restart"
    echo ""
    echo "📚 Documentation: monitoring/README.md"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  Some services failed to start"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Check logs with:"
    echo "   docker-compose -f docker-compose.monitoring.yml logs"
    exit 1
fi
