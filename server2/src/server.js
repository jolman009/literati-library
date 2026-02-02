// src/server.js
import 'dotenv/config';

// Import securityStore early so shutdown handlers can reference it
import { securityStore } from './services/securityStore.js';

// Add global error handlers for debugging
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  securityStore.shutdown();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  securityStore.shutdown();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received — shutting down gracefully');
  securityStore.shutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received — shutting down gracefully');
  securityStore.shutdown();
  process.exit(0);
});

// Initialize Sentry first (must be before other imports)
import { initializeSentry, setupSentryMiddleware, sentryErrorHandler } from './config/sentry.js';
initializeSentry();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { authenticateToken } from './middlewares/auth.js';
import {
  authenticateTokenEnhanced,
  generateTokens,
  verifyRefreshToken,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  validateCookieEnvironment
} from './middlewares/enhancedAuth.js';
import { securitySuite } from './middlewares/security.js';
import { validationSuite } from './middlewares/validation.js';
import { advancedSecuritySuite } from './middlewares/advancedSecurity.js';
import { rateLimitSuite, slowDownSuite } from './middlewares/rateLimitConfig.js';
import { initializeSecurity, getSecurityStatus } from './config/securityConfig.js';
import { createHTTPSServer, configureCloudHTTPS } from './config/httpsConfig.js';
import secureAuthRouter from './routes/secureAuth.js';
import { booksRouter } from './routes/books.js';
import { cloudStorageRouter } from './routes/cloudStorage.js';
import { coversRouter } from './routes/covers.js';
import { uploadCover } from './services/covers.js';
import { supabase } from './config/supabaseClient.js';
const supabaseAdmin = supabase; // Using service role key, so it has admin privileges

import { notesRouter } from './routes/notes.js';
import { readingRouter, registerLegacyReadingEndpoints } from './routes/reading.js';
import { gamificationRouter } from './routes/gamification.js';
import { challengesRouter } from './routes/challenges.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { aiRouter } from './routes/ai.js';
import guideRouter from './routes/guide.js';
import { integrityRouter } from './routes/integrity.js';
import { performanceRouter } from './routes/performance.js';
import { monitoringRouter } from './routes/monitoring.js';
import dataExportRouter from './routes/dataExport.js';
import { globalErrorHandler, asyncHandler } from './services/error-handler.js';
import { monitor } from './services/monitoring.js';

// ----- ESM __dirname shim -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- Initialize Security Configuration -----
let securityConfig;
try {
  securityConfig = initializeSecurity();
  console.log('🔒 Security configuration loaded successfully');

  // Validate cookie environment for production readiness
  validateCookieEnvironment();
} catch (error) {
  console.error('❌ Failed to load security configuration:', error.message);
  process.exit(1);
}

// ----- App -----
const app = express();
const PORT = process.env.PORT || 5000;

// ----- Cloud Platform HTTPS Configuration -----
if (process.env.NODE_ENV === 'production') {
  configureCloudHTTPS(app);
}

// ----- Trust Proxy (for accurate IP addresses behind reverse proxy) -----
app.set('trust proxy', 1);

// ----- Cookie Parser (must be early) -----
app.use(cookieParser());

// ----- Sentry Request Handling (must be early) -----
setupSentryMiddleware(app);

// ----- Security Headers (must be first) -----
app.use(securitySuite.headers);

// ----- Body Parser (must be before sanitization) -----
// ✅ MEMORY FIX: Reduced from 10mb to 2mb to prevent memory spikes
// Notes, sessions, and most API data are typically <100kb
// File uploads use multipart/form-data (handled separately by multer)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ----- Request Logging -----
app.use(securitySuite.logging);

// ----- Security Utilities -----
app.use(securitySuite.utils.addRequestId);
app.use(securitySuite.utils.sanitizeHeaders);

// ----- Advanced Security Middleware -----
app.use(advancedSecuritySuite.sanitization.deep);
app.use(advancedSecuritySuite.sanitization.sqlInjection);
app.use(advancedSecuritySuite.sanitization.noSQLInjection);
app.use(advancedSecuritySuite.monitoring.suspicious);

// ----- Additional Security -----
app.use(mongoSanitize()); // Remove any keys that start with '$' or contain '.'
app.use((req, res, next) => {
  // XSS protection for string fields
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
});

// ----- Rate Limiting & Slow Down (Production-Ready) -----
// General rate limiting for all endpoints
app.use(rateLimitSuite.general);
// General slow down to prevent abuse
app.use(slowDownSuite.general);

