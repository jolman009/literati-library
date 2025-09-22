# Literati Multi-Repository Architecture

## Overview

The Literati digital library application uses a **microservices architecture** with separate repositories for each service. This approach enables independent deployment, development, and scaling of each component.

## 📁 Repository Structure

### 1. Frontend Repository
- **GitHub**: `https://github.com/jolman009/client2`
- **Directory**: `my-library-app-2/client2/`
- **Technology**: React 19, Vite, Tailwind CSS, Material Design 3
- **Deployment**: Vercel (automatic from main branch)
- **URL**: `https://client2-o2l1nijre-joel-guzmans-projects-f8aa100e.vercel.app`

### 2. Backend Repository
- **GitHub**: `https://github.com/jolman009/server2`
- **Directory**: `my-library-app-2/server2/`
- **Technology**: Express.js, Supabase, JWT Authentication
- **Deployment**: Render (automatic from main branch)
- **Features**: REST API, Database management, File storage

### 3. AI Service Repository
- **GitHub**: `https://github.com/jolman009/literati-ai`
- **Directory**: `my-library-app-2/ai-service/`
- **Technology**: FastAPI, Google Gemini API
- **Purpose**: Note summarization and AI-powered features
- **Remote**: `ai-repo` in parent directory

### 4. Android App Repository
- **GitHub**: `https://github.com/jolman009/android-lit`
- **Directory**: `my-library-app-2/android/`
- **Technology**: Android TWA (Trusted Web Activity)
- **Target**: Google Play Store
- **PWA Integration**: Converts React PWA to Android app

## 🚀 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Service    │
│   (React PWA)   │    │   (Express.js)  │    │   (FastAPI)     │
│                 │    │                 │    │                 │
│ client2 repo    │◄──►│ server2 repo    │◄──►│ literati-ai     │
│ ↓ Vercel        │    │ ↓ Render        │    │ ↓ Independent   │
│ Web App         │    │ API Server      │    │ AI Processing   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Android App    │
│  (TWA)          │
│                 │
│ android-lit     │
│ ↓ Play Store    │
│ Native Android  │
└─────────────────┘
```

## 🔄 Development Workflow

### Local Development
1. **Frontend**: `cd client2 && npm run dev` (localhost:3000)
2. **Backend**: `cd server2 && npm run dev` (localhost:5000)
3. **AI Service**: `cd ai-service && uvicorn main:app --reload` (localhost:8000)
4. **Android**: Uses production PWA URL for testing

### Deployment Flow
1. **Frontend**: Push to `client2` → Auto-deploy to Vercel
2. **Backend**: Push to `server2` → Auto-deploy to Render
3. **AI Service**: Manual deployment to preferred cloud provider
4. **Android**: Build AAB from `android-lit` → Manual upload to Play Store

## 🛠️ Why This Architecture?

### ✅ Advantages
- **Independent Deployment**: Each service can be updated without affecting others
- **Technology Flexibility**: Different tech stacks for different needs
- **Team Scalability**: Different teams can work on different repositories
- **Platform Integration**: Direct integration with deployment platforms
- **Security**: Isolated repositories with different access controls

### 🔧 Trade-offs
- **Coordination**: Changes across services require coordination
- **Version Management**: Need to manage compatibility between services
- **Repository Management**: More repositories to maintain
- **Documentation**: Need to keep architecture docs updated

## 📋 Repository Guidelines

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Include deployment context when relevant
- Reference related repositories when making cross-service changes

### Branching Strategy
- **main/master**: Production-ready code (auto-deploys)
- **develop**: Integration branch for features
- **feature/***: Individual features
- **hotfix/***: Production bug fixes

### Cross-Repository Dependencies
- Frontend depends on Backend API contracts
- Android depends on Frontend PWA functionality
- AI Service is independent but called by Backend
- Document API changes that affect multiple services

## 🔍 Monitoring & Maintenance

### Health Checks
- **Frontend**: Vercel deployment status, Lighthouse scores
- **Backend**: Render deployment status, API response times
- **AI Service**: Service availability, processing times
- **Android**: Play Store reviews, crash reports

### Update Schedule
- **Frontend**: Weekly feature updates
- **Backend**: Bi-weekly with database migrations
- **AI Service**: Monthly or as needed for AI improvements
- **Android**: Follow Play Store target SDK requirements (annual)

---

**Last Updated**: September 2024
**Architecture Type**: Microservices with Multi-Repository Setup
**Deployment Strategy**: Platform-specific auto-deployment