# Literati Digital Library

A modern, full-stack digital library application built with React, Express.js, and AI-powered features. Literati allows users to manage their personal book collections, track reading progress, take notes, and get AI-powered summaries.

## 🏗️ Architecture

This unified monorepo contains four main services managed with a single CI/CD pipeline:

### 🎨 Client (client2/)
- **Stack**: React 19 + Vite + Tailwind CSS + Material Design 3
- **Features**: PWA support, offline reading, book management, note-taking
- **Port**: 3000 (dev), 5174 (preview)

### 🔧 Server (server2/)
- **Stack**: Express.js + Supabase + JWT Authentication
- **Features**: REST API, file uploads, user management, gamification
- **Port**: 5000

### 🤖 AI Service (ai-service/)
- **Stack**: FastAPI + Google Gemini API
- **Features**: AI-powered note summarization
- **Port**: 8000

### 📱 Android App (android/)
- **Stack**: Android (Java/Kotlin) + Material Design
- **Features**: Mobile reading app, offline sync, touch-optimized interface
- **Build**: Gradle build system

## 🚀 Quick Start

### Prerequisites
- Node.js 20.16.0+
- pnpm (recommended package manager)
- Python 3.8+ (for AI service)
- Supabase account and project

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/yourusername/literati-digital-library.git
cd my-library-app-2

# Install root dependencies
pnpm install

# Install client dependencies
cd client2
pnpm install

# Install server dependencies
cd ../server2
pnpm install

# Set up AI service (optional)
cd ../ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment files and configure them:

```bash
# Client environment
cp .env.example client2/.env

# Server environment
cp .env.example server2/.env

# AI service environment (optional)
cp .env.example ai-service/.env
```

**Client (.env)**:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Server (.env)**:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
```

**AI Service (.env)** (optional):
```env
GOOGLE_API_KEY=your_gemini_api_key
```

### 3. Start Development Servers

```bash
# Start all services concurrently
pnpm run dev        # Starts client, server, and AI service

# Or start individually:
cd client2 && pnpm run dev      # Client on :3000
cd server2 && pnpm run dev      # Server on :5000
cd ai-service && uvicorn main:app --reload --port 8000  # AI service on :8000
```

## 📱 Features

### Core Features
- 📚 **Digital Library Management**: Upload, organize, and manage book collections
- 📖 **Multi-format Reader**: Support for EPUB and PDF files
- 📝 **Note-taking System**: Take notes while reading with AI-powered summarization
- ⏱️ **Reading Session Tracking**: Track reading time and progress
- 🎯 **Gamification**: Achievements and reading goals system
- 🔐 **User Authentication**: Secure JWT-based authentication
- 📱 **Progressive Web App**: Install and use offline

### Technical Features
- 🎨 **Material Design 3**: Modern, adaptive UI design
- 🌙 **Dark/Light Themes**: Automatic theme switching
- 📱 **Responsive Design**: Works on mobile, tablet, and desktop
- 🔄 **Offline Support**: Service worker for offline functionality
- 🚀 **Performance Optimized**: Code splitting and lazy loading
- 🧪 **Comprehensive Testing**: Unit, integration, and E2E tests

## 🛠️ Development Commands

### Client (client2/)
```bash
pnpm run dev          # Development server
pnpm run build        # Production build
pnpm run preview      # Preview production build
pnpm run test         # Run tests
pnpm run test:e2e     # Run E2E tests
pnpm run lint         # Lint code
```

### Server (server2/)
```bash
pnpm run dev          # Development server with hot reload
pnpm run start        # Production server
pnpm run test         # Run tests
pnpm run test:coverage # Test with coverage
```

### AI Service (ai-service/)
```bash
uvicorn main:app --reload --port 8000  # Development server
```

## 📊 Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- **users**: User accounts and profiles
- **books**: Book metadata and ownership
- **notes**: User notes with AI summaries
- **reading_sessions**: Reading time tracking
- **achievements**: Gamification system
- **goals**: User reading goals

## 🐳 Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
docker-compose -f docker-compose.production.yml up --build
```

## 🧪 Testing

### Unit Tests
```bash
cd client2
pnpm run test              # Run all tests
pnpm run test:coverage     # Run with coverage report
pnpm run test:ui           # Interactive test UI
```

### End-to-End Tests
```bash
cd client2
pnpm run test:e2e          # Run E2E tests
pnpm run test:e2e:headed   # Run with browser UI
```

### Integration Tests
```bash
cd server2
pnpm run test              # API integration tests
```

## 📦 Build and Deployment

### Client Build
```bash
cd client2
pnpm run build
```
Outputs to `client2/dist/`

### Server Build
The server runs directly from source in Node.js.

### Production Deployment
The application is configured for deployment on:
- **Vercel** (client)
- **Railway/Render** (server)
- **Supabase** (database)

See `vercel.json` and Docker configurations for deployment settings.

## 🔧 Configuration Files

- `vite.config.mjs` - Vite build configuration
- `playwright.config.js` - E2E testing configuration
- `docker-compose.yml` - Local development containers
- `vercel.json` - Vercel deployment configuration
- `CLAUDE.md` - Development guidelines and commands

## 📚 Key Dependencies

### Client
- React 19 + React Router v7
- Vite (build tool)
- Tailwind CSS + Material Design 3
- Supabase client
- PDF.js & EPUB.js (readers)
- Vitest (testing)
- Playwright (E2E testing)

### Server
- Express.js
- Supabase (database & auth)
- JWT authentication
- Multer (file uploads)
- Jest (testing)

### AI Service
- FastAPI
- Google Gemini API
- Uvicorn (ASGI server)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Documentation

- [Development Checklist](Literati_Development_Checklist.md)
- [Production Readiness](PRODUCTION_READINESS_SUMMARY.md)
- [Testing Guide](TESTING.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Performance Reports](PERFORMANCE-REPORT.md)