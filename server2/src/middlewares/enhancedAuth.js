// src/middlewares/enhancedAuth.js
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';

// Token blacklist storage (in production, use Redis or database)
const tokenBlacklist = new Set();

// Refresh token family tracking (in production, use Redis or database)
const refreshTokenFamilies = new Map(); // family_id -> { userId, tokens: Set(), createdAt }
const activeRefreshAttempts = new Map(); // userId -> Promise (to prevent concurrent refresh)

// Configuration constants
// Note: Longer expiry for development convenience. Shorten for production!
const ACCESS_TOKEN_EXPIRY = process.env.NODE_ENV === 'production' ? '15m' : '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Enhanced secure cookie configuration
export const COOKIE_OPTIONS = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === 'production', 
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // ✅ CRITICAL FIX
  path: '/',
  domain: process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN 
    ? process.env.COOKIE_DOMAIN 
    : undefined
};

// Separate cookie options for access and refresh tokens
export const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
  path: '/' // Access token needed for all API calls
};

export const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: '/auth', // Refresh token only needed for auth endpoints
  httpOnly: true // Extra emphasis on httpOnly for refresh tokens
};

// Production-ready cookie options validation
export const validateCookieEnvironment = () => {
  const warnings = [];

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.COOKIE_DOMAIN) {
      warnings.push('⚠️ COOKIE_DOMAIN not set in production - cookies will be scoped to exact domain');
    }

    if (!COOKIE_OPTIONS.secure) {
      warnings.push('⚠️ Secure cookies disabled in production - this is a security risk');
    }
  }

  if (warnings.length > 0) {
    console.warn('Cookie Security Warnings:');
    warnings.forEach(warning => console.warn(warning));
  }

  return warnings;
};

// =====================================================
// Token Generation and Validation
// =====================================================

/**
 * Generate access and refresh tokens with family tracking
 */
export const generateTokens = (user, parentRefreshToken = null) => {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'access'
  };

  // Generate family ID for refresh token lineage tracking
  let familyId;
  if (parentRefreshToken) {
    // If this is a refresh, try to get the family from the parent token
    try {
      const parentDecoded = jwt.decode(parentRefreshToken);
      familyId = parentDecoded.familyId;
    } catch (error) {
      // If parent token is invalid, create new family
      familyId = `family_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  } else {
    // New login - create new family
    familyId = `family_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const refreshPayload = {
    id: user.id,
    email: user.email,
    type: 'refresh',
    tokenVersion: user.token_version || 0,
    familyId: familyId,
    issuedAt: Date.now()
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'literati-api',
    audience: 'literati-client'
  });

  const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'literati-api',
    audience: 'literati-client'
  });

  // Track the refresh token family
  if (!refreshTokenFamilies.has(familyId)) {
    refreshTokenFamilies.set(familyId, {
      userId: user.id,
      tokens: new Set(),
      createdAt: Date.now()
    });
  }
  refreshTokenFamilies.get(familyId).tokens.add(refreshToken);

  return { accessToken, refreshToken, familyId };
};

/**
 * Verify access token with enhanced security
 * Includes backward compatibility for tokens without audience claims
 */
export const verifyAccessToken = (token) => {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    let decoded;
    try {
      // First try to verify with audience requirement (new tokens)
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'literati-api',
        audience: 'literati-client'
      });
    } catch (audienceError) {
      // If audience verification fails, try without audience (legacy tokens)
      if (audienceError.message.includes('audience invalid') || audienceError.message.includes('aud invalid')) {
        console.warn('⚠️ Legacy token detected (no audience claim) - user should refresh token');
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          issuer: 'literati-api'
          // No audience requirement for backward compatibility
        });

        // Mark this token for future migration
        decoded._legacyToken = true;
      } else {
        // Re-throw other verification errors
        throw audienceError;
      }
    }

    // Verify token type
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Verify refresh token with family tracking and backward compatibility
 */
