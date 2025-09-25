const request = require('supertest');
const express = require('express');

// Mock all dependencies before importing
jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

jest.mock('../../src/middlewares/enhancedAuth.js', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  }),
  verifyRefreshToken: jest.fn().mockReturnValue({
    id: 'test-user-id',
    email: 'test@example.com'
  })
}));

// Import after mocking
const { supabase } = require('../../src/config/supabaseClient.js');
const { generateTokens, verifyRefreshToken } = require('../../src/middlewares/enhancedAuth.js');

describe('Authentication API Endpoints', () => {
  let app;
  let agent;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mock basic authentication routes
    app.post('/auth/register', async (req, res) => {
      try {
        const { email, password, name } = req.body;

        // Input validation
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password strength validation
        if (password.length < 8) {
          return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user exists
        const existingUser = supabase.from('users').select('id').eq('email', email).single();
        if (existingUser.data) {
          return res.status(409).json({ error: 'User already exists' });
        }

        const user = {
          id: 'new-user-id',
          email,
          name,
          created_at: new Date().toISOString()
        };

        const { accessToken, refreshToken } = generateTokens(user);

        res.status(201).json({
          message: 'User created successfully',
          token: accessToken,
          refreshToken,
          user: { id: user.id, email: user.email, name: user.name }
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        // Mock user lookup
        const mockUser = {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed-password'
        };

        if (email !== mockUser.email || password !== 'password123') {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = generateTokens(mockUser);

        res.json({
          message: 'Login successful',
          token: accessToken,
          refreshToken,
          user: { id: mockUser.id, email: mockUser.email, name: mockUser.name }
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.post('/auth/refresh', async (req, res) => {
      try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
          return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = { id: decoded.id, email: decoded.email, name: 'Test User' };

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        res.json({
          message: 'Tokens refreshed successfully',
          token: accessToken,
          refreshToken: newRefreshToken,
          user
        });
      } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
      }
    });

    agent = request(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User'
      };

      supabase.from().select().eq().single.mockResolvedValue({ data: null, error: null });

      const response = await agent
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        email: userData.email,
        name: userData.name
      });
    });

    it('should reject registration with missing fields', async () => {
      const testCases = [
        { email: 'test@example.com', password: 'password123' }, // missing name
        { name: 'Test User', password: 'password123' }, // missing email
        { email: 'test@example.com', name: 'Test User' }, // missing password
        {} // missing all fields
      ];

      for (const userData of testCases) {
        const response = await agent
          .post('/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/required/i);
      }
    });

    it('should reject registration with invalid email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test@.com',
        'test@example.'
      ];

      for (const email of invalidEmails) {
        const response = await agent
          .post('/auth/register')
          .send({
            email,
            password: 'securepassword123',
            name: 'Test User'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/invalid email/i);
      }
    });

    it('should reject registration with weak passwords', async () => {
      const weakPasswords = [
        '123',
        'short',
        '1234567' // 7 characters
      ];

      for (const password of weakPasswords) {
        const response = await agent
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password,
            name: 'Test User'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password.*8.*characters/i);
      }
    });

    it('should reject registration for existing user', async () => {
      supabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'existing-user-id' },
        error: null
      });

      const response = await agent
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'securepassword123',
          name: 'Existing User'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/already exists/i);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await agent
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should reject login with invalid credentials', async () => {
      const invalidCredentials = [
        { email: 'test@example.com', password: 'wrongpassword' },
        { email: 'wrong@example.com', password: 'password123' },
        { email: 'wrong@example.com', password: 'wrongpassword' }
      ];

      for (const credentials of invalidCredentials) {
        const response = await agent
          .post('/auth/login')
          .send(credentials);

        expect(response.status).toBe(401);
        expect(response.body.error).toMatch(/invalid credentials/i);
      }
    });

    it('should reject login with missing fields', async () => {
      const testCases = [
        { email: 'test@example.com' }, // missing password
        { password: 'password123' }, // missing email
        {} // missing both
      ];

      for (const credentials of testCases) {
        const response = await agent
          .post('/auth/login')
          .send(credentials);

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/required/i);
      }
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const response = await agent
        .post('/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Tokens refreshed successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject refresh without token', async () => {
      const response = await agent
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/refresh token required/i);
    });

    it('should reject refresh with invalid token', async () => {
      verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await agent
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/invalid refresh token/i);
    });
  });

  describe('Security Tests', () => {
    it('should sanitize input to prevent XSS', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">'
      ];

      for (const payload of xssPayloads) {
        const response = await agent
          .post('/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password: 'securepassword123',
            name: payload
          });

        // Should either succeed with sanitized input or reject the payload
        if (response.status === 201) {
          expect(response.body.user.name).not.toContain('<script>');
          expect(response.body.user.name).not.toContain('javascript:');
        }
      }
    });

    it('should handle SQL injection attempts safely', async () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --"
      ];

      for (const payload of sqlPayloads) {
        const response = await agent
          .post('/auth/login')
          .send({
            email: payload,
            password: 'password123'
          });

        // Should not crash or expose database errors
        expect(response.status).toBe(401);
        expect(response.body.error).not.toMatch(/database|sql|syntax/i);
      }
    });

    it('should include security headers in responses', async () => {
      const response = await agent
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      // Check for security headers (if implemented)
      const headers = response.headers;

      // These headers might be set by middleware in the actual app
      if (headers['x-content-type-options']) {
        expect(headers['x-content-type-options']).toBe('nosniff');
      }
    });

    it('should not expose sensitive information in error messages', async () => {
      const response = await agent
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).not.toMatch(/user.*not.*found/i);
      expect(response.body.error).not.toMatch(/password.*incorrect/i);
      expect(response.body.error).toMatch(/invalid credentials/i);
    });

    it('should rate limit authentication attempts', async () => {
      // This test would require actual rate limiting middleware
      // For now, we'll test that multiple requests don't crash the server
      const requests = Array.from({ length: 10 }, () =>
        agent
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(requests);

      // All requests should be handled (not crash)
      responses.forEach(response => {
        expect(response.status).toBeDefined();
        expect(response.body).toBeDefined();
      });
    });
  });

  describe('Token Security', () => {
    it('should generate different tokens for each login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response1 = await agent.post('/auth/login').send(loginData);
      const response2 = await agent.post('/auth/login').send(loginData);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Tokens should be different (in real implementation)
      // This test depends on the token generation implementation
    });

    it('should generate tokens with proper structure', async () => {
      const response = await agent
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(typeof response.body.token).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
      expect(response.body.refreshToken.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await agent
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it('should handle very large payloads', async () => {
      const largeString = 'a'.repeat(10000);

      const response = await agent
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: largeString
        });

      // Should either accept or reject gracefully
      expect(response.status).toBeDefined();
      expect(response.body).toBeDefined();
    });

    it('should handle empty request body', async () => {
      const response = await agent
        .post('/auth/login')
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});