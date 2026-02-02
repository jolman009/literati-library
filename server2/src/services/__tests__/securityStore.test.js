import crypto from 'crypto'

// Unmock securityStore so we test the REAL implementation
jest.unmock('../securityStore.js')

import { PersistentSecurityStore, hashToken } from '../securityStore.js'

// ── Supabase mock ──────────────────────────────────────────────
const mockSingle = jest.fn()
const mockChain = {
  select: jest.fn(function () { return this }),
  insert: jest.fn(function () { return this }),
  update: jest.fn(function () { return this }),
  delete: jest.fn(function () { return this }),
  upsert: jest.fn(function () { return this }),
  eq: jest.fn(function () { return this }),
  lte: jest.fn(function () { return this }),
  single: mockSingle,
  then: jest.fn(function (resolve) {
    return Promise.resolve({ data: [], error: null }).then(resolve)
  })
}

const mockFrom = jest.fn(() => ({ ...mockChain }))

jest.mock('../../config/supabaseClient.js', () => ({
  supabase: { from: (...args) => mockFrom(...args) },
  default: { from: (...args) => mockFrom(...args) }
}))

// ── Helpers ────────────────────────────────────────────────────
const hash = (token) => crypto.createHash('sha256').update(token).digest('hex')

describe('PersistentSecurityStore', () => {
  let store

  beforeEach(() => {
    jest.clearAllMocks()
    store = new PersistentSecurityStore()
  })

  afterEach(() => {
    store.shutdown()
  })

  // ═══════════════════════════════════════════════════════════
  // hashToken utility
  // ═══════════════════════════════════════════════════════════
  describe('hashToken', () => {
    it('should produce a 64-char hex SHA-256 hash', () => {
      const result = hashToken('test-token')
      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should produce consistent hashes for the same input', () => {
      const h1 = hashToken('my-jwt-token')
      const h2 = hashToken('my-jwt-token')
      expect(h1).toBe(h2)
    })

    it('should produce different hashes for different tokens', () => {
      const h1 = hashToken('token-a')
      const h2 = hashToken('token-b')
      expect(h1).not.toBe(h2)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Token Blacklisting
  // ═══════════════════════════════════════════════════════════
  describe('Token Blacklisting', () => {
    it('should blacklist a token and detect it', () => {
      store.blacklistToken('jwt-abc')
      expect(store.isTokenBlacklisted('jwt-abc')).toBe(true)
    })

    it('should not flag non-blacklisted tokens', () => {
      expect(store.isTokenBlacklisted('clean-token')).toBe(false)
    })

    it('should store the hash, not the raw token', () => {
      store.blacklistToken('raw-jwt-token')
      const expectedHash = hash('raw-jwt-token')
      expect(store.tokenBlacklist.has(expectedHash)).toBe(true)
      expect(store.tokenBlacklist.has('raw-jwt-token')).toBe(false)
    })

    it('should call supabase upsert with hashed token', async () => {
      // Create a chain that tracks upsert calls
      const upsertFn = jest.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValueOnce({ ...mockChain, upsert: upsertFn })

      store.blacklistToken('jwt-to-persist')

      // Give the async fire-and-forget time to execute
      await new Promise(r => setTimeout(r, 50))

      expect(mockFrom).toHaveBeenCalledWith('token_blacklist')
      expect(upsertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          token_hash: hash('jwt-to-persist'),
          reason: 'logout'
        })
      )
    })

    it('should still work in-memory when DB write fails', async () => {
      const upsertFn = jest.fn().mockResolvedValue({ error: { message: 'DB down' } })
      mockFrom.mockReturnValue({ ...mockChain, upsert: upsertFn })

      store.blacklistToken('token-despite-db-failure')
      await new Promise(r => setTimeout(r, 50))

      // In-memory state is still correct
      expect(store.isTokenBlacklisted('token-despite-db-failure')).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Refresh Token Families
  // ═══════════════════════════════════════════════════════════
  describe('Refresh Token Families', () => {
    it('should store and retrieve a token family', () => {
      store.storeTokenFamily('family-1', 'user-id-1', 'refresh-token-a')

      const family = store.getTokenFamily('family-1')
      expect(family).toBeDefined()
      expect(family.userId).toBe('user-id-1')
      expect(family.tokens.size).toBe(1)
    })

    it('should add multiple tokens to the same family', () => {
      store.storeTokenFamily('family-1', 'user-id-1', 'token-a')
      store.storeTokenFamily('family-1', 'user-id-1', 'token-b')

      const family = store.getTokenFamily('family-1')
      expect(family.tokens.size).toBe(2)
    })

    it('should check token membership with familyHasToken', () => {
      store.storeTokenFamily('family-1', 'user-id-1', 'token-a')

      expect(store.familyHasToken('family-1', 'token-a')).toBe(true)
      expect(store.familyHasToken('family-1', 'token-b')).toBe(false)
      expect(store.familyHasToken('nonexistent', 'token-a')).toBe(false)
    })

    it('should store hashed tokens, not raw', () => {
      store.storeTokenFamily('family-1', 'user-id-1', 'raw-refresh')

      const family = store.getTokenFamily('family-1')
      expect(family.tokens.has(hash('raw-refresh'))).toBe(true)
      expect(family.tokens.has('raw-refresh')).toBe(false)
    })

    it('should remove a token from a family', () => {
      store.storeTokenFamily('family-1', 'user-id-1', 'token-a')
      store.storeTokenFamily('family-1', 'user-id-1', 'token-b')

      store.removeTokenFromFamily('family-1', 'token-a')

      expect(store.familyHasToken('family-1', 'token-a')).toBe(false)
      expect(store.familyHasToken('family-1', 'token-b')).toBe(true)
    })

    it('should remove an entire family', () => {
      store.storeTokenFamily('family-1', 'user-id-1', 'token-a')
      store.removeTokenFamily('family-1')

      expect(store.getTokenFamily('family-1')).toBeUndefined()
    })

    it('should find all families for a user', () => {
      store.storeTokenFamily('family-a', 'user-1', 'token-1')
      store.storeTokenFamily('family-b', 'user-1', 'token-2')
      store.storeTokenFamily('family-c', 'user-2', 'token-3')

      const families = store.getFamiliesForUser('user-1')
      expect(families).toHaveLength(2)
      expect(families).toContain('family-a')
      expect(families).toContain('family-b')
    })

    it('should handle removeTokenFromFamily on nonexistent family gracefully', () => {
      expect(() => store.removeTokenFromFamily('no-family', 'token')).not.toThrow()
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Login Attempts / Account Lockout
  // ═══════════════════════════════════════════════════════════
  describe('Login Attempts', () => {
    it('should record and retrieve failed attempts', async () => {
      await store.recordFailedLogin('user@example.com')

      const attempts = store.getFailedAttempts('user@example.com')
      expect(attempts.count).toBe(1)
      expect(attempts.lastAttempt).toBeGreaterThan(0)
    })

    it('should accumulate failed attempts', async () => {
      await store.recordFailedLogin('user@example.com')
      await store.recordFailedLogin('user@example.com')
      await store.recordFailedLogin('user@example.com')

      expect(store.getFailedAttempts('user@example.com').count).toBe(3)
    })

    it('should lock account after threshold (5 attempts)', async () => {
      for (let i = 0; i < 5; i++) {
        await store.recordFailedLogin('user@example.com')
      }

      expect(store.isAccountLocked('user@example.com')).toBe(true)
    })

    it('should not lock account below threshold', async () => {
      for (let i = 0; i < 4; i++) {
        await store.recordFailedLogin('user@example.com')
      }

      expect(store.isAccountLocked('user@example.com')).toBe(false)
    })

    it('should clear failed attempts', async () => {
      await store.recordFailedLogin('user@example.com')
      await store.recordFailedLogin('user@example.com')
      await store.clearFailedAttempts('user@example.com')

      expect(store.getFailedAttempts('user@example.com').count).toBe(0)
      expect(store.isAccountLocked('user@example.com')).toBe(false)
    })

    it('should return false for unknown identifiers', () => {
      expect(store.isAccountLocked('unknown@example.com')).toBe(false)
    })

    it('should persist failed login to DB', async () => {
      const updateFn = jest.fn(function () { return this })
      const eqFn = jest.fn().mockResolvedValue({ error: null })
      mockFrom.mockReturnValue({
        ...mockChain,
        update: updateFn,
        eq: eqFn
      })

      await store.recordFailedLogin('user@example.com')

      expect(mockFrom).toHaveBeenCalledWith('users')
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ failed_login_attempts: 1 })
      )
    })

    it('should still work in-memory when DB persist fails', async () => {
      const updateFn = jest.fn(function () { return this })
      const eqFn = jest.fn().mockResolvedValue({ error: { message: 'DB error' } })
      mockFrom.mockReturnValue({
        ...mockChain,
        update: updateFn,
        eq: eqFn
      })

      await store.recordFailedLogin('user@example.com')

      // In-memory still tracked correctly
      expect(store.getFailedAttempts('user@example.com').count).toBe(1)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Initialization / Hydration
  // ═══════════════════════════════════════════════════════════
  describe('Initialization', () => {
    it('should mark as initialized after hydration', async () => {
      // Mock all three hydration queries to return empty data
      mockFrom.mockReturnValue({
        ...mockChain,
        then: jest.fn(function (resolve) {
          return Promise.resolve({ data: [], error: null }).then(resolve)
        })
      })

      await store.initialize()
      expect(store.initialized).toBe(true)
    })

    it('should still initialize when DB is unavailable', async () => {
      mockFrom.mockReturnValue({
        ...mockChain,
        then: jest.fn(function (resolve) {
          return Promise.resolve({ data: null, error: { message: 'Connection refused' } }).then(resolve)
        })
      })

      await store.initialize()
      expect(store.initialized).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Cleanup
  // ═══════════════════════════════════════════════════════════
  describe('Cleanup', () => {
    it('should remove expired families from memory', async () => {
      // Add a family with old createdAt
      store.refreshTokenFamilies.set('old-family', {
        userId: 'user-1',
        tokens: new Set(['h1']),
        createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000 // 8 days ago
      })
      store.refreshTokenFamilies.set('new-family', {
        userId: 'user-1',
        tokens: new Set(['h2']),
        createdAt: Date.now()
      })

      // Mock DB calls for cleanup
      const deleteFn = jest.fn(function () { return this })
      const lteFn = jest.fn().mockResolvedValue({ error: null })
      const selectFn = jest.fn(function () {
        return { then: jest.fn(resolve => Promise.resolve({ data: [], error: null }).then(resolve)) }
      })
      mockFrom.mockReturnValue({
        ...mockChain,
        delete: deleteFn,
        lte: lteFn,
        select: selectFn
      })

      await store.cleanup()

      expect(store.refreshTokenFamilies.has('old-family')).toBe(false)
      expect(store.refreshTokenFamilies.has('new-family')).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // Shutdown
  // ═══════════════════════════════════════════════════════════
  describe('Shutdown', () => {
    it('should clear cleanup interval', () => {
      store.cleanupTimer = setInterval(() => {}, 10000)
      const timerId = store.cleanupTimer

      store.shutdown()

      expect(store.cleanupTimer).toBeNull()
    })

    it('should be safe to call multiple times', () => {
      expect(() => {
        store.shutdown()
        store.shutdown()
      }).not.toThrow()
    })
  })
})
