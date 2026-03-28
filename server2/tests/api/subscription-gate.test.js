const express = require('express');
const request = require('supertest');

// Mock Supabase with per-table control
const mockSupabase = {};

jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn((table) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      if (mockSupabase[table]) {
        return mockSupabase[table](chain);
      }

      chain.single.mockResolvedValue({ data: null, error: null });
      return chain;
    }),
  },
}));

describe('Subscription Gate Middleware', () => {
  let app;
  let subscriptionGate;

  beforeAll(async () => {
    const mod = await import('../../src/middlewares/subscriptionGate.js');
    subscriptionGate = mod.subscriptionGate;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    Object.keys(mockSupabase).forEach(k => delete mockSupabase[k]);

    app = express();
    app.use(express.json());

    // Mock auth
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    const gate = subscriptionGate();
    app.post('/test', gate, (req, res) => {
      res.json({
        allowed: true,
        tier: req.subscriptionTier,
        usage: req.aiUsage,
      });
    });
  });

  it('should allow Pro users through', async () => {
    mockSupabase.users = (chain) => {
      chain.single.mockResolvedValue({
        data: { subscription_tier: 'pro', subscription_expires_at: null },
        error: null,
      });
      return chain;
    };

    const res = await request(app).post('/test');

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('pro');
  });

  it('should allow Pro users with valid expiry', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockSupabase.users = (chain) => {
      chain.single.mockResolvedValue({
        data: { subscription_tier: 'pro', subscription_expires_at: futureDate },
        error: null,
      });
      return chain;
    };

    const res = await request(app).post('/test');

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('pro');
  });

  it('should treat expired Pro as free user', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    mockSupabase.users = (chain) => {
      chain.single.mockResolvedValue({
        data: { subscription_tier: 'pro', subscription_expires_at: pastDate },
        error: null,
      });
      return chain;
    };

    // ai_usage — no existing row
    mockSupabase.ai_usage = (chain) => {
      chain.single.mockResolvedValue({ data: null, error: null });
      return chain;
    };

    const res = await request(app).post('/test');

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('free');
    expect(res.body.usage.used).toBe(1);
    expect(res.body.usage.limit).toBe(5);
  });

  it('should allow free users under limit', async () => {
    mockSupabase.users = (chain) => {
      chain.single.mockResolvedValue({
        data: { subscription_tier: 'free', subscription_expires_at: null },
        error: null,
      });
      return chain;
    };

    mockSupabase.ai_usage = (chain) => {
      chain.single.mockResolvedValue({ data: { call_count: 3 }, error: null });
      return chain;
    };

    const res = await request(app).post('/test');

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('free');
    expect(res.body.usage.used).toBe(4);
    expect(res.body.usage.limit).toBe(5);
  });

  it('should block free users at limit', async () => {
    mockSupabase.users = (chain) => {
      chain.single.mockResolvedValue({
        data: { subscription_tier: 'free', subscription_expires_at: null },
        error: null,
      });
      return chain;
    };

    mockSupabase.ai_usage = (chain) => {
      chain.single.mockResolvedValue({ data: { call_count: 5 }, error: null });
      return chain;
    };

    const res = await request(app).post('/test');

    expect(res.status).toBe(403);
    expect(res.body.upgradeRequired).toBe(true);
    expect(res.body.used).toBe(5);
    expect(res.body.limit).toBe(5);
  });

  it('should fail open on DB errors', async () => {
    mockSupabase.users = (chain) => {
      chain.single.mockResolvedValue({
        data: null,
        error: { message: 'connection timeout' },
      });
      return chain;
    };

    const res = await request(app).post('/test');

    // Fail open — request should pass through
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(true);
  });

  it('should return 401 without authenticated user', async () => {
    // Override app without auth middleware
    const noAuthApp = express();
    noAuthApp.use(express.json());
    const gate = subscriptionGate();
    noAuthApp.post('/test', gate, (req, res) => {
      res.json({ allowed: true });
    });

    const res = await request(noAuthApp).post('/test');

    expect(res.status).toBe(401);
  });

  it('should create new usage row for first-time free user', async () => {
    mockSupabase.users = (chain) => {
      chain.single.mockResolvedValue({
        data: { subscription_tier: 'free', subscription_expires_at: null },
        error: null,
      });
      return chain;
    };

    // No existing ai_usage row
    mockSupabase.ai_usage = (chain) => {
      chain.single.mockResolvedValue({ data: null, error: null });
      return chain;
    };

    const res = await request(app).post('/test');

    expect(res.status).toBe(200);
    expect(res.body.usage.used).toBe(1);
  });
});
