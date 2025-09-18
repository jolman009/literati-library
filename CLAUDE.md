# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Client (React/Vite)
## Current problem
#   Current Build Setup Analysis

  Here's the current package manager situation:

  ★ Insight ─────────────────────────────────────
  The project has a hybrid setup: locally you're using pnpm for development (as shown by the running pnpm preview
  commands), but Vercel deployment is configured for npm. This mismatch is causing the deployment failures because
  Vercel still detects pnpm artifacts and tries to use pnpm despite the npm configuration.
  ─────────────────────────────────────────────────

  Local Development:
  - ✅ pnpm - You have pnpm installed and working
  - ✅ npm - Also available as fallback
  - 🔄 Currently running: pnpm run preview (3 instances)
  - 📁 node_modules exists (installed with pnpm)

  Vercel Deployment Configuration:
  - 📝 vercel.json specifies: "cd client2 && npm install && npm run build"
  - ❌ Problem: Vercel was still trying to use pnpm (as shown in error logs)
  - ✅ Fixed: Removed client2/pnpm-workspace.yaml that was forcing pnpm detection

  The Issue:
  The Vercel error logs show Command "cd client2 && pnpm install" exited with 1, which means Vercel ignored our npm
  configuration in vercel.json and detected the project as pnpm-based due to the workspace file.

  
```bash
# Navigate to client
cd client2

# Install dependencies
npm install

# Development server
npm run dev        # or npm start - runs on http://localhost:3000

# Production build
npm run build

# Preview production build
npm run preview
```

### Server (Express/Supabase)
```bash
# Navigate to server
cd server2

# Install dependencies
npm install

# Development server with hot reload
npm run dev       # uses --watch flag

# Production server
npm start
```

### AI Service (FastAPI/Gemini)
```bash
# Navigate to AI service
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn main:app --reload --port 8000
```

## Architecture Overview

This is a full-stack digital library application with three main components:

### 1. Client (client2/)
- **Stack**: React 19, Vite, Tailwind CSS, Material Design 3
- **State Management**: Context API with multiple providers (Auth, Gamification, Theme, Reading Session)
- **Routing**: React Router v7 with lazy loading for secondary pages
- **PWA**: Progressive Web App with service worker, offline support, and install prompt
- **Key Features**:
  - Book library management with upload support
  - Reading session tracking with timer
  - Note-taking system with AI summarization
  - Gamification system (achievements, goals)
  - Material Design 3 theming
  - EPUB and PDF reader support

### 2. Server (server2/)
- **Stack**: Express.js, Supabase (database & auth), JWT authentication
- **Database**: Supabase (PostgreSQL) for users, books, notes, reading sessions
- **Storage**: Supabase Storage for book covers and files
- **Routes**:
  - `/auth/*` - Authentication endpoints (signup, login, refresh)
  - `/books/*` - Book CRUD operations
  - `/covers/*` - Cover image upload and management
  - `/notes/*` - Note-taking functionality
  - `/reading/*` - Reading session tracking
  - `/gamification/*` - Achievements and goals
- **Middleware**: JWT authentication on protected routes
- **CORS**: Configured for localhost and production domains

### 3. AI Service (ai-service/)
- **Stack**: FastAPI, Google Gemini API
- **Purpose**: Note summarization using Gemini 2.0 Flash model
- **Endpoint**: `/summarize-note` - Accepts text and returns AI-generated summary

## Environment Configuration

### Client (.env)
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server (.env)
```
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
```

### AI Service (.env)
```
GOOGLE_API_KEY=your_gemini_api_key
```

## Key Design Patterns

### Component Organization
- **Wrappers**: Page components wrapped for routing (`/components/wrappers/`)
- **Material3 Components**: Custom MD3 implementations (`/components/Material3/`)
- **Context Providers**: Centralized state management (`/contexts/`)
- **Hooks**: Reusable logic (`/hooks/`)

### Authentication Flow
- JWT-based authentication with refresh tokens
- Tokens stored in localStorage
- Auto-refresh mechanism in AuthContext
- Protected routes using authentication middleware

### API Communication
- Client uses Axios for HTTP requests
- Bearer token authentication
- Centralized API configuration in `/config/api.js`
- Error handling with user-friendly messages

### Styling Architecture
- Tailwind CSS for utility-first styling
- Material Design 3 tokens in `/design-tokens/material3.js`
- Component-specific CSS modules
- Global styles organized by feature (gamification, dashboard, etc.)

## Database Schema (Supabase)

Key tables:
- `users` - User accounts and profiles
- `books` - Book metadata and ownership
- `notes` - User notes on books
- `reading_sessions` - Reading time tracking
- `achievements` - Gamification achievements
- `goals` - Reading goals

## Testing

Currently minimal test coverage. Tests can be run with:
```bash
cd client2
npm test  # Note: No test script defined, would need configuration
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create route handler in `server2/src/routes/`
2. Add to server.js with authentication middleware if needed
3. Update client API calls in relevant components
4. Add to CORS allowlist if new domain

### Creating a New Page
1. Create page component in `client2/src/pages/`
2. Create wrapper in `client2/src/components/wrappers/`
3. Add lazy loading in App.jsx
4. Add route to Routes configuration

### Modifying Theme
1. Update Material3 tokens in `/design-tokens/material3.js`
2. Modify CSS variables in `/styles/md3-tokens.css`
3. Update Material3ThemeContext if needed
- reference the Literati Development Checklist to guide the development
- revisit Collections page for functionality
- Always use pnpm