#!/bin/bash
# Production Docker deployment script

set -e

echo "🏭 Deploying Literati to Production"
echo "==================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🔧 Building production containers..."
docker-compose -f docker-compose.yml build --no-cache

echo "🧪 Running production tests..."
# Add test commands here when available

echo "🏃‍♂️ Starting production services..."
docker-compose -f docker-compose.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🔍 Health checking services..."
curl -f http://localhost:3000/health || echo "⚠️  Client health check failed"
curl -f http://localhost:5000/health || echo "⚠️  Server health check failed"  
curl -f http://localhost:8000/health || echo "⚠️  AI service health check failed"

echo ""
echo "📋 Service Status:"
docker-compose ps

echo ""
echo "🎉 Production deployment complete!"
echo ""
echo "📱 Application: http://localhost:3000"
echo "📊 View logs:   docker-compose logs -f"
echo "🛑 Stop all:    docker-compose down"
echo ""
echo "🔒 Security Notes:"
echo "- Ensure SSL certificates are configured for production domain"
echo "- Update environment variables with production values"
echo "- Set up monitoring and backup systems"
echo ""