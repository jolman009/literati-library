# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ShelfQuest is a full-stack digital library application with AI-powered features. The repository is organized as a **pnpm workspace monorepo** with three main services:

- **client2/**: React 19 + Vite frontend (PWA)
- **server2/**: Express.js backend API
- **ai-service/**: FastAPI service for AI summarization (Google Gemini)

All services share a single database (Supabase/PostgreSQL) and are coordinated through a unified CI/CD pipeline.

## Essential Commands

### Development Setup

**First-time setup:**
```powershell
# Install all dependencies (client, server, and Python deps)
pnpm run install:all

# Install test dependencies
pnpm run install:test-deps
```

**Environment configuration:**
- Copy `.env.example` to `.env.local` (root), `client2/.env`, and `server2/.env`
- Required variables are documented in `.env.example`
- Client variables MUST be prefixed with `VITE_`

### Running Services

**All services concurrently (recommended for full-stack development):**
```powershell
pnpm run dev  # Starts client:3000, server:5000, ai-service:8000
```

**Individual services:**
```powershell
# Client (React dev server with HMR)
cd client2
pnpm run dev  # Port 3000

# Server (with nodemon hot reload)
cd server2
pnpm run dev  # Port 5000

# AI Service (Python FastAPI with uvicorn)
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

### Testing

**Run all tests:**
```powershell
pnpm run test:all  # Runs client, server, and AI service tests with coverage
```

**Client tests (Vitest):**
```powershell
cd client2
pnpm run test              # Run once
pnpm run test:watch        # Watch mode
pnpm run test:coverage     # With coverage report
pnpm run test:ui           # Interactive UI
```

**Client E2E tests (Playwright):**
```powershell
cd client2
pnpm run test:e2e          # Headless mode
pnpm run test:e2e:headed   # With browser UI
pnpm run test:e2e:debug    # Debug mode
```

**Server tests (Jest):**
```powershell
cd server2
pnpm run test              # Run once
pnpm run test:watch        # Watch mode
pnpm run test:coverage     # With coverage report
```

**AI Service tests (pytest):**
```powershell
cd ai-service
python -m pytest --cov=src --cov-report=term-missing
```

### Linting & Code Quality

**Client:**
```powershell
cd client2
pnpm run lint          # ESLint with max 200 warnings
pnpm run lint:strict   # ESLint with 0 warnings
pnpm run lint:css      # Stylelint for CSS files
pnpm run lint:css:fix  # Auto-fix CSS issues
```

**Server:**
The server does not have a separate lint command. Code quality is enforced through Jest tests.

### Building

**Client:**
```powershell
cd client2
pnpm run build                # Production build (outputs to dist/)
pnpm run build:staging        # Staging environment build
pnpm run build:production     # Production environment build
pnpm run preview              # Preview production build on port 5174
```

**Server:**
The server runs directly from source (no build step required).

**AI Service:**
The AI service runs directly from source (no build step required).

### iOS/Mobile Development (Capacitor)

```powershell
cd client2
pnpm run ios:build   # Build and sync to iOS
pnpm run ios:open    # Open in Xcode
pnpm run ios:run     # Build, sync, and run on simulator/device
```

## Architecture & Code Structure

### Authentication Flow

**Token Management:**
- Uses **HttpOnly cookies** for both access and refresh tokens (primary mechanism)
- Access tokens stored in cookies: `shelfquest_access_token`
- Refresh tokens stored in cookies: `shelfquest_refresh_token`
- Fallback: localStorage tokens for backward compatibility and header-based auth
- All API requests include `credentials: 'include'` to send cookies automatically

**AuthContext (client2/src/contexts/AuthContext.jsx):**
- Centralized authentication state management
- Implements mutex pattern for token refresh to prevent concurrent refreshes
- `makeApiCall`: base fetch wrapper with cookie-based auth
- `attemptTokenRefresh`: handles token refresh via `/auth/refresh` endpoint
- `makeAuthenticatedApiCall`: wraps API calls with automatic token refresh on 401

**Server Auth Middleware:**
- `authenticateToken` (legacy): checks Authorization header
- `authenticateTokenEnhanced` (recommended): checks both cookies and Authorization header
- Enhanced middleware is used for all protected routes in `server2/src/server.js`

### Client Architecture (client2/)

**Key Directories:**
- `src/components/`: React components (Material Design 3 based)
- `src/pages/`: Route-level page components
- `src/contexts/`: React Context providers (AuthContext, SnackbarContext, etc.)
- `src/hooks/`: Custom React hooks
- `src/api/`: API client functions
- `src/services/`: Business logic and external integrations
- `src/utils/`: Utility functions
- `src/config/`: Configuration files (Supabase client, environment)
- `src/design-tokens/`: Material Design 3 theme tokens

**State Management:**
- React Context API for global state (auth, snackbar, theme)
- Local component state with useState/useReducer
- No Redux or external state library

**Routing:**
- React Router v7 (react-router-dom)
- Route definitions in `src/App.jsx`

**API Communication:**
- Base URL configured via `VITE_API_BASE_URL` environment variable
- Uses `src/config/environment.js` for centralized environment configuration
- Cookie-based authentication with `credentials: 'include'`

### Server Architecture (server2/)

**Key Directories:**
- `src/routes/`: Express route handlers
- `src/middlewares/`: Authentication, security, validation, rate limiting
- `src/services/`: Business logic (covers, error handling, monitoring)
- `src/config/`: Configuration (Supabase, security, HTTPS, Sentry)
- `src/utils/`: Utility functions
- `src/migrations/`: Database migration scripts
- `src/tests/`: Integration tests

**Main API Routes (see server2/src/server.js):**
- `/api/auth` - Authentication endpoints (login, register, refresh)
- `/notes` - Note management with AI summarization
- `/api/reading` - Reading session tracking
- `/api/gamification` - Achievements and goals system
- `/api/challenges` - Reading challenges
- `/api/leaderboard` - Leaderboard rankings
- `/api/ai` - AI service proxy
- `/api/books` - Book management and CRUD
- `/api/cloud-storage` - Google Drive integration
- `/api/covers` - Book cover upload and management

**Security Middleware (order matters):**
1. Sentry initialization (must be first)
2. Security headers (`securitySuite.headers`)
3. Body parser (2mb limit)
4. Request logging
5. Advanced sanitization (deep, SQL injection, NoSQL injection)
6. Rate limiting and slow down
7. CORS (allows Vercel deployments and production domains)

**Rate Limiting:**
- General: 100 requests per 15 minutes
- Auth endpoints: Stricter limits (10 requests per 15 minutes)
- Gamification: 50 requests per 15 minutes
- Slow down middleware progressively delays responses

### AI Service Architecture (ai-service/)

**Main Files:**
- `main.py`: FastAPI application with `/summarize-note` endpoint
- `config/sentry_config.py`: Sentry integration for error tracking
- `requirements.txt`: Python dependencies (FastAPI, google-generativeai)

**API Endpoint:**
- `POST /summarize-note`: Accepts note text, returns AI-generated summary
- Uses Google Gemini API (`gemini-2.0-flash` model)
- Requires `GOOGLE_API_KEY` environment variable

**CORS Configuration:**
- Allows localhost development ports (3000, 5173, 5000)
- Production domains: `shelfquest.app`

### Database (Supabase)

**Client Configuration:**
- `client2/src/config/supabaseClient.js`: Supabase client with auth persistence
- Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Server Configuration:**
- `server2/src/config/supabaseClient.js`: Supabase admin client
- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (service role key)

**Main Tables:**
- `users`: User accounts and profiles
- `books`: Book metadata and ownership
- `notes`: User notes with AI summaries
- `reading_sessions`: Reading time tracking
- `achievements`: Gamification achievements
- `goals`: User reading goals

## Important Development Notes

### PNPM Workspace

This is a **pnpm workspace** project. Always use `pnpm` instead of `npm` or `yarn`:
- The root `package.json` enforces pnpm via preinstall script
- Workspace packages: client2, server2, ai-service
- Shared dependencies are hoisted to root `node_modules`

### Environment Variables

**Client (Vite):**
- Must be prefixed with `VITE_` to be exposed to client code
- Accessed via `import.meta.env.VITE_VARIABLE_NAME`
- Fail-fast validation in `supabaseClient.js` ensures variables are set

**Server:**
- Standard Node.js environment variables
- Loaded via `dotenv/config` at the top of `server.js`

**Windows Development:**
- Use PowerShell commands for file operations
- Path separators are `\` not `/`
- Python virtual environment activation: `venv\Scripts\activate`

### Testing Strategy

**Client (Vitest):**
- Unit tests: `src/**/*.test.jsx`
- Integration tests: `src/**/*.integration.test.jsx`
- Test projects configured in `vitest.config.js`
- Uses `jsdom` environment and `@testing-library/react`

**Client (Playwright):**
- E2E tests in `tests/e2e/`
- Multiple browser support (Chromium, Firefox, WebKit)
- Staging and production configs in `config/`

**Server (Jest):**
- Tests in `src/tests/` and `src/**/*.test.js`
- Uses `supertest` for HTTP testing
- Node environment with 10s timeout

### Security Considerations

**HttpOnly Cookies:**
- Access and refresh tokens are stored in HttpOnly cookies
- Cookies are set by server with `Secure`, `HttpOnly`, `SameSite=None` flags
- Production requires HTTPS for secure cookies

**Cookie Environment Validation:**
- `validateCookieEnvironment()` in `server2/src/middlewares/enhancedAuth.js`
- Warns if production mode without HTTPS (cookies won't work)

**CORS Configuration:**
- Server allows all `.vercel.app` domains for preview deployments
- Production domains: `shelfquest.org`, `www.shelfquest.org`
- Always includes `credentials: true` to allow cookies

### Performance & Optimization

**Client:**
- Code splitting and lazy loading (React.lazy)
- PWA with service worker for offline support
- Vite bundle optimization with rollup-plugin-visualizer

**Server:**
- Memory limit: JSON body parser set to 2mb (reduced from 10mb)
- File uploads handled separately by multer
- Request logging with Morgan
- Monitoring with Prometheus metrics

### Error Handling & Monitoring

**Sentry Integration:**
- Client: `@sentry/react` for error tracking and performance monitoring
- Server: `@sentry/node` with profiling
- AI Service: Custom Sentry integration in `config/sentry_config.py`

**Server Error Handling:**
- Global error handler in `services/error-handler.js`
- Async wrapper: `asyncHandler` for route handlers
- Sentry middleware captures all errors

## Common Development Tasks

### Adding a New API Endpoint

1. Create route handler in `server2/src/routes/[feature].js`
2. Add authentication middleware: `authenticateTokenEnhanced`
3. Register route in `server2/src/server.js`
4. Add client API function in `client2/src/api/[feature].js`
5. Write tests in both client and server

### Running Database Migrations

```powershell
cd server2
pnpm run migrate
```

### Generating Dev SSL Certificates (for HTTPS development)

```powershell
cd server2
pnpm run generate-dev-certs
pnpm run dev:https
```

### Docker Deployment

**Development:**
```powershell
docker-compose up --build
```

**Production:**
```powershell
docker-compose -f docker-compose.production.yml up --build
```

### iOS Build and Deploy

```powershell
cd client2
pnpm run build
pnpm run cap:sync:ios
pnpm run cap:open:ios
# Build and deploy from Xcode
```

## Dependencies & Version Requirements

- **Node.js**: >= 22.19.0 (specified in root package.json)
- **pnpm**: 8.15.6 (enforced via packageManager field)
- **Python**: 3.8+ (for AI service)
- **Supabase**: PostgreSQL database and auth service

**Key Client Dependencies:**
- React 19.2.1, React Router v7.10.1
- Vite 7.2.6
- Supabase client 2.86.2
- PDF.js 5.3.93, EPUB.js 0.3.93
- Vitest 3.2.4, Playwright 1.57.0

**Key Server Dependencies:**
- Express 4.22.1
- Supabase 2.86.2
- JWT, bcryptjs (authentication)
- Multer (file uploads)
- Jest 30.2.0

**Key AI Service Dependencies:**
- FastAPI
- google-generativeai (Gemini API)
- uvicorn (ASGI server)

## Deployment Targets

- **Client**: Vercel (static site deployment)
- **Server**: Railway or Render (Node.js hosting)
- **AI Service**: Docker container on cloud platform
- **Database**: Supabase (managed PostgreSQL)
- **iOS**: App Store (via Capacitor)
- **Android**: Google Play (Java/Kotlin app in `android/`)
