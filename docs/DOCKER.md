# 🐳 Docker Deployment Guide

This guide covers running Literati using Docker for both development and production environments.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available for containers
- Environment variables configured (see `.env.example`)

## 🚀 Quick Start

### Development Mode
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your values (Supabase, Gemini API, etc.)
nano .env

# 3. Start development environment
chmod +x scripts/docker-dev.sh
./scripts/docker-dev.sh
```

### Production Mode
```bash
# 1. Ensure production environment is configured
# Edit .env with production values

# 2. Deploy to production
chmod +x scripts/docker-prod.sh
./scripts/docker-prod.sh
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   Server        │    │   AI Service    │
│   (React/Nginx) │◄──►│   (Node.js)     │◄──►│   (FastAPI)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └─────────────┬─────────────────┬───────────────┘
                       │                 │
                ┌─────────────┐   ┌─────────────┐
                │   Traefik   │   │   Redis     │
                │   (Proxy)   │   │   (Cache)   │
                │   Port: 80  │   │   Port: 6379│
                └─────────────┘   └─────────────┘
```

## 🔧 Manual Docker Commands

### Build Individual Services
```bash
# Client
docker build -t literati-client ./client2

# Server  
docker build -t literati-server ./server2

# AI Service
docker build -t literati-ai ./ai-service
```

### Run Individual Services
```bash
# Client
docker run -p 3000:80 literati-client

# Server (requires environment variables)
docker run -p 5000:5000 --env-file .env literati-server

# AI Service
docker run -p 8000:8000 --env-file .env literati-ai
```

### Full Stack with Docker Compose
```bash
# Development (with file watching)
docker-compose up -d

# Production (optimized builds)
docker-compose -f docker-compose.yml up -d

# With additional services (Redis, Traefik)
docker-compose --profile production up -d

# With monitoring
docker-compose --profile monitoring up -d
```

## 📊 Service Configuration

### Client Service
- **Base Image**: `node:20-alpine` → `nginx:alpine`
- **Build Process**: Multi-stage (build + serve)
- **Features**: 
  - Gzipped assets
  - Security headers
  - SPA routing support
  - Runtime environment injection

### Server Service  
- **Base Image**: `node:20-alpine`
- **Features**:
  - Non-root user execution
  - Health checks
  - Log volumes
  - Upload persistence

### AI Service
- **Base Image**: `python:3.11-slim`
- **Features**:
  - Minimal dependencies
  - Health monitoring
  - FastAPI optimization

## 🔒 Production Security

### Container Security
```bash
# All containers run as non-root users
# Minimal base images (Alpine/Slim)
# Read-only file systems where possible
# Security scanning enabled

# Example security scan
docker scan literati-client
```

### Network Security
```bash
# Internal network isolation
# TLS termination at proxy
# Rate limiting (via Traefik)
# CORS properly configured
```

## 📈 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f client
docker-compose logs -f server
docker-compose logs -f ai-service

# With timestamps
docker-compose logs -f -t
```

### Health Checks
```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:3000/health
curl http://localhost:5000/health  
curl http://localhost:8000/health
```

### Resource Monitoring
```bash
# Container resource usage
docker stats

# Detailed service info
docker-compose top
```

## 🔄 Updates & Maintenance

### Update Services
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build

# Zero-downtime update (with multiple replicas)
docker-compose up -d --scale server=2
```

### Cleanup
```bash
# Stop all services
docker-compose down

# Remove volumes (⚠️ destroys data)
docker-compose down -v

# Clean unused Docker resources
docker system prune -a
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000
# Kill process or change port in docker-compose.yml
```

#### Container Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Check environment variables
docker-compose config

# Rebuild from scratch
docker-compose build --no-cache
```

#### Permission Issues
```bash
# Fix volume permissions (Linux)
sudo chown -R $USER:$USER ./uploads
sudo chown -R $USER:$USER ./logs
```

#### Out of Disk Space
```bash
# Clean unused Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Performance Issues

#### Slow Build Times
```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker-compose build
```

#### Memory Issues
```bash
# Check Docker memory allocation
docker stats

# Increase Docker memory in Docker Desktop
# Settings → Resources → Memory → 4GB+
```

## 📚 Environment Variables

### Required Variables
```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# JWT
JWT_SECRET=your-super-secure-secret-minimum-32-characters

# Google AI
GOOGLE_API_KEY=your-google-gemini-api-key
```

### Optional Production Variables
```bash
# SSL (if using custom domain)
SSL_CERT_PATH=/certs/fullchain.pem
SSL_KEY_PATH=/certs/privkey.pem

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## 🚢 Production Deployment

### Cloud Platforms

#### Railway/Render
```bash
# Push to git repository
# Connect to Railway/Render
# Set environment variables in dashboard
# Deploy automatically
```

#### AWS/GCP/Azure
```bash
# Use docker-compose.yml as base
# Set up container registry
# Configure load balancer
# Set up SSL certificates
```

#### Self-Hosted VPS
```bash
# Copy files to server
scp -r . user@server:/opt/literati

# Run production deployment
ssh user@server
cd /opt/literati
./scripts/docker-prod.sh
```

For detailed deployment instructions for specific platforms, see the `deployment/` directory.