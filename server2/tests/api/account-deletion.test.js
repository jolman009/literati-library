const request = require('supertest');
const express = require('express');

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('../../src/middlewares/advancedSecurity.js', () => ({
  advancedSecuritySuite: {
    rateLimit: {
      sensitive: (req, res, next) => next(),
    },
  },
}));

jest.mock('../../src/middlewares/enhancedAuth.js', () => ({
  ACCESS_COOKIE_OPTIONS: { httpOnly: true, path: '/api' },
  REFRESH_COOKIE_OPTIONS: { httpOnly: true, path: '/api/auth' },
}));

// Per-table mock control
const tableMocks = {};

jest.mock('../../src/config/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (tableMocks[table]) return tableMocks[table]();

      // Default chain
      const chain = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn((cb) => { cb({ error: null }); return chain; }),
      };
      return chain;
    }),
  },
}));

const bcrypt = require('bcryptjs');
const { supabase } = require('../../src/config/supabaseClient.js');

describe('Account Deletion API (GDPR Article 17)', () => {
  let app;
  let auditInsertSpy;
  let deleteEqSpy;

  const mockAuth = (req, res, next) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  };

  beforeAll(async () => {
    const { default: accountDeletionRouter } = await import('../../src/routes/accountDeletion.js');
    app = express();
    app.use(express.json());
    app.use('/api/account', accountDeletionRouter(mockAuth));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(tableMocks).forEach(k => delete tableMocks[k]);
    auditInsertSpy = null;
    deleteEqSpy = null;
  });

  function setupUserFound(userData = { id: 'user-123', email: 'test@example.com', password: 'hashed', name: 'Test' }) {
    // Users table — used for both fetch and delete
    let callCount = 0;
    tableMocks.users = () => {
      callCount++;
      if (callCount === 1) {
        // First call: fetch user (select → eq → single)
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: userData, error: null }),
        };
        return chain;
      } else {
        // Second call: delete user (delete → eq)
        deleteEqSpy = jest.fn().mockReturnValue({ error: null });
        const chain = {
          delete: jest.fn().mockReturnThis(),
          eq: deleteEqSpy,
        };
        return chain;
      }
    };

    // Audit log
    tableMocks.security_audit_log = () => {
      auditInsertSpy = jest.fn().mockReturnThis();
      const chain = {
        insert: auditInsertSpy,
        then: jest.fn((cb) => { cb({ error: null }); return chain; }),
      };
      return chain;
    };
  }

  function setupUserNotFound() {
    tableMocks.users = () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      };
      return chain;
    };
  }

  function setupDeleteFails() {
    let callCount = 0;
    tableMocks.users = () => {
      callCount++;
      if (callCount === 1) {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 'user-123', email: 'test@example.com', password: 'hashed', name: 'Test' },
            error: null,
          }),
        };
        return chain;
      } else {
        deleteEqSpy = jest.fn().mockReturnValue({ error: { message: 'FK constraint' } });
        const chain = {
          delete: jest.fn().mockReturnThis(),
          eq: deleteEqSpy,
        };
        return chain;
      }
    };

    tableMocks.security_audit_log = () => {
      const chain = {
        insert: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => { cb({ error: null }); return chain; }),
      };
      return chain;
    };
  }

  describe('DELETE /api/account', () => {
    it('should require confirmation string', async () => {
      const res = await request(app)
        .delete('/api/account')
        .send({ password: 'mypassword', confirmation: 'wrong' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CONFIRMATION_REQUIRED');
    });

    it('should require password', async () => {
      const res = await request(app)
        .delete('/api/account')
        .send({ confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PASSWORD_REQUIRED');
    });

    it('should return 404 if user not found', async () => {
      setupUserNotFound();

      const res = await request(app)
        .delete('/api/account')
        .send({ password: 'mypassword', confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });

    it('should return 403 for wrong password', async () => {
      setupUserFound();
      bcrypt.compare.mockResolvedValueOnce(false);

      const res = await request(app)
        .delete('/api/account')
        .send({ password: 'wrongpassword', confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('INVALID_PASSWORD');
    });

    it('should delete account on valid request', async () => {
      setupUserFound();
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .delete('/api/account')
        .send({ password: 'mypassword', confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
      expect(res.body.message).toContain('permanently deleted');
    });

    it('should return 500 if deletion fails', async () => {
      setupDeleteFails();
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .delete('/api/account')
        .send({ password: 'mypassword', confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('DELETION_FAILED');
    });

    it('should log audit event before deletion', async () => {
      setupUserFound();
      bcrypt.compare.mockResolvedValueOnce(true);

      await request(app)
        .delete('/api/account')
        .send({ password: 'mypassword', confirmation: 'DELETE MY ACCOUNT' });

      expect(supabase.from).toHaveBeenCalledWith('security_audit_log');
      expect(auditInsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          action: 'account_deleted',
        })
      );
    });

    it('should clear auth cookies on deletion', async () => {
      setupUserFound();
      bcrypt.compare.mockResolvedValueOnce(true);

      const res = await request(app)
        .delete('/api/account')
        .send({ password: 'mypassword', confirmation: 'DELETE MY ACCOUNT' });

      expect(res.status).toBe(200);
      // Check that set-cookie headers include clearing
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('accessToken=;'))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken=;'))).toBe(true);
    });
  });
});
