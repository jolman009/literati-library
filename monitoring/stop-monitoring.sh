#!/bin/bash

# ShelfQuest Monitoring Stack Stop Script

set -e

echo "🛑 Stopping ShelfQuest Monitoring Stack..."

docker-compose -f docker-compose.monitoring.yml down

echo ""
echo "✅ Monitoring stack stopped"
echo ""
echo "To remove all data (volumes), run:"
echo "   docker-compose -f docker-compose.monitoring.yml down -v"