export const verifyRefreshToken = (token) => {
  try {
    if (tokenBlacklist.has(token)) {
      throw new Error('Refresh token has been revoked');
    }

    let decoded;
    try {
      // First try to verify with audience requirement (new tokens)
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        issuer: 'literati-api',
        audience: 'literati-client'
      });
    } catch (audienceError) {
      // If audience verification fails, try without audience (legacy tokens)
      if (audienceError.message.includes('audience invalid') || audienceError.message.includes('aud invalid')) {
        console.warn('⚠️ Legacy refresh token detected (no audience claim)');
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
          issuer: 'literati-api'
          // No audience requirement for backward compatibility
        });
        decoded._legacyToken = true;
      } else {
        // Re-throw other verification errors
        throw audienceError;
      }
    }

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Refresh token verification failed: ${error.message}`);
  }
};

// =====================================================
// Enhanced Authentication Middleware
// =====================================================

/**
 * Enhanced authentication middleware with cookie support
 */
export const authenticateTokenEnhanced = async (req, res, next) => {
  try {
    let token;

    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback to cookie if no header token
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'NO_TOKEN',
        requestId: req.requestId
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Additional security: Check if user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_active, token_version')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        requestId: req.requestId
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED',
        requestId: req.requestId
      });
    }

    // Check token version (for forced logout capability)
    if (decoded.tokenVersion !== undefined && user.token_version !== decoded.tokenVersion) {
      return res.status(401).json({
        error: 'Token has been invalidated',
        code: 'TOKEN_INVALIDATED',
        requestId: req.requestId
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email
    };

    // Add token to request for potential blacklisting
    req.currentToken = token;

    // If this is a legacy token, add warning header to encourage refresh
    if (decoded._legacyToken) {
      res.setHeader('X-Token-Refresh-Recommended', 'true');
      res.setHeader('X-Token-Warning', 'Legacy token detected - please refresh for enhanced security');
    }

    next();
  } catch (error) {
    console.error('Enhanced authentication error:', error);

    return res.status(403).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
      requestId: req.requestId
    });
  }
};

// =====================================================
// Token Management Functions
// =====================================================

/**
 * Blacklist a token (for logout)
 */
export const blacklistToken = (token) => {
  tokenBlacklist.add(token);

  // Optional: Set timeout to remove from blacklist after expiry
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 15 * 60 * 1000); // 15 minutes (access token expiry)
};

/**
 * Enhanced refresh token endpoint handler with family tracking and breach detection
 */
export const handleTokenRefresh = async (req, res) => {
  const userId = req.body.userId || (req.cookies?.refreshToken && jwt.decode(req.cookies.refreshToken)?.id);

  try {
    // Prevent concurrent refresh attempts for the same user
    if (activeRefreshAttempts.has(userId)) {
      console.warn(`🔒 Concurrent refresh attempt blocked for user ${userId}`);
      // Wait for the existing refresh to complete
      try {
        await activeRefreshAttempts.get(userId);
      } catch (error) {
        // If the existing refresh failed, we can proceed
      }
    }

    // Create a promise to track this refresh attempt
    let resolveRefresh, rejectRefresh;
    const refreshPromise = new Promise((resolve, reject) => {
      resolveRefresh = resolve;
      rejectRefresh = reject;
    });
    activeRefreshAttempts.set(userId, refreshPromise);

    let refreshToken;

    // Get refresh token from cookie or body
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      rejectRefresh(new Error('No refresh token'));
      activeRefreshAttempts.delete(userId);
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    const familyId = decoded.familyId;

    // Enhanced security: Check if this token belongs to a known family
    if (familyId && refreshTokenFamilies.has(familyId)) {
      const family = refreshTokenFamilies.get(familyId);

      // Verify the token exists in the family
      if (!family.tokens.has(refreshToken)) {
        console.error(`🚨 SECURITY BREACH: Refresh token not in family ${familyId} for user ${decoded.id}`);

        // Invalidate the entire family (all tokens for this family)
        family.tokens.forEach(token => blacklistToken(token));
        refreshTokenFamilies.delete(familyId);

        // Force logout by incrementing token version
        await supabase
          .from('users')
          .update({ token_version: supabase.raw('token_version + 1') })
          .eq('id', decoded.id);

        rejectRefresh(new Error('Token family breach'));
        activeRefreshAttempts.delete(userId);
        return res.status(401).json({
          error: 'Security breach detected - all tokens invalidated',
          code: 'TOKEN_FAMILY_BREACH'
        });
      }
    } else if (familyId && !refreshTokenFamilies.has(familyId)) {
      console.warn(`⚠️ Unknown token family ${familyId} - possible expired family or legacy token`);
      // For legacy tokens or expired families, we'll allow the refresh but create a new family
    }

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, is_active, token_version')
      .eq('id', decoded.id)
      .single();

    if (error || !user || !user.is_active) {
      rejectRefresh(new Error('Invalid user'));
      activeRefreshAttempts.delete(userId);
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check token version
    if (decoded.tokenVersion !== undefined && user.token_version !== decoded.tokenVersion) {
      rejectRefresh(new Error('Token invalidated'));
      activeRefreshAttempts.delete(userId);
      return res.status(401).json({
        error: 'Refresh token has been invalidated',
        code: 'REFRESH_TOKEN_INVALIDATED'
      });
    }

    // Generate new tokens with family tracking
    const { accessToken, refreshToken: newRefreshToken, familyId: newFamilyId } = generateTokens(user, refreshToken);

    // Remove old refresh token from family and blacklist it
    if (familyId && refreshTokenFamilies.has(familyId)) {
      refreshTokenFamilies.get(familyId).tokens.delete(refreshToken);
    }
    blacklistToken(refreshToken);

    // Set new tokens in cookies with enhanced security options
    res.cookie('accessToken', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    // Clean up old families (older than 7 days)
    const now = Date.now();
    for (const [fId, family] of refreshTokenFamilies.entries()) {
      if (now - family.createdAt > 7 * 24 * 60 * 60 * 1000) {
        // Family is older than 7 days, clean it up
        family.tokens.forEach(token => blacklistToken(token));
        refreshTokenFamilies.delete(fId);
      }
    }

    const response = {
      message: 'Tokens refreshed successfully',
      accessToken, // Also return in body for clients that prefer headers
      user: {
        id: user.id,
        email: user.email
      }
    };

    // Add migration warning for legacy tokens
    if (decoded._legacyToken) {
      response.warning = 'Legacy token refreshed - enhanced security now active';
    }

    resolveRefresh(response);
    activeRefreshAttempts.delete(userId);
    res.json(response);

  } catch (error) {
    console.error('Token refresh error:', error);

    if (activeRefreshAttempts.has(userId)) {
      rejectRefresh(error);
      activeRefreshAttempts.delete(userId);
    }

    res.status(401).json({
      error: 'Failed to refresh token',
      code: 'REFRESH_FAILED'
    });
  }
};

/**
 * Enhanced logout handler with family tracking cleanup
 */
export const handleLogout = async (req, res) => {
  try {
    // Blacklist current access token
    if (req.currentToken) {
      blacklistToken(req.currentToken);
    }

    // Enhanced refresh token cleanup with family tracking
    let refreshToken;
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    } else if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (refreshToken) {
      try {
        // Try to get family information from the refresh token
        const decoded = jwt.decode(refreshToken);
        const familyId = decoded?.familyId;

        // Blacklist the current refresh token
        blacklistToken(refreshToken);

        // If this token has a family, optionally clean up the entire family
        if (familyId && refreshTokenFamilies.has(familyId)) {
          const family = refreshTokenFamilies.get(familyId);

          // For logout from this device only, just remove this token from the family
          if (!req.body.logoutAllDevices) {
            family.tokens.delete(refreshToken);
            console.log(`🔓 Single device logout: removed token from family ${familyId}`);
          } else {
            // For logout from all devices, invalidate the entire family
            family.tokens.forEach(token => blacklistToken(token));
            refreshTokenFamilies.delete(familyId);
            console.log(`🔓 All devices logout: invalidated entire family ${familyId}`);
          }
        }
      } catch (error) {
        // If we can't decode the token, just blacklist it normally
        console.warn('⚠️ Could not decode refresh token during logout:', error.message);
        blacklistToken(refreshToken);
      }
    }

    // Clear cookies with proper options to ensure complete removal
    res.clearCookie('accessToken', ACCESS_COOKIE_OPTIONS);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

    // Additional fallback cookie clearing for legacy paths
    res.clearCookie('accessToken', { ...ACCESS_COOKIE_OPTIONS, path: '/' });
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, path: '/' });

    // Optional: Increment token version for this user (forces logout from all devices)
    if (req.body.logoutAllDevices) {
      await supabase
        .from('users')
        .update({ token_version: supabase.raw('token_version + 1') })
        .eq('id', req.user.id);

      // Also clean up any families for this user (belt and suspenders approach)
      const userId = req.user.id;
      for (const [familyId, family] of refreshTokenFamilies.entries()) {
        if (family.userId === userId) {
          family.tokens.forEach(token => blacklistToken(token));
          refreshTokenFamilies.delete(familyId);
        }
      }

      console.log(`🔓 Force logout all devices for user ${userId}`);
    }

    res.json({
      message: req.body.logoutAllDevices ?
        'Logged out successfully from all devices' :
        'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      requestId: req.requestId
    });
  }
};

// =====================================================
// Account Security Functions
// =====================================================

/**
 * Force logout all devices for a user with family cleanup
 */
export const forceLogoutAllDevices = async (userId) => {
  try {
    // Increment token version to invalidate all existing tokens
    await supabase
      .from('users')
      .update({ token_version: supabase.raw('token_version + 1') })
      .eq('id', userId);

    // Clean up all token families for this user
    let familiesCleared = 0;
    for (const [familyId, family] of refreshTokenFamilies.entries()) {
      if (family.userId === userId) {
        // Blacklist all tokens in the family
        family.tokens.forEach(token => blacklistToken(token));
        refreshTokenFamilies.delete(familyId);
        familiesCleared++;
      }
    }

    console.log(`🔓 Force logout for user ${userId}: cleared ${familiesCleared} token families`);
    return true;
  } catch (error) {
    console.error('Force logout error:', error);
    return false;
  }
};

/**
 * Deactivate user account with complete token cleanup
 */
export const deactivateAccount = async (userId) => {
  try {
    // Deactivate account and invalidate all tokens
    await supabase
      .from('users')
      .update({
        is_active: false,
        token_version: supabase.raw('token_version + 1')
      })
      .eq('id', userId);

    // Clean up all token families for this user
    let familiesCleared = 0;
    for (const [familyId, family] of refreshTokenFamilies.entries()) {
      if (family.userId === userId) {
        // Blacklist all tokens in the family
        family.tokens.forEach(token => blacklistToken(token));
        refreshTokenFamilies.delete(familyId);
        familiesCleared++;
      }
    }

    console.log(`🔒 Account deactivated for user ${userId}: cleared ${familiesCleared} token families`);
    return true;
  } catch (error) {
    console.error('Account deactivation error:', error);
    return false;
  }
};

// =====================================================
// Exports
// =====================================================

export default {
  authenticateTokenEnhanced,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  handleTokenRefresh,
  handleLogout,
  forceLogoutAllDevices,
  deactivateAccount,
  validateCookieEnvironment,
  COOKIE_OPTIONS,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS
};