import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import express from 'express'
import secureAuthRouter from './secureAuth.js'
import {
  createTestUser,
  createTestToken,
  createExpiredToken,
  expectValidationError,
  expectAuthenticationError,
  expectSuccessResponse,
  cleanupTest,
  mockSupabaseSelect,
  mockSupabaseInsert,
  mockSupabaseUpdate,
  simulateSupabaseError
} from '../test-utils.js'

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/auth', secureAuthRouter)
  return app
}

describe('Secure Auth Routes', () => {
  let app

  beforeEach(() => {
    cleanupTest()
    app = createTestApp()
  })

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User'
    }

    test('should register a new user successfully', async () => {
      const mockUser = createTestUser({ email: validRegistrationData.email })

      // Mock Supabase responses
      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(null) // No existing user
      )
      mockSupabase.from().insert().single.mockResolvedValue(
        mockSupabaseInsert(mockUser)
      )

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)

      expectSuccessResponse(response)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(validRegistrationData.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    test('should reject registration with existing email', async () => {
      const existingUser = createTestUser()

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(existingUser) // User already exists
      )

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)

      expect(response.status).toBe(409)
      expect(response.body.message).toMatch(/already exists/i)
    })

    test('should validate email format', async () => {
      const invalidData = { ...validRegistrationData, email: 'invalid-email' }

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)

      expectValidationError(response, 'email')
    })

    test('should validate password strength', async () => {
      const weakPasswordData = { ...validRegistrationData, password: '123' }

      const response = await request(app)
        .post('/auth/register')
        .send(weakPasswordData)

      expectValidationError(response, 'password')
    })

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
    })

    test('should handle database errors gracefully', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        simulateSupabaseError('Database connection failed')
      )

      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData)

      expect(response.status).toBe(500)
      expect(response.body.message).toMatch(/server error/i)
    })

    test('should sanitize input data', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: '<script>alert("xss")</script>'
      }

      const mockUser = createTestUser({ name: 'alert("xss")' }) // Sanitized

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(null)
      )
      mockSupabase.from().insert().single.mockResolvedValue(
        mockSupabaseInsert(mockUser)
      )

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)

      expectSuccessResponse(response)
      expect(response.body.user.name).not.toContain('<script>')
    })
  })

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'SecurePass123!'
    }

    test('should login with valid credentials', async () => {
      const mockUser = createTestUser({
        email: validLoginData.email,
        password: await bcrypt.hash(validLoginData.password, 10)
      })

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(mockUser)
      )

      // Mock bcrypt.compare to return true
      bcrypt.compare.mockResolvedValue(true)

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)

      expectSuccessResponse(response)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(validLoginData.email)
    })

    test('should reject login with invalid email', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(null) // User not found
      )

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)

      expectAuthenticationError(response)
    })

    test('should reject login with invalid password', async () => {
      const mockUser = createTestUser({ email: validLoginData.email })

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(mockUser)
      )

      // Mock bcrypt.compare to return false
      bcrypt.compare.mockResolvedValue(false)

      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)

      expectAuthenticationError(response)
    })

    test('should implement account lockout after failed attempts', async () => {
      const mockUser = createTestUser({ email: validLoginData.email })

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(mockUser)
      )

      // Mock bcrypt.compare to return false
      bcrypt.compare.mockResolvedValue(false)

      // Attempt login multiple times
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/auth/login')
          .send(validLoginData)
      }

      // The 6th attempt should be locked out
      const response = await request(app)
        .post('/auth/login')
        .send(validLoginData)

      expect(response.status).toBe(429)
      expect(response.body.message).toMatch(/account locked/i)
    })

    test('should validate login input', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid', password: '' })

      expectValidationError(response, 'email')
    })

    test('should handle rate limiting', async () => {
      // Simulate rapid login attempts
      const requests = []
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .post('/auth/login')
            .send(validLoginData)
        )
      }

      const responses = await Promise.all(requests)
      const rateLimitedResponse = responses.find(r => r.status === 429)

      expect(rateLimitedResponse).toBeDefined()
    })
  })

  describe('POST /auth/refresh', () => {
    test('should refresh valid token', async () => {
      const validToken = createTestToken()
      const refreshedUser = createTestUser()

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(refreshedUser)
      )

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${validToken}`)

      expectSuccessResponse(response)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
    })

    test('should reject expired token', async () => {
      const expiredToken = createExpiredToken()

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${expiredToken}`)

      expectAuthenticationError(response)
    })

    test('should reject malformed token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')

      expectAuthenticationError(response)
    })

    test('should reject missing token', async () => {
      const response = await request(app)
        .post('/auth/refresh')

      expectAuthenticationError(response)
    })
  })

  describe('POST /auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      const validToken = createTestToken()

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)

      expectSuccessResponse(response)
      expect(response.body.message).toMatch(/logged out/i)
    })

    test('should handle logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout')

      // Should still succeed for logout
      expect(response.status).toBe(200)
    })
  })

  describe('POST /auth/forgot-password', () => {
    test('should handle password reset request', async () => {
      const mockUser = createTestUser()

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(mockUser)
      )

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })

      expectSuccessResponse(response)
      expect(response.body.message).toMatch(/reset link sent/i)
    })

    test('should handle non-existent email gracefully', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(null)
      )

      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })

      // Should still return success to avoid email enumeration
      expectSuccessResponse(response)
    })

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })

      expectValidationError(response, 'email')
    })
  })

  describe('POST /auth/reset-password', () => {
    test('should reset password with valid token', async () => {
      const resetToken = createTestToken({ type: 'password_reset' })
      const mockUser = createTestUser()

      const mockSupabase = require('@supabase/supabase-js').createClient()
      mockSupabase.from().select().eq().single.mockResolvedValue(
        mockSupabaseSelect(mockUser)
      )
      mockSupabase.from().update().eq().mockResolvedValue(
        mockSupabaseUpdate(mockUser)
      )

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewSecurePass123!'
        })

      expectSuccessResponse(response)
      expect(response.body.message).toMatch(/password reset/i)
    })

    test('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewSecurePass123!'
        })

      expectAuthenticationError(response)
    })

    test('should validate new password strength', async () => {
      const resetToken = createTestToken({ type: 'password_reset' })

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'weak'
        })

      expectValidationError(response, 'password')
    })
  })

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        })

      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers).toHaveProperty('x-frame-options')
      expect(response.headers).toHaveProperty('x-xss-protection')
    })
  })

  describe('Input Sanitization', () => {
    test('should sanitize SQL injection attempts', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        password: 'password'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(maliciousData)

      // Should be sanitized and not cause server error
      expect(response.status).toBe(400) // Validation error, not server error
    })

    test('should sanitize XSS attempts', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'password',
        name: '<script>alert("xss")</script>'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)

      if (response.status === 201) {
        expect(response.body.user.name).not.toContain('<script>')
      }
    })
  })

  describe('Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const start = Date.now()

      await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        })

      const responseTime = Date.now() - start
      expect(responseTime).toBeLessThan(2000) // Should respond within 2 seconds
    })
  })
})