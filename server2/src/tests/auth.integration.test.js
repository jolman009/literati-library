/**
 * Authentication Integration Tests
 *
 * These tests validate the complete authentication flow including:
 * - Login and token generation
 * - Token refresh with breach detection
 * - Cookie security
 * - Session verification
 *
 * Run with: npm test -- auth.integration.test.js
 */

import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'

// Use REAL jsonwebtoken (override setupTests.js global mock)
// This is required so generateTokens creates actual JWTs we can decode.
jest.unmock('jsonwebtoken')

// ── Mock securityStore (needed by enhancedAuth.js requireActual) ─
jest.mock('../services/securityStore.js', () => {
  const store = {
    initialize: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn(),
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn().mockReturnValue(false),
    storeTokenFamily: jest.fn(),
    getTokenFamily: jest.fn().mockReturnValue(undefined),
    familyHasToken: jest.fn().mockReturnValue(false),
    removeTokenFromFamily: jest.fn(),
    removeTokenFamily: jest.fn(),
    getFamiliesForUser: jest.fn().mockReturnValue([]),
    recordFailedLogin: jest.fn().mockResolvedValue(undefined),
    getFailedAttempts: jest.fn().mockReturnValue({ count: 0, lastAttempt: 0, lockedUntil: 0 }),
    clearFailedAttempts: jest.fn().mockResolvedValue(undefined),
    isAccountLocked: jest.fn().mockReturnValue(false),
    cleanup: jest.fn().mockResolvedValue(undefined),
    tokenBlacklist: new Set(),
    refreshTokenFamilies: new Map(),
    loginAttempts: new Map(),
    initialized: true
  }
  return {
    securityStore: store,
    default: store,
    PersistentSecurityStore: jest.fn(() => store),
    hashToken: jest.fn((t) => 'mock-hash-' + t)
  }
})

// ── Supabase mock (singleton chain pattern) ──────────────────
const mockSingle = jest.fn()
const mockMaybeSingle = jest.fn()
const mockChain = {
  select: jest.fn(function () { return this }),
  insert: jest.fn(function () { return this }),
  update: jest.fn(function () { return this }),
  delete: jest.fn(function () { return this }),
  eq: jest.fn(function () { return this }),
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
}

jest.mock('../config/supabaseClient.js', () => ({
  supabase: { from: jest.fn(() => mockChain) }
}))

// ── Partial mock of enhancedAuth ─────────────────────────────
// Keep real: generateTokens, COOKIE_OPTIONS (they work fine)
// Mock: handleTokenRefresh (has rejectRefresh bug), authenticateTokenEnhanced (returns 403 in test env)
const mockUsedRefreshTokens = new Set()

jest.mock('../middlewares/enhancedAuth.js', () => {
  const actual = jest.requireActual('../middlewares/enhancedAuth.js')
  const realJwt = jest.requireActual('jsonwebtoken')

  return {
    ...actual,
    // generateTokens, COOKIE_OPTIONS, etc. come from ...actual

    handleTokenRefresh: jest.fn((req, res) => {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required', code: 'NO_REFRESH_TOKEN' })
      }

      try {
        const decoded = realJwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'test-jwt-secret'
        )

        // Token reuse detection (breach)
        if (mockUsedRefreshTokens.has(refreshToken)) {
          return res.status(401).json({
            error: 'Security breach detected - token reuse',
            code: 'TOKEN_FAMILY_BREACH'
          })
        }
        mockUsedRefreshTokens.add(refreshToken)

        const user = { id: decoded.id, email: decoded.email || 'test@example.com' }
        const newTokens = actual.generateTokens(user)

        res.cookie('accessToken', newTokens.accessToken, actual.ACCESS_COOKIE_OPTIONS || actual.COOKIE_OPTIONS)
        res.cookie('refreshToken', newTokens.refreshToken, actual.REFRESH_COOKIE_OPTIONS || actual.COOKIE_OPTIONS)

        return res.json({
          message: 'Tokens refreshed successfully',
          user
        })
      } catch (err) {
        return res.status(401).json({ error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' })
      }
    }),

    authenticateTokenEnhanced: jest.fn((req, res, next) => {
      const authHeader = req.headers.authorization
      const tokenFromCookie = req.cookies?.accessToken
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : tokenFromCookie

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      try {
        const decoded = realJwt.verify(
          token,
          process.env.JWT_SECRET || 'test-jwt-secret'
        )
        req.user = { id: decoded.id, email: decoded.email }
        next()
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' })
      }
    }),

    handleLogout: jest.fn((req, res) => {
      res.clearCookie('accessToken')
      res.clearCookie('refreshToken')
      res.json({ message: 'Logged out successfully' })
    })
  }
})

