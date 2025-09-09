#!/bin/bash
# Development Docker startup script

set -e

echo "🚀 Starting Literati in Development Mode"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your actual values before running again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🔧 Building development containers..."
docker-compose build

echo "🏃‍♂️ Starting services..."
docker-compose up -d

echo "📋 Service Status:"
docker-compose ps

echo ""
echo "🎉 Services are starting up!"
echo ""
echo "📱 Client:     http://localhost:3000"
echo "🔌 Server:     http://localhost:5000" 
echo "🤖 AI Service: http://localhost:8000"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop all:  docker-compose down"
echo ""