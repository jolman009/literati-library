/**
 * Authentication Integration Tests
 *
 * These tests validate the complete authentication flow including:
 * - Login and token generation
 * - Token refresh with mutex protection
 * - Concurrent refresh protection
 * - Token family tracking
 * - Breach detection
 * - Session verification
 *
 * Run with: npm test -- auth.integration.test.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Mock Supabase client
vi.mock('../config/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              is_active: true,
              token_version: 1
            },
            error: null
          }))
        })),
        maybeSingle: vi.fn(() => ({
          data: {
            id: 'test-user-id',
            email: 'test@example.com',
            password_hash: '$2b$10$testhashedpassword',
            is_active: true,
            token_version: 1
          },
          error: null
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: {}, error: null }))
      }))
    }))
  }
}));

// Import after mocks
import { handleTokenRefresh, generateTokens, COOKIE_OPTIONS } from '../middlewares/enhancedAuth.js';
import { router as secureAuthRouter } from '../routes/secureAuth.js';

describe('Authentication Integration Tests', () => {
  let app;
  let testUser;
  let testTokens;

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Test user
    testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      is_active: true,
      token_version: 1
    };

    // Generate test tokens
    testTokens = generateTokens(testUser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Generation', () => {
    it('should generate valid access and refresh tokens', () => {
      const tokens = generateTokens(testUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('familyId');

      // Verify access token structure
      const accessDecoded = jwt.decode(tokens.accessToken);
      expect(accessDecoded).toHaveProperty('id', testUser.id);
      expect(accessDecoded).toHaveProperty('email', testUser.email);
      expect(accessDecoded).toHaveProperty('tokenVersion', testUser.token_version);

      // Verify refresh token structure
      const refreshDecoded = jwt.decode(tokens.refreshToken);
      expect(refreshDecoded).toHaveProperty('id', testUser.id);
      expect(refreshDecoded).toHaveProperty('familyId', tokens.familyId);
    });

    it('should generate unique family IDs for different logins', () => {
      const tokens1 = generateTokens(testUser);
      const tokens2 = generateTokens(testUser);

      expect(tokens1.familyId).not.toBe(tokens2.familyId);
    });
  });

  describe('Token Refresh - Single Request', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const tokens = generateTokens(testUser);

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Tokens refreshed successfully');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);

      // Verify new cookies are set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.startsWith('accessToken='))).toBe(true);
      expect(cookies.some(cookie => cookie.startsWith('refreshToken='))).toBe(true);
    });

    it('should reject refresh without refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Refresh token required');
      expect(response.body).toHaveProperty('code', 'NO_REFRESH_TOKEN');
    });

    it('should reject expired refresh token', async () => {
      // Generate token with very short expiry
      const expiredToken = jwt.sign(
        { id: testUser.id, familyId: 'test-family' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${expiredToken}`])
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Token Refresh - Concurrent Requests (Mutex Test)', () => {
    it('should handle concurrent refresh requests with mutex', async () => {
      const tokens = generateTokens(testUser);

      // Simulate multiple concurrent refresh requests
      const refreshPromises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/auth/refresh')
          .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
      );

      const responses = await Promise.all(refreshPromises);

      // All requests should succeed (some might get cached result)
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });

      // All responses should have the same access token (from mutex cache)
      const accessTokens = responses.map(r => r.body.accessToken);
      const uniqueTokens = [...new Set(accessTokens)];

      // Should have only 1-2 unique tokens (depending on timing)
      // The mutex should prevent 5 separate refresh operations
      expect(uniqueTokens.length).toBeLessThan(5);
    });
  });

  describe('Token Family Breach Detection', () => {
    it('should detect and prevent token reuse attack', async () => {
      const tokens = generateTokens(testUser);

      // First refresh - should succeed
      const firstRefresh = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200);

      expect(firstRefresh.body).toHaveProperty('accessToken');

      // Try to reuse the same refresh token (token reuse attack)
      const secondRefresh = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(401);

      expect(secondRefresh.body).toHaveProperty('code', 'TOKEN_FAMILY_BREACH');
      expect(secondRefresh.body.error).toContain('Security breach detected');
    });
  });

  describe('Cookie Security', () => {
    it('should set httpOnly cookies', () => {
      expect(COOKIE_OPTIONS.httpOnly).toBe(true);
    });

    it('should use secure cookies in production', () => {
      const originalEnv = process.env.NODE_ENV;

      // Test production mode
      process.env.NODE_ENV = 'production';
      const { COOKIE_OPTIONS: prodOptions } = require('../middlewares/enhancedAuth.js');
      expect(prodOptions.secure).toBe(true);
      expect(prodOptions.sameSite).toBe('none');

      // Test development mode
      process.env.NODE_ENV = 'development';
      const { COOKIE_OPTIONS: devOptions } = require('../middlewares/enhancedAuth.js');
      expect(devOptions.secure).toBe(false);
      expect(devOptions.sameSite).toBe('lax');

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Token Blacklist', () => {
    it('should blacklist old refresh tokens after refresh', async () => {
      const tokens = generateTokens(testUser);

      // First refresh
      await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200);

      // Try to use the old (blacklisted) token again
      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Session Verification', () => {
    it('should verify valid access token', async () => {
      const tokens = generateTokens(testUser);

      const response = await request(app)
        .get('/auth/profile')
        .set('Cookie', [`accessToken=${tokens.accessToken}`])
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    it('should reject invalid access token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Cookie', [`accessToken=invalid-token`])
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept Bearer token in Authorization header', async () => {
      const tokens = generateTokens(testUser);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
    });
  });

  describe('Token Version Invalidation', () => {
    it('should reject tokens with outdated version', async () => {
      // Generate token with version 1
      const tokens = generateTokens({ ...testUser, token_version: 1 });

      // Mock user with incremented version (simulates forced logout)
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { ...testUser, token_version: 2 }, // Version incremented
                error: null
              }))
            }))
          }))
        }))
      };

      vi.mock('../config/supabaseClient.js', () => ({ supabase: mockSupabase }));

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(401);

      expect(response.body).toHaveProperty('code', 'REFRESH_TOKEN_INVALIDATED');
    });
  });

  describe('Auto-Refresh Flow (Frontend Integration)', () => {
    it('should handle 401 error and auto-refresh flow', async () => {
      const tokens = generateTokens(testUser);

      // Make request with expired access token
      const expiredAccessToken = jwt.sign(
        { id: testUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      // First request should fail with 401
      const failedResponse = await request(app)
        .get('/api/protected-resource')
        .set('Cookie', [`accessToken=${expiredAccessToken}`])
        .expect(401);

      // Frontend should then call refresh endpoint
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');

      // Retry with new token should succeed
      const retryResponse = await request(app)
        .get('/api/protected-resource')
        .set('Cookie', [`accessToken=${refreshResponse.body.accessToken}`])
        .expect(200);
    });
  });
});

describe('Frontend AuthContext Integration Tests', () => {
  describe('Mutex Pattern in Frontend', () => {
    it('should prevent duplicate refresh calls', async () => {
      // This test simulates the frontend mutex behavior
      let refreshPromise = null;
      let refreshCallCount = 0;

      const mockRefreshFunction = async () => {
        refreshCallCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return { token: 'new-token' };
      };

      const attemptTokenRefresh = async () => {
        if (refreshPromise) {
          console.log('Waiting for existing refresh...');
          return await refreshPromise;
        }

        refreshPromise = (async () => {
          try {
            const result = await mockRefreshFunction();
            return result;
          } finally {
            refreshPromise = null;
          }
        })();

        return await refreshPromise;
      };

      // Simulate 10 concurrent refresh attempts
      const attempts = Array.from({ length: 10 }, () => attemptTokenRefresh());
      await Promise.all(attempts);

      // Should have only called refresh once due to mutex
      expect(refreshCallCount).toBe(1);
    });
  });
});