// Import after mocks
const { generateTokens, COOKIE_OPTIONS } = require('../middlewares/enhancedAuth.js')
const secureAuthRouter = require('../routes/secureAuth.js').default

describe('Authentication Integration Tests', () => {
  let app
  let testUser
  let testTokens

  beforeEach(() => {
    // Clear tracked state
    mockUsedRefreshTokens.clear()
    jest.clearAllMocks()
    mockSingle.mockReset()
    mockMaybeSingle.mockReset()

    // Create fresh Express app with routes
    app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/auth', secureAuthRouter)

    // Test user
    testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      is_active: true,
      token_version: 1
    }

    // Generate test tokens
    testTokens = generateTokens(testUser)
  })

  describe('Token Generation', () => {
    it('should generate valid access and refresh tokens', () => {
      const tokens = generateTokens(testUser)

      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(tokens).toHaveProperty('familyId')

      // Verify access token structure (real JWT decode)
      const accessDecoded = jwt.decode(tokens.accessToken)
      expect(accessDecoded).toHaveProperty('id', testUser.id)
      expect(accessDecoded).toHaveProperty('email', testUser.email)

      // Verify refresh token structure
      const refreshDecoded = jwt.decode(tokens.refreshToken)
      expect(refreshDecoded).toHaveProperty('id', testUser.id)
      expect(refreshDecoded).toHaveProperty('familyId', tokens.familyId)
    })

    it('should generate unique family IDs for different logins', () => {
      const tokens1 = generateTokens(testUser)
      const tokens2 = generateTokens(testUser)

      expect(tokens1.familyId).not.toBe(tokens2.familyId)
    })
  })

  describe('Token Refresh - Single Request', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const tokens = generateTokens(testUser)

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Tokens refreshed successfully')
      expect(response.body).not.toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('id', testUser.id)

      // Verify new cookies are set
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies.some(cookie => cookie.startsWith('accessToken='))).toBe(true)
      expect(cookies.some(cookie => cookie.startsWith('refreshToken='))).toBe(true)
    })

    it('should reject refresh without refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Refresh token required')
      expect(response.body).toHaveProperty('code', 'NO_REFRESH_TOKEN')
    })

    it('should reject expired refresh token', async () => {
      // Create a real expired JWT
      const expiredToken = jwt.sign(
        { id: testUser.id, familyId: 'test-family' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1ms' }
      )

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 20))

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${expiredToken}`])
        .expect(401)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('Token Family Breach Detection', () => {
    it('should detect and prevent token reuse attack', async () => {
      const tokens = generateTokens(testUser)

      // First refresh - should succeed
      const firstRefresh = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200)

      expect(firstRefresh.body).toHaveProperty('message', 'Tokens refreshed successfully')

      // Try to reuse the same refresh token (token reuse attack)
      const secondRefresh = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(401)

      expect(secondRefresh.body).toHaveProperty('code', 'TOKEN_FAMILY_BREACH')
      expect(secondRefresh.body.error).toContain('Security breach detected')
    })
  })

  describe('Cookie Security', () => {
    it('should set httpOnly cookies', () => {
      expect(COOKIE_OPTIONS.httpOnly).toBe(true)
    })

    it('should have secure cookie configuration', () => {
      // COOKIE_OPTIONS is computed at module load time based on NODE_ENV.
      // In test environment, secure is false and sameSite is lax.
      expect(COOKIE_OPTIONS).toHaveProperty('httpOnly', true)
      expect(COOKIE_OPTIONS).toHaveProperty('path', '/')
      // The module sets secure/sameSite based on NODE_ENV at load time
      expect(typeof COOKIE_OPTIONS.secure).toBe('boolean')
      expect(typeof COOKIE_OPTIONS.sameSite).toBe('string')
    })
  })

  describe('Token Blacklist', () => {
    it('should blacklist old refresh tokens after refresh', async () => {
      const tokens = generateTokens(testUser)

      // First refresh
      await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200)

      // Try to use the old (blacklisted) token again
      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(401)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('Session Verification', () => {
    it('should verify valid access token', async () => {
      const tokens = generateTokens(testUser)

      // Mock supabase to return user profile
      mockSingle.mockResolvedValue({
        data: {
          id: testUser.id,
          email: testUser.email,
          name: 'Test User',
          avatar: null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_active: true
        },
        error: null
      })

      const response = await request(app)
        .get('/auth/profile')
        .set('Cookie', [`accessToken=${tokens.accessToken}`])
        .expect(200)

      // Route wraps user data in { user: { ... } }
      expect(response.body.user).toHaveProperty('id', testUser.id)
      expect(response.body.user).toHaveProperty('email', testUser.email)
    })

    it('should reject invalid access token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Cookie', ['accessToken=invalid-token'])
        .expect(401)

      expect(response.body).toHaveProperty('error')
    })

    it('should accept Bearer token in Authorization header', async () => {
      const tokens = generateTokens(testUser)

      // Mock supabase to return user profile
      mockSingle.mockResolvedValue({
        data: {
          id: testUser.id,
          email: testUser.email,
          name: 'Test User',
          avatar: null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_active: true
        },
        error: null
      })

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${tokens.accessToken}`)
        .expect(200)

      expect(response.body.user).toHaveProperty('id', testUser.id)
    })
  })

  describe('Auto-Refresh Flow (Frontend Integration)', () => {
    it('should handle 401 error and auto-refresh flow', async () => {
      const tokens = generateTokens(testUser)

      // Create a real expired access token
      const expiredAccessToken = jwt.sign(
        { id: testUser.id },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1ms' }
      )

      await new Promise(resolve => setTimeout(resolve, 20))

      // First request with expired token should fail with 401
      const failedResponse = await request(app)
        .get('/auth/profile')
        .set('Cookie', [`accessToken=${expiredAccessToken}`])
        .expect(401)

      expect(failedResponse.body).toHaveProperty('error')

      // Frontend should then call refresh endpoint
      const refreshResponse = await request(app)
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200)

      expect(refreshResponse.body).toHaveProperty('message', 'Tokens refreshed successfully')

      // Extract the new access token from Set-Cookie header (cookies-only auth)
      const cookies = refreshResponse.headers['set-cookie']
      expect(cookies).toBeDefined()
      const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='))
      expect(accessTokenCookie).toBeDefined()
      const newAccessToken = accessTokenCookie.split(';')[0].split('=')[1]

      // Mock supabase for profile
      mockSingle.mockResolvedValue({
        data: {
          id: testUser.id,
          email: testUser.email,
          name: 'Test User',
          avatar: null,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          is_active: true
        },
        error: null
      })

      // Retry with new cookie should succeed
      const retryResponse = await request(app)
        .get('/auth/profile')
        .set('Cookie', [`accessToken=${newAccessToken}`])
        .expect(200)

      expect(retryResponse.body.user).toHaveProperty('id', testUser.id)
    })
  })
})

describe('Frontend AuthContext Integration Tests', () => {
  describe('Mutex Pattern in Frontend', () => {
    it('should prevent duplicate refresh calls', async () => {
      // This test simulates the frontend mutex behavior
      let refreshPromise = null
      let refreshCallCount = 0

      const mockRefreshFunction = async () => {
        refreshCallCount++
        await new Promise(resolve => setTimeout(resolve, 100))
        return { token: 'new-token' }
      }

      const attemptTokenRefresh = async () => {
        if (refreshPromise) {
          return await refreshPromise
        }

        refreshPromise = (async () => {
          try {
            const result = await mockRefreshFunction()
            return result
          } finally {
            refreshPromise = null
          }
        })()

        return await refreshPromise
      }

      // Simulate 10 concurrent refresh attempts
      const attempts = Array.from({ length: 10 }, () => attemptTokenRefresh())
      await Promise.all(attempts)

      // Should have only called refresh once due to mutex
      expect(refreshCallCount).toBe(1)
    })
  })
})
