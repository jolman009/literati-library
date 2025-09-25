// src/routes/secureAuth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient.js';
import {
  generateTokens,
  authenticateTokenEnhanced,
  handleTokenRefresh,
  handleLogout,
  COOKIE_OPTIONS,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS
} from '../middlewares/enhancedAuth.js';
import { advancedSecuritySuite } from '../middlewares/advancedSecurity.js';
import { validationSuite } from '../middleware/validation.js';

const router = express.Router();

// Apply security middleware to all auth routes
router.use(advancedSecuritySuite.sanitization.deep);
router.use(advancedSecuritySuite.sanitization.sqlInjection);
router.use(advancedSecuritySuite.sanitization.noSQLInjection);
router.use(advancedSecuritySuite.monitoring.suspicious);

// Account lockout tracking (in production, use Redis or database)
const loginAttempts = new Map();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Check if account is locked out
 */
const isAccountLocked = (identifier) => {
  const attempts = loginAttempts.get(identifier);
  if (!attempts) return false;

  if (attempts.count >= LOCKOUT_THRESHOLD) {
    if (Date.now() - attempts.lastAttempt < LOCKOUT_DURATION) {
      return true;
    } else {
      // Reset after lockout period
      loginAttempts.delete(identifier);
      return false;
    }
  }
  return false;
};

/**
 * Record failed login attempt
 */
const recordFailedAttempt = (identifier) => {
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(identifier, attempts);
};

/**
 * Clear failed attempts on successful login
 */
const clearFailedAttempts = (identifier) => {
  loginAttempts.delete(identifier);
};

// =====================================================
// Authentication Routes
// =====================================================

/**
 * Register new user with enhanced security
 */
router.post('/register',
  advancedSecuritySuite.rateLimit.sensitive,
  advancedSecuritySuite.password.validate,
  validationSuite.auth.signup,
  async (req, res) => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          code: 'USER_EXISTS',
          requestId: req.requestId
        });
      }

      // Hash password with strong settings
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with security fields
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name.trim(),
          is_active: true,
          token_version: 0,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        })
        .select('id, email, name')
        .single();

      if (error) {
        console.error('User creation error:', error);
        return res.status(500).json({
          error: 'Failed to create user',
          code: 'USER_CREATION_FAILED',
          requestId: req.requestId
        });
      }

      // Initialize user stats
      await supabase.from('user_stats').insert({
        user_id: user.id,
        total_points: 0,
        level: 1,
        books_read: 0,
        pages_read: 0,
        total_reading_time: 0,
        reading_streak: 0,
        notes_created: 0,
        highlights_created: 0,
        books_completed: 0
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set secure cookies with enhanced security options
      res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      // Log successful registration
      console.log(`User registered successfully: ${user.email} from IP: ${req.ip}`);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        accessToken // Also return for clients that prefer headers
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: req.requestId
      });
    }
  }
);

/**
 * Login with enhanced security
 */
router.post('/login',
  advancedSecuritySuite.rateLimit.adaptive,
  validationSuite.auth.login,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const identifier = email.toLowerCase();

      // Check account lockout
      if (isAccountLocked(identifier)) {
        return res.status(429).json({
          error: 'Account temporarily locked due to too many failed attempts',
          code: 'ACCOUNT_LOCKED',
          retryAfter: '15 minutes',
          requestId: req.requestId
        });
      }

      // Find user
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, password, is_active, token_version, last_login')
        .eq('email', identifier)
        .single();

      if (error || !user) {
        recordFailedAttempt(identifier);
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          requestId: req.requestId
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(401).json({
          error: 'Account has been deactivated',
          code: 'ACCOUNT_DEACTIVATED',
          requestId: req.requestId
        });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        recordFailedAttempt(identifier);
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
          requestId: req.requestId
        });
      }

      // Clear failed attempts
      clearFailedAttempts(identifier);

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set secure cookies with enhanced security options
      res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      // Log successful login
      console.log(`User logged in successfully: ${user.email} from IP: ${req.ip}`);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastLogin: user.last_login
        },
        accessToken // Also return for clients that prefer headers
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: req.requestId
      });
    }
  }
);

/**
 * Refresh tokens
 */
router.post('/refresh', handleTokenRefresh);

/**
 * Logout
 */
router.post('/logout', authenticateTokenEnhanced, handleLogout);

/**
 * Get user profile with enhanced security
 */
router.get('/profile', authenticateTokenEnhanced, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, avatar, created_at, last_login, is_active')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId: req.requestId
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        isActive: user.is_active
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: req.requestId
    });
  }
});

/**
 * Change password with enhanced security
 */
router.post('/change-password',
  authenticateTokenEnhanced,
  advancedSecuritySuite.rateLimit.sensitive,
  advancedSecuritySuite.password.validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required',
          code: 'MISSING_PASSWORDS',
          requestId: req.requestId
        });
      }

      // Get user with current password
      const { data: user, error } = await supabase
        .from('users')
        .select('id, password')
        .eq('id', req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          requestId: req.requestId
        });
      }

      // Verify current password
      const currentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!currentPasswordValid) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD',
          requestId: req.requestId
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and increment token version (logs out all devices)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedNewPassword,
          token_version: supabase.raw('token_version + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id);

      if (updateError) {
        console.error('Password update error:', updateError);
        return res.status(500).json({
          error: 'Failed to update password',
          code: 'PASSWORD_UPDATE_FAILED',
          requestId: req.requestId
        });
      }

      // Log password change
      console.log(`Password changed for user: ${req.user.email} from IP: ${req.ip}`);

      res.json({
        message: 'Password changed successfully. You will need to log in again on all devices.'
      });

    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: req.requestId
      });
    }
  }
);

/**
 * Get CSRF token
 */
router.get('/csrf-token', advancedSecuritySuite.csrf.generateToken);

/**
 * Security status endpoint
 */
router.get('/security-status', authenticateTokenEnhanced, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('created_at, last_login, token_version')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'User not found',
        requestId: req.requestId
      });
    }

    res.json({
      securityStatus: {
        accountAge: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        lastLogin: user.last_login,
        tokenVersion: user.token_version,
        securityScore: 85 // You could implement a real security scoring system
      }
    });

  } catch (error) {
    console.error('Security status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.requestId
    });
  }
});

/**
 * Password strength check endpoint (for real-time validation)
 */
router.post('/check-password-strength', async (req, res) => {
  try {
    const { password, email = '', name = '' } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Password is required',
        code: 'MISSING_PASSWORD'
      });
    }

    // Import the calculatePasswordStrength function
    const { advancedSecuritySuite } = await import('../middlewares/advancedSecurity.js');
    const strength = advancedSecuritySuite.password.calculateStrength(password, email, name);

    res.json({
      strength,
      feedback: {
        requirements: [
          { met: password.length >= 8, text: 'At least 8 characters' },
          { met: password.length >= 12, text: '12+ characters (recommended)' },
          { met: /[a-z]/.test(password), text: 'Lowercase letter' },
          { met: /[A-Z]/.test(password), text: 'Uppercase letter' },
          { met: /\d/.test(password), text: 'Number' },
          { met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'Special character' },
          { met: new Set(password).size >= 8, text: 'Character variety' }
        ],
        suggestions: strength.score < 5 ? [
          'Use a mix of character types',
          'Make it longer for better security',
          'Avoid personal information',
          'Avoid common patterns'
        ] : []
      }
    });

  } catch (error) {
    console.error('Password strength check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;