// ----- CORS (must be before routes) -----
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Allow all localhost ports for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // ✅ FIX: Allow ALL Vercel preview deployments (they have dynamic URLs)
    if (origin && origin.includes('.vercel.app')) {
      console.log(`✅ CORS allowed for Vercel deployment: ${origin}`);
      return callback(null, true);
    }

    // Allow production domains from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];

    // ✅ Production domains (static URLs only)
    const defaultAllowedOrigins = [
      'https://shelfquest.org',
      'https://www.shelfquest.org',
    ];

    const allAllowed = [...new Set([...allowedOrigins, ...defaultAllowedOrigins])];

    if (allAllowed.includes(origin)) {
      console.log(`✅ CORS allowed for production domain: ${origin}`);
      return callback(null, true);
    }

    console.warn(`❌ CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // ✅ CRITICAL - allows cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Environment',  // Custom header for environment tracking
    'X-Client-Version',  // Additional custom header support
    'X-App-Version'  // Application version tracking
  ]
}));

// ----- Protected Routes with specific rate limiting -----
// Authentication endpoints with strict rate limiting + slow down
app.use('/api/auth', rateLimitSuite.auth, slowDownSuite.auth);
// Other protected routes
app.use('/notes', notesRouter(authenticateTokenEnhanced));
app.use('/api/reading', readingRouter(authenticateTokenEnhanced));
// Gamification endpoints with specialized rate limiting
app.use('/api/gamification', rateLimitSuite.gamification, gamificationRouter(authenticateTokenEnhanced));
// Challenges system (daily/weekly challenges)
app.use('/api/challenges', rateLimitSuite.gamification, challengesRouter(authenticateTokenEnhanced));
// Leaderboard system (rankings, social features)
app.use('/api/leaderboard', rateLimitSuite.gamification, leaderboardRouter(authenticateTokenEnhanced));

// In-app Guide Assistant (rate limited like general API)
app.use('/api/guide', rateLimitSuite.api, slowDownSuite.general, guideRouter(authenticateTokenEnhanced));

// Play Integrity API verification (for Android app)
app.use('/api/integrity', rateLimitSuite.api, integrityRouter(authenticateTokenEnhanced));

// Optional: preserve your older client that calls POST /api/reading-session
registerLegacyReadingEndpoints(app, authenticateTokenEnhanced);



// Static (OK in ESM with shim)
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public')));

// ----- Multer (memory) -----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['application/pdf','application/epub+zip','application/epub'].includes(file.mimetype);
    return ok ? cb(null, true) : cb(new Error('Only PDF and EPUB files are allowed'), false);
  },
});

// ----- Health -----
const handleHealthCheck = (req, res) => {
  res.json({
    status: 'online',
    message: 'ShelfQuest API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    corsFixed: true  // Deployment verification flag
  });
};

app.get('/', handleHealthCheck);
app.get('/health', handleHealthCheck);
app.head('/', (_req, res) => res.sendStatus(200));
app.head('/health', (_req, res) => res.sendStatus(200));

// CORS Debug endpoint - helps verify allowed origins
app.get('/cors-test', (req, res) => {
  res.json({
    origin: req.headers.origin,
    allowedOrigins: [
      'https://shelfquest.org',
      'https://www.shelfquest.org',
      'https://client2-o2l1nijre-joel-guzmans-projects-f8aa100e.vercel.app',
      'localhost (all ports)'
    ],
    corsEnabled: true,
    timestamp: new Date().toISOString()
  });
});

// ----- Enhanced Authentication Routes -----
app.use('/auth/secure', secureAuthRouter);

// ----- API Routers (namespaced) -----
app.use('/books', booksRouter(authenticateTokenEnhanced));
app.use('/api/cloud-storage', cloudStorageRouter(authenticateTokenEnhanced));
app.use('/api/performance', performanceRouter(authenticateTokenEnhanced));
app.use('/api/monitoring', monitoringRouter(authenticateTokenEnhanced));
app.use('/covers', coversRouter(authenticateTokenEnhanced));
app.use('/ai', aiRouter(authenticateTokenEnhanced));
app.use('/api/data-export', dataExportRouter(authenticateTokenEnhanced));

// ----- Auth (kept minimal here; admin client bypasses RLS as intended) -----
app.post('/auth/register', async (req, res) => {
  try {
    const normalizedEmail = req.body?.email?.trim().toLowerCase();
    const name = req.body?.name?.trim();
    const { password } = req.body || {};

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // exists?
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // hash + create
    const { default: bcrypt } = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ email: normalizedEmail, password: hashedPassword, name, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return res.status(500).json({ error: 'Failed to create user' });

    const { accessToken, refreshToken } = generateTokens(user);

    await supabaseAdmin.from('user_stats').insert({
      user_id: user.id, total_points: 0, level: 1, books_read: 0, pages_read: 0,
      total_reading_time: 0, reading_streak: 0, notes_created: 0, highlights_created: 0, books_completed: 0
    });

    // Set tokens as HttpOnly cookies (production-ready security)
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Also return tokens in response body for backward compatibility
    // TODO: Remove token/refreshToken from response once frontend migrates to cookies
    res.status(201).json({
      message: 'User created successfully',
      token: accessToken,  // Deprecated - use cookies instead
      refreshToken,  // Deprecated - use cookies instead
      user: { id: user.id, email: user.email, name: user.name },
      cookieAuth: true  // Flag to indicate cookies are being used
    });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { default: bcrypt } = await import('bcryptjs');

    const email = req.body?.email?.trim().toLowerCase();
    const { password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user);

    // Set tokens as HttpOnly cookies (production-ready security)
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Also return tokens in response body for backward compatibility
    // TODO: Remove token/refreshToken from response once frontend migrates to cookies
    res.json({
      message: 'Login successful',
      token: accessToken,  // Deprecated - use cookies instead
      refreshToken,  // Deprecated - use cookies instead
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
      cookieAuth: true  // Flag to indicate cookies are being used
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    // Try to get refresh token from cookie first (preferred), then fall back to body (deprecated)
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token using the proper enhanced auth function
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens using the proper enhanced auth function
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Set new tokens as HttpOnly cookies (production-ready security)
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    // Also return tokens in response body for backward compatibility
    // TODO: Remove token/refreshToken from response once frontend migrates to cookies
    res.json({
      message: 'Tokens refreshed successfully',
      token: accessToken,  // Deprecated - use cookies instead
      refreshToken: newRefreshToken,  // Deprecated - use cookies instead
      user,
      cookieAuth: true  // Flag to indicate cookies are being used
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

app.post('/auth/logout', (req, res) => {
  try {
    // Clear both access and refresh token cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth'
    });

    res.json({
      message: 'Logout successful',
      cookiesCleared: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/auth/profile', authenticateTokenEnhanced, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, avatar, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    console.error('Profile fetch error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----- Book cover upload with enhanced security -----
app.post('/books/:id/cover',
  authenticateTokenEnhanced,
  rateLimitSuite.upload,  // Updated to use new rate limit config
  advancedSecuritySuite.fileUpload.secure,
  upload.single('file'),
  validationSuite.files.upload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          code: 'NO_FILE',
          requestId: req.requestId
        });
      }

      const { publicUrl } = await uploadCover(
        req.user.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      const { error } = await supabase
        .from('books')
        .update({ cover_url: publicUrl })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id); // Ensure user owns the book

      if (error) {
        console.error('Cover update error:', error);
        return res.status(500).json({
          error: 'Failed to update book cover',
          code: 'UPDATE_FAILED',
          requestId: req.requestId
        });
      }

      // Log successful upload
      console.log(`Cover uploaded successfully for book ${req.params.id} by user ${req.user.id} from IP: ${req.ip}`);

      res.json({
        message: 'Cover uploaded successfully',
        cover_url: publicUrl
      });

    } catch (err) {
      console.error('Cover upload error:', err);
      res.status(500).json({
        error: 'Cover upload failed',
        code: 'UPLOAD_ERROR',
        requestId: req.requestId
      });
    }
  }
);

// ----- Security Status Endpoint -----
app.get('/security-status', (req, res) => {
  const status = getSecurityStatus();
  res.status(200).json(status);
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// ----- Sentry Error Handler (must be before other error handlers) -----
app.use(sentryErrorHandler);

// ----- Security Error Handler -----
app.use(securitySuite.errorHandler);

// ----- Enhanced Global Error Handler -----
app.use(globalErrorHandler);

app.use('*', (req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId
  });
});
// relook at this ----
// ----- Start Server with HTTPS Support -----
const serverConfig = createHTTPSServer(app, {
  port: PORT,
  httpsPort: process.env.HTTPS_PORT || 5443
});

// Initialize persistent security state before accepting requests
securityStore.initialize().then(() => serverConfig.start()).then((result) => {
  console.log('✅ Server startup complete');
  console.log(`🔗 Protocol: ${result.protocol}`);
  if (result.httpsServer) {
    console.log(`🔒 HTTPS: https://localhost:${result.port}`);
    console.log(`📡 HTTP Redirect: http://localhost:${result.httpPort}`);
  } else {
    console.log(`📡 Server: ${result.protocol}://localhost:${result.port}`);
  }
}).catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
