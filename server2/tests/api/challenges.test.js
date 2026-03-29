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
        gte: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
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

describe('Challenges API', () => {
  let app;

  const mockAuth = (req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  };

  beforeAll(async () => {
    const { challengesRouter } = await import('../../src/routes/challenges.js');
    app = express();
    app.use(express.json());
    app.use('/api/challenges', challengesRouter(mockAuth));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(tableMocks).forEach(k => delete tableMocks[k]);

    // Default: all DB queries return empty
    const { supabase } = require('../../src/config/supabaseClient.js');
    supabase.from.mockImplementation((table) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [], error: null }),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      return chain;
    });
  });

  describe('GET /api/challenges/daily', () => {
    it('should return 3 daily challenges', async () => {
      const res = await request(app).get('/api/challenges/daily');

      expect(res.status).toBe(200);
      expect(res.body.challenges).toHaveLength(3);
      expect(res.body.period).toBe('daily');
      expect(res.body).toHaveProperty('period_start');
      expect(res.body).toHaveProperty('resets_at');

      res.body.challenges.forEach(challenge => {
        expect(challenge).toHaveProperty('id');
        expect(challenge).toHaveProperty('title');
        expect(challenge).toHaveProperty('description');
        expect(challenge).toHaveProperty('reward_points');
        expect(challenge).toHaveProperty('current_progress');
        expect(challenge).toHaveProperty('progress_percent');
        expect(challenge).toHaveProperty('is_completed');
        expect(challenge.type).toBe('daily');
      });
    });

    it('should show 0 progress when no activity', async () => {
      const res = await request(app).get('/api/challenges/daily');

      expect(res.status).toBe(200);
      res.body.challenges.forEach(challenge => {
        expect(challenge.current_progress).toBe(0);
        expect(challenge.is_completed).toBe(false);
      });
    });
  });

  describe('GET /api/challenges/weekly', () => {
    it('should return 3 weekly challenges', async () => {
      const res = await request(app).get('/api/challenges/weekly');

      expect(res.status).toBe(200);
      expect(res.body.challenges).toHaveLength(3);
      expect(res.body.period).toBe('weekly');
      expect(res.body).toHaveProperty('resets_at');

      res.body.challenges.forEach(challenge => {
        expect(challenge.type).toBe('weekly');
        expect(challenge.reward_points).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/challenges/all', () => {
    it('should return both daily and weekly challenges', async () => {
      const res = await request(app).get('/api/challenges/all');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('daily');
      expect(res.body).toHaveProperty('weekly');
      expect(res.body.daily.challenges).toHaveLength(3);
      expect(res.body.weekly.challenges).toHaveLength(3);
      expect(res.body.daily).toHaveProperty('resets_at');
      expect(res.body.weekly).toHaveProperty('resets_at');
    });
  });

  describe('POST /api/challenges/:id/claim', () => {
    it('should return 400 without type and period_start', async () => {
      const res = await request(app)
        .post('/api/challenges/daily_read_30/claim')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should return 404 for unknown challenge id', async () => {
      const res = await request(app)
        .post('/api/challenges/nonexistent/claim')
        .send({ type: 'daily', period_start: '2026-03-28' });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 400 if challenge not completed', async () => {
      // reading_time progress = 0 (no sessions)
      const res = await request(app)
        .post('/api/challenges/daily_read_30/claim')
        .send({ type: 'daily', period_start: '2026-03-28' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('not completed');
      expect(res.body).toHaveProperty('current_progress');
    });

    it('should claim completed challenge reward', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation((table) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ error: null }),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockResolvedValue({
            data: [{ duration: 60 }], // 60 min > 30 min requirement
            error: null,
          }),
          single: jest.fn().mockResolvedValue({ data: null, error: null }), // no existing claim
        };
        return chain;
      });

      const res = await request(app)
        .post('/api/challenges/daily_read_30/claim')
        .send({ type: 'daily', period_start: '2026-03-28' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reward_points).toBe(25);
      expect(res.body.challenge_id).toBe('daily_read_30');
    });

    it('should reject already-claimed reward', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation((table) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockResolvedValue({
            data: [{ duration: 60 }],
            error: null,
          }),
          single: jest.fn().mockResolvedValue({
            data: { reward_claimed: true }, // already claimed
            error: null,
          }),
        };
        return chain;
      });

      const res = await request(app)
        .post('/api/challenges/daily_read_30/claim')
        .send({ type: 'daily', period_start: '2026-03-28' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already claimed');
    });
  });

  describe('GET /api/challenges/history', () => {
    it('should return completed challenges history', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            { challenge_id: 'daily_read_30', challenge_type: 'daily', is_completed: true, completed_at: '2026-03-27' },
          ],
          error: null,
        }),
      }));

      const res = await request(app).get('/api/challenges/history');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toHaveProperty('title');
      expect(res.body[0]).toHaveProperty('reward_points');
    });
  });

  describe('GET /api/challenges/stats', () => {
    it('should return challenge completion statistics', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { challenge_type: 'daily', is_completed: true, reward_claimed: true },
            { challenge_type: 'daily', is_completed: true, reward_claimed: false },
            { challenge_type: 'weekly', is_completed: true, reward_claimed: true },
            { challenge_type: 'weekly', is_completed: false, reward_claimed: false },
          ],
          error: null,
        }),
      }));

      const res = await request(app).get('/api/challenges/stats');

      expect(res.status).toBe(200);
      expect(res.body.total_challenges_completed).toBe(3);
      expect(res.body.daily_completed).toBe(2);
      expect(res.body.weekly_completed).toBe(1);
      expect(res.body.total_rewards_claimed).toBe(2);
    });

    it('should return zeros when no challenge data', async () => {
      const { supabase } = require('../../src/config/supabaseClient.js');
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }));

      const res = await request(app).get('/api/challenges/stats');

      expect(res.status).toBe(200);
      expect(res.body.total_challenges_completed).toBe(0);
    });
  });
});
