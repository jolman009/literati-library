const request = require('supertest');
const express = require('express');

const tableMocks = {};

jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (tableMocks[table]) return tableMocks[table]();

      const chain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      return chain;
    }),
  },
}));

jest.mock('../../src/services/notificationService.js', () => ({
  sendNotification: jest.fn().mockResolvedValue({}),
}));

describe('Leaderboard API', () => {
  let app;

  const mockAuth = (req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  };

  beforeAll(async () => {
    const { leaderboardRouter } = await import('../../src/routes/leaderboard.js');
    app = express();
    app.use(express.json());
    app.use('/api/leaderboard', leaderboardRouter(mockAuth));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(tableMocks).forEach(k => delete tableMocks[k]);
  });

  // Helper to set up user list mock
  function setupUsersMock(userIds = ['user-123', 'user-456']) {
    tableMocks.users = () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: userIds[0], name: 'Test User', avatar: null },
        error: null,
      }),
      // For the list query (no single)
      then: undefined,
    });

    // Override: users table is called multiple ways
    const { supabase } = require('../../src/config/supabaseClient.js');
    supabase.from.mockImplementation((table) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      if (table === 'users') {
        // First call gets user list, subsequent calls get individual user info
        chain.select.mockImplementation(() => {
          chain.single.mockResolvedValue({
            data: { id: 'user-123', name: 'Test User', avatar: null },
            error: null,
          });
          // For list query (no single called), resolve the chain itself
          return {
            ...chain,
            then: (resolve) => resolve({ data: userIds.map(id => ({ id })), error: null }),
          };
        });
      }

      if (table === 'user_settings') {
        chain.single.mockResolvedValue({
          data: { leaderboard_visible: true, display_name: null },
          error: null,
        });
      }

      if (table === 'books' || table === 'reading_sessions' || table === 'notes') {
        chain.eq.mockReturnThis();
        chain.gte.mockResolvedValue({ data: [], error: null });
      }

      if (table === 'reading_streaks') {
        chain.order.mockResolvedValue({ data: [], error: null });
      }

      if (table === 'user_follows') {
        chain.eq.mockReturnThis();
        chain.single.mockResolvedValue({ data: null, error: null });
      }

      return chain;
    });
  }

  describe('GET /api/leaderboard/global', () => {
    it('should return empty leaderboard when no users', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: [], error: null }),
      }));

      const res = await request(app).get('/api/leaderboard/global');

      expect(res.status).toBe(200);
      expect(res.body.leaderboard).toEqual([]);
    });

    it('should return leaderboard with user ranks', async () => {
      setupUsersMock(['user-123']);

      const res = await request(app).get('/api/leaderboard/global');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('leaderboard');
      expect(res.body).toHaveProperty('user_rank');
      expect(res.body).toHaveProperty('total_participants');
      expect(res.body.sort_by).toBe('points');
      expect(res.body.period).toBe('all_time');
    });

    it('should support sort parameter', async () => {
      setupUsersMock(['user-123']);

      const res = await request(app).get('/api/leaderboard/global?sort=streak');

      expect(res.status).toBe(200);
      expect(res.body.sort_by).toBe('streak');
    });
  });

  describe('GET /api/leaderboard/weekly', () => {
    it('should return weekly leaderboard', async () => {
      setupUsersMock(['user-123']);

      const res = await request(app).get('/api/leaderboard/weekly');

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('weekly');
      expect(res.body).toHaveProperty('period_start');
      expect(res.body).toHaveProperty('resets_at');
    });
  });

  describe('GET /api/leaderboard/monthly', () => {
    it('should return monthly leaderboard', async () => {
      setupUsersMock(['user-123']);

      const res = await request(app).get('/api/leaderboard/monthly');

      expect(res.status).toBe(200);
      expect(res.body.period).toBe('monthly');
    });
  });

  describe('POST /api/leaderboard/follow/:targetUserId', () => {
    it('should prevent following yourself', async () => {
      const res = await request(app).post('/api/leaderboard/follow/user-123');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('yourself');
    });

    it('should return 404 for nonexistent user', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const res = await request(app).post('/api/leaderboard/follow/nonexistent');

      expect(res.status).toBe(404);
    });

    it('should follow a user successfully', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      let callCount = 0;
      supabase.from.mockImplementation((table) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ error: null }),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn(),
        };

        if (table === 'users') {
          callCount++;
          chain.single.mockResolvedValue({
            data: callCount === 1
              ? { id: 'user-456', name: 'Other User' }
              : { name: 'Test User' },
            error: null,
          });
        } else if (table === 'user_follows') {
          // Not already following
          chain.single.mockResolvedValue({ data: null, error: null });
        }

        return chain;
      });

      const res = await request(app).post('/api/leaderboard/follow/user-456');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/leaderboard/follow/:targetUserId', () => {
    it('should unfollow a user', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(function () {
          this._eqCount = (this._eqCount || 0) + 1;
          if (this._eqCount >= 2) return Promise.resolve({ error: null });
          return this;
        }),
      }));

      const res = await request(app).delete('/api/leaderboard/follow/user-456');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/leaderboard/settings', () => {
    it('should update privacy settings', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'settings-1' }, error: null }),
      }));

      const res = await request(app)
        .put('/api/leaderboard/settings')
        .send({ leaderboard_visible: false, display_name: 'BookWorm' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/leaderboard/settings', () => {
    it('should return default settings when none exist', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const res = await request(app).get('/api/leaderboard/settings');

      expect(res.status).toBe(200);
      expect(res.body.leaderboard_visible).toBe(true);
      expect(res.body.display_name).toBeNull();
    });
  });

  describe('GET /api/leaderboard/search', () => {
    it('should return 400 for short query', async () => {
      const res = await request(app).get('/api/leaderboard/search?q=a');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('2 characters');
    });

    it('should return search results', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation((table) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          neq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockResolvedValue({ data: [], error: null }),
          ilike: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          limit: jest.fn().mockResolvedValue({
            data: [{ id: 'user-456', name: 'Jane Reader', avatar: null }],
            error: null,
          }),
          single: jest.fn().mockResolvedValue({
            data: { leaderboard_visible: true },
            error: null,
          }),
        };
        return chain;
      });

      const res = await request(app).get('/api/leaderboard/search?q=Jane');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
    });
  });
});
