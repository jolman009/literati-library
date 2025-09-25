# 🚀 Literati Environment Setup Guide

Complete setup instructions for all development environments and services in the Literati Digital Library monorepo.

## 📋 **Prerequisites**

### **Required Software**
- **Node.js**: Version 20.16.0 or higher ([Download](https://nodejs.org/))
- **Python**: Version 3.8 or higher ([Download](https://python.org/))
- **pnpm**: Latest version (recommended package manager)
- **Git**: Latest version ([Download](https://git-scm.com/))

### **Required Accounts**
- **Supabase**: For database and authentication ([Sign up](https://supabase.com/))
- **Google Cloud**: For Gemini AI API ([Console](https://console.cloud.google.com/))
- **GitHub**: For version control and CI/CD
- **Vercel**: For frontend deployment (optional)
- **Render**: For backend deployment (optional)

## 🎯 **Quick Start (All Services)**

### **1. Clone and Install**
```bash
# Clone the repository
git clone https://github.com/yourusername/literati-monorepo.git
cd literati-monorepo

# Install Node.js dependencies (handles client + server)
pnpm install

# Install Python dependencies for AI service
cd ai-service
pip install -r requirements.txt
cd ..

# Verify installation
pnpm run --help
```

### **2. Environment Configuration**
```bash
# Copy environment templates
cp client2/.env.development.example client2/.env.development
cp server2/.env.example server2/.env
cp ai-service/.env.example ai-service/.env

# Edit environment files with your credentials
# (See detailed configuration below)
```

### **3. Start All Services**
```bash
# Development mode (starts all services)
pnpm run dev

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - AI Service: http://localhost:8000
```

## 🎨 **Frontend Setup (client2/)**

### **Technology Stack**
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS + Material Design 3
- **State Management**: Context API
- **PWA**: Vite PWA plugin with Workbox
- **Testing**: Jest + React Testing Library

### **Environment Configuration**

#### **Development (.env.development)**
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000

# Supabase Configuration (Development Database)
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-supabase-anon-key

# Feature Flags
VITE_ENABLE_SERVICE_WORKER=false
VITE_DEBUG_MODE=true
VITE_APP_ENV=development
```

#### **Staging (.env.staging)**
```bash
# API Configuration
VITE_API_BASE_URL=https://literati-server-staging.onrender.com
VITE_AI_SERVICE_URL=https://literati-ai-staging.onrender.com

# Supabase Configuration (Staging Database)
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-supabase-anon-key

# Feature Flags
VITE_ENABLE_SERVICE_WORKER=true
VITE_DEBUG_MODE=false
VITE_APP_ENV=staging
```

#### **Production (.env.production)**
```bash
# API Configuration
VITE_API_BASE_URL=https://library-server-m6gr.onrender.com
VITE_AI_SERVICE_URL=https://literati-ai-production.onrender.com

# Supabase Configuration (Production Database)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-supabase-anon-key

# Feature Flags
VITE_ENABLE_SERVICE_WORKER=true
VITE_DEBUG_MODE=false
VITE_APP_ENV=production

# Performance & Security
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_ENABLED=true
VITE_STRICT_MODE=true
```

### **Available Commands**
```bash
cd client2

# Development
pnpm run dev                    # Start dev server (localhost:3000)
pnpm run dev --port 3001       # Custom port

# Building
pnpm run build                  # Build for development
pnpm run build:staging          # Build for staging
pnpm run build:production       # Build for production

# Preview
pnpm run preview                # Preview dev build
pnpm run preview:staging        # Preview staging build
pnpm run preview:production     # Preview production build

# Testing
pnpm run test                   # Run unit tests
pnpm run test:coverage          # Run with coverage
pnpm run test:watch             # Watch mode
pnpm run test:e2e               # End-to-end tests

# Quality
pnpm run lint                   # ESLint
pnpm run lint:fix               # Fix linting issues
pnpm run type-check             # TypeScript checks
```

### **Key Directories**
```
client2/
├── public/             # Static assets
├── src/
│   ├── components/     # React components
│   │   ├── Material3/  # MD3 components
│   │   └── wrappers/   # Route wrappers
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── styles/         # CSS files
│   └── utils/          # Utility functions
├── .env.development    # Development config
├── .env.staging        # Staging config
├── .env.production     # Production config
└── vite.config.mjs     # Vite configuration
```

## 🔧 **Backend Setup (server2/)**

### **Technology Stack**
- **Framework**: Express.js (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with refresh tokens
- **File Storage**: Supabase Storage
- **Security**: Helmet, rate limiting, input validation

### **Environment Configuration (.env)**
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key

# JWT Security
JWT_SECRET=your-super-secure-jwt-secret-256-bits
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-256-bits

# Cookie Security (Production)
COOKIE_DOMAIN=yourdomain.com
FINGERPRINT_SALT=random-salt-for-fingerprinting

# Optional Security Features
IP_WHITELIST=127.0.0.1,::1
ENABLE_SECURITY_LOGGING=true
ENABLE_DEV_HTTPS=false

# AI Service Integration
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=30000

# File Upload Configuration
MAX_FILE_SIZE=52428800          # 50MB in bytes
ALLOWED_FILE_TYPES=pdf,epub
UPLOAD_RATE_LIMIT=20            # uploads per hour per IP
```

### **Available Commands**
```bash
cd server2

# Development
pnpm run dev                    # Start with nodemon (auto-reload)
pnpm run dev:https             # Start with HTTPS (dev certs)

# Production
pnpm run start                 # Start production server
pnpm run start:https          # Start with HTTPS

# Testing
pnpm run test                  # Run unit tests
pnpm run test:coverage         # Run with coverage
pnpm run test:watch            # Watch mode
pnpm run test:verbose          # Detailed output
pnpm run test:silent           # Minimal output

# Database
pnpm run migrate               # Run database migrations
pnpm run migrate:security      # Run security-specific migrations

# Security & SSL
pnpm run generate-dev-certs    # Generate dev SSL certificates
pnpm run https-status          # Check HTTPS configuration

# Utilities
pnpm run build                 # Build (placeholder for JS)
```

### **Key Directories**
```
server2/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── middlewares/    # Custom middleware
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic
│   └── scripts/        # Utility scripts
├── .env                # Environment variables
├── package.json        # Dependencies & scripts
└── SECURITY_DOCUMENTATION.md
```

## 🤖 **AI Service Setup (ai-service/)**

### **Technology Stack**
- **Framework**: FastAPI (Python)
- **AI**: Google Gemini 2.0 Flash
- **Server**: Uvicorn (ASGI server)

### **Environment Configuration (.env)**
```bash
# Google AI Configuration
GOOGLE_API_KEY=your-gemini-api-key

# Service Configuration
PORT=8000
ENVIRONMENT=development

# API Configuration
MAX_REQUEST_SIZE=10485760       # 10MB
REQUEST_TIMEOUT=30
CORS_ORIGINS=http://localhost:3000,http://localhost:5000

# Logging
LOG_LEVEL=INFO
ENABLE_DEBUG=true
```

### **Python Dependencies**
```bash
# Install dependencies
cd ai-service
pip install -r requirements.txt

# Development dependencies
pip install -r requirements-dev.txt    # If available

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate                # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### **Available Commands**
```bash
cd ai-service

# Development
python -m uvicorn main:app --reload --port 8000
uvicorn main:app --reload                      # Default port 8000

# Production
python -m uvicorn main:app --port 8000
uvicorn main:app --host 0.0.0.0 --port 8000   # Public access

# Testing (if test suite exists)
python -m pytest
python -m pytest --cov=src --cov-report=term-missing

# API Documentation (Auto-generated)
# Visit: http://localhost:8000/docs (Swagger UI)
# Visit: http://localhost:8000/redoc (ReDoc)
```

### **Key Files**
```
ai-service/
├── main.py             # FastAPI application entry point
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
└── src/               # Source code (if organized)
```

## 📱 **Android Setup (android/)**

### **Technology Stack**
- **Platform**: Android (Java/Kotlin)
- **Build System**: Gradle
- **UI**: Material Design 3

### **Prerequisites**
- **Android Studio**: Latest stable version
- **Java**: JDK 8 or higher
- **Android SDK**: API level 24+ (Android 7.0+)

### **Setup Steps**
```bash
# 1. Open in Android Studio
# File -> Open -> Select android/ folder

# 2. Configure Gradle (if needed)
# Edit gradle.properties with your settings

# 3. Generate signing keystore (for releases)
cd android
./generate-keystore.sh    # Linux/Mac
generate-keystore.bat     # Windows

# 4. Build project
./gradlew build           # Linux/Mac
gradlew.bat build         # Windows
```

### **Key Configuration Files**
- `build.gradle` - Main build configuration
- `gradle.properties.example` - Gradle properties template
- `generate-keystore.sh/.bat` - Keystore generation scripts

## 🔧 **Database Setup (Supabase)**

### **1. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com/) and sign up
2. Create a new project
3. Wait for database initialization (2-3 minutes)
4. Get your project URL and anon key from Settings > API

### **2. Database Schema**
Run the following SQL in Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table
CREATE TABLE public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  description TEXT,
  cover_url TEXT,
  file_path TEXT,
  file_size BIGINT,
  reading_status TEXT DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes table
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER,
  chapter TEXT,
  is_private BOOLEAN DEFAULT false,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading sessions table
CREATE TABLE public.reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  pages_read INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own books" ON public.books
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes" ON public.notes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading sessions" ON public.reading_sessions
  FOR ALL USING (auth.uid() = user_id);
```

### **3. Storage Buckets**
Create storage buckets in Supabase Dashboard:

1. **book-covers** - For book cover images
   - Public: Yes
   - File size limit: 5MB
   - Allowed types: image/jpeg, image/png, image/webp

2. **book-files** - For book content (PDF, EPUB)
   - Public: No (authenticated access only)
   - File size limit: 50MB
   - Allowed types: application/pdf, application/epub+zip

## ⚙️ **Development Workflow**

### **Starting Development**
```bash
# Terminal 1: Start all services
pnpm run dev

# Or start services individually:
# Terminal 1: Frontend
cd client2 && pnpm run dev

# Terminal 2: Backend
cd server2 && pnpm run dev

# Terminal 3: AI Service
cd ai-service && uvicorn main:app --reload
```

### **Testing Workflow**
```bash
# Run all tests
pnpm run test:all

# Run specific service tests
pnpm run test:client
pnpm run test:server
pnpm run test:ai-service

# Run E2E tests
pnpm run test:e2e
```

### **Quality Checks**
```bash
# Linting
pnpm run lint

# Type checking (if TypeScript)
cd client2 && pnpm run type-check

# Security audit
pnpm audit
npm audit
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```bash
# Check what's using ports
netstat -ano | findstr :3000      # Windows
lsof -ti:3000                     # Mac/Linux

# Kill process using port
taskkill /F /PID <PID>            # Windows
kill -9 <PID>                    # Mac/Linux
```

#### **Environment Variables Not Loading**
```bash
# Check file names (no spaces, correct extension)
ls -la client2/.env*

# Restart dev server after env changes
# Ctrl+C and restart pnpm run dev
```

#### **Database Connection Issues**
```bash
# Test Supabase connection
cd server2
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient('YOUR_URL', 'YOUR_KEY');
client.from('users').select('count').then(console.log);
"
```

#### **Python/AI Service Issues**
```bash
# Check Python version
python --version

# Reinstall dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt

# Check API key
python -e "import os; print('API Key:', os.getenv('GOOGLE_API_KEY')[:10] + '...' if os.getenv('GOOGLE_API_KEY') else 'NOT SET')"
```

### **Getting Help**
- Check the [troubleshooting guide](./TROUBLESHOOTING.md)
- Review logs in browser console and terminal
- Verify environment variables are set correctly
- Ensure all services are running on correct ports

## ✅ **Verification Checklist**

- [ ] **Node.js 20.16.0+** installed and working
- [ ] **pnpm** installed globally
- [ ] **Python 3.8+** installed and accessible
- [ ] **Supabase project** created and configured
- [ ] **Google Gemini API key** obtained
- [ ] **Environment files** configured for all services
- [ ] **Database schema** created and RLS enabled
- [ ] **Storage buckets** created with correct permissions
- [ ] **All services start** without errors
- [ ] **Frontend loads** at http://localhost:3000
- [ ] **Backend responds** at http://localhost:5000/health
- [ ] **AI service responds** at http://localhost:8000/docs
- [ ] **Database connections** working
- [ ] **Authentication flow** working
- [ ] **File uploads** working

Your Literati development environment is now ready! 🎉

---

*For deployment setup, see [DEPLOYMENT.md](./DEPLOYMENT.md)*
*For API documentation, see [API.md](./API.md)*