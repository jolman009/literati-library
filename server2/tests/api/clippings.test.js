// Jest globals available in test environment
const request = require('supertest');
const express = require('express');

// Mock supabase
jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

const { supabase } = require('../../src/config/supabaseClient.js');

describe('Clippings API Endpoints', () => {
  let app;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  // Fake auth middleware
  const fakeAuth = (req, _res, next) => {
    req.user = mockUser;
    next();
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Dynamic import (ESM route)
    const { clippingsRouter } = await import('../../src/routes/clippings.js');

    app = express();
    app.use(express.json());
    app.use('/api/clippings', clippingsRouter(fakeAuth));
  });

  // --- GET /api/clippings ---

  describe('GET /api/clippings', () => {
    it('returns paginated list of clippings', async () => {
      const mockClippings = [
        { id: '1', user_id: mockUser.id, url: 'https://example.com', title: 'Test' },
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockClippings, error: null }),
      });

      const res = await request(app).get('/api/clippings');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Test');
    });
  });

  // --- POST /api/clippings ---

  describe('POST /api/clippings', () => {
    it('returns 400 when url or title is missing', async () => {
      const res = await request(app)
        .post('/api/clippings')
        .send({ url: 'https://example.com' }); // missing title

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it('creates a clipping and returns 201', async () => {
      const mockClipping = {
        id: 'new-id',
        user_id: mockUser.id,
        url: 'https://example.com',
        title: 'Test',
      };

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClipping, error: null }),
      });

      const res = await request(app)
        .post('/api/clippings')
        .send({ url: 'https://example.com', title: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('new-id');
    });
  });

  // --- DELETE /api/clippings/:id ---

  describe('DELETE /api/clippings/:id', () => {
    it('deletes a clipping', async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const res = await request(app).delete('/api/clippings/some-id');

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
    });
  });
});
