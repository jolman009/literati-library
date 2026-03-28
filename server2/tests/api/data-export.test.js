const request = require('supertest');
const express = require('express');

// Mock chain that supports chained calls and returns configurable data
const mockResults = {};
const mockSingle = jest.fn();
const mockLimit = jest.fn();
const mockChain = {
  select: jest.fn(function () { return this; }),
  eq: jest.fn(function () { return this; }),
  order: jest.fn(function () { return this; }),
  single: mockSingle,
  limit: mockLimit,
};

jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: { from: jest.fn(() => mockChain) },
}));

const { supabase } = require('../../src/config/supabaseClient.js');

describe('Data Export API (GDPR Article 20)', () => {
  let app;

  const mockAuth = (req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  };

  beforeAll(async () => {
    const { default: dataExportRouter } = await import('../../src/routes/dataExport.js');
    app = express();
    app.use(express.json());
    app.use('/api/data-export', dataExportRouter(mockAuth));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset chain methods to return this
    mockChain.select.mockImplementation(function () { return this; });
    mockChain.eq.mockImplementation(function () { return this; });
    mockChain.order.mockImplementation(function () { return this; });
  });

  describe('GET /api/data-export/user-data', () => {
    function setupSuccessfulExport() {
      const callCount = { n: 0 };

      // The route calls single() for user, gamificationStats
      // and calls order()+limit() or order() for lists
      // We need to handle the flow: user fetch first (single), then multiple list fetches, then single for stats

      mockSingle.mockImplementation(() => {
        callCount.n++;
        if (callCount.n === 1) {
          // User fetch
          return { data: { id: 'user-123', email: 'test@example.com', name: 'Test User', created_at: '2025-01-01', updated_at: '2025-06-01' }, error: null };
        }
        // gamification stats (6th query) or achievements query single
        return { data: { total_points: 500, level: 3, reading_streak: 5, books_read: 10, total_reading_time: 3600, pages_read: 1000, notes_created: 50, highlights_created: 20 }, error: null };
      });

      // For list queries that end with order() or limit()
      mockChain.order.mockImplementation(function () {
        return {
          ...this,
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          // If no limit is called, resolve directly
          then: (resolve) => resolve({ data: [], error: null }),
        };
      });

      // For queries ending with limit()
      mockLimit.mockResolvedValue({ data: [], error: null });

      // For queries ending with eq() (reading_progress)
      mockChain.eq.mockImplementation(function () { return this; });
    }

    it('should return 404 if user not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const res = await request(app).get('/api/data-export/user-data');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return export data with correct structure', async () => {
      // Simple approach: mock from() to return chain, single() returns user
      const userData = { id: 'user-123', email: 'test@example.com', name: 'Test', created_at: '2025-01-01', updated_at: '2025-06-01' };

      // For user query (first single call)
      mockSingle
        .mockResolvedValueOnce({ data: userData, error: null })  // user
        .mockResolvedValueOnce({ data: { total_points: 100, level: 2, reading_streak: 3, books_read: 5, total_reading_time: 7200, pages_read: 500, notes_created: 10, highlights_created: 5 }, error: null }); // gamification

      // For list queries, chain.order returns something with .limit() or resolves directly
      // Since order() returns this and limit() is on chain...
      mockLimit.mockResolvedValue({ data: [], error: null });

      // order() calls that don't chain to limit() need to resolve
      const orderMock = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      mockChain.order.mockImplementation(() => orderMock());

      // eq() for reading_progress (no order, no single after it in that query)
      // Actually the reading_progress query ends with eq() — need to make it resolve
      // This is complex due to chained Supabase calls. Let's use a simpler mock:

      // Reset and use a more flexible approach
      let queryIndex = 0;
      supabase.from.mockImplementation((table) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn(),
          single: jest.fn(),
        };

        if (table === 'users') {
          chain.single.mockResolvedValue({ data: userData, error: null });
        } else if (table === 'user_stats') {
          chain.single.mockResolvedValue({
            data: { total_points: 100, level: 2, reading_streak: 3, books_read: 5, total_reading_time: 7200, pages_read: 500, notes_created: 10, highlights_created: 5 },
            error: null,
          });
        } else if (table === 'reading_progress') {
          // ends with eq(), needs to resolve as promise
          chain.eq.mockReturnValue({ data: [], error: null });
        } else {
          // books, notes, sessions, achievements, goals, daily_reading_stats
          chain.limit.mockResolvedValue({ data: [], error: null });
          chain.order.mockReturnValue(chain);
          // For queries without limit (achievements, goals)
          chain.order.mockImplementation(() => ({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            then: undefined,
            data: [],
            error: null,
          }));
        }

        return chain;
      });

      const res = await request(app).get('/api/data-export/user-data');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('export_info');
      expect(res.body).toHaveProperty('account');
      expect(res.body).toHaveProperty('library');
      expect(res.body).toHaveProperty('reading_progress');
      expect(res.body).toHaveProperty('notes_and_highlights');
      expect(res.body).toHaveProperty('reading_sessions');
      expect(res.body).toHaveProperty('gamification');
      expect(res.body).toHaveProperty('statistics');
      expect(res.body).toHaveProperty('privacy_info');

      expect(res.body.export_info.gdpr_compliance).toContain('GDPR Article 20');
      expect(res.body.account.email).toBe('test@example.com');
    });

    it('should set download headers', async () => {
      const userData = { id: 'user-123', email: 'test@example.com', name: 'Test', created_at: '2025-01-01', updated_at: '2025-06-01' };

      supabase.from.mockImplementation((table) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          single: jest.fn(),
        };

        if (table === 'users') {
          chain.single.mockResolvedValue({ data: userData, error: null });
        } else if (table === 'user_stats') {
          chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
        } else if (table === 'reading_progress') {
          chain.eq.mockReturnValue({ data: [], error: null });
        } else {
          chain.order.mockReturnValue(chain);
        }
        return chain;
      });

      const res = await request(app).get('/api/data-export/user-data');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['content-disposition']).toContain('shelfquest-data-export');
    });
  });

  describe('GET /api/data-export/summary', () => {
    it('should return count summary', async () => {
      supabase.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
        };
        return chain;
      });

      const res = await request(app).get('/api/data-export/summary');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('books_count');
      expect(res.body).toHaveProperty('notes_count');
      expect(res.body).toHaveProperty('sessions_count');
      expect(res.body).toHaveProperty('achievements_count');
      expect(res.body).toHaveProperty('reading_stats_days');
    });
  });
});
