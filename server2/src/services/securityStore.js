// src/services/securityStore.js
// Persistent security state with write-through caching to Supabase PostgreSQL.
// Reads hit in-memory caches (fast). Writes update memory + async DB.
// On startup, caches are hydrated from DB.

import crypto from 'crypto';
import { supabase } from '../config/supabaseClient.js';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const FAMILY_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a token using SHA-256 for safe storage.
 * Raw JWTs are never persisted to the database.
 */
export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

class PersistentSecurityStore {
  constructor() {
    // In-memory caches (fast path for reads)
    this.tokenBlacklist = new Set();           // Set<tokenHash>
    this.refreshTokenFamilies = new Map();     // familyId -> { userId, tokens: Set<tokenHash>, createdAt }
    this.loginAttempts = new Map();            // identifier -> { count, lastAttempt }

    this.cleanupTimer = null;
    this.initialized = false;
  }

  // ═══════════════════════════════════════════════════════════
  // Initialization — hydrate caches from DB on startup
  // ═══════════════════════════════════════════════════════════

  async initialize() {
    try {
      await this._hydrateTokenBlacklist();
      await this._hydrateRefreshTokenFamilies();
      await this._hydrateLoginAttempts();

      // Start periodic cleanup
      this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);

      this.initialized = true;
      console.log('🔒 PersistentSecurityStore initialized successfully');
    } catch (error) {
      // Non-fatal: in-memory caches still work, just start empty
      console.warn('⚠️ PersistentSecurityStore initialization warning:', error.message);
      this.initialized = true; // Mark as initialized even if DB hydration fails
    }
  }

  async _hydrateTokenBlacklist() {
    const { data, error } = await supabase
      .from('token_blacklist')
      .select('token_hash, expires_at');

    if (error) {
      console.warn('⚠️ Failed to hydrate token blacklist:', error.message);
      return;
    }

    const now = new Date();
    let loaded = 0;
    for (const row of (data || [])) {
      if (new Date(row.expires_at) > now) {
        this.tokenBlacklist.add(row.token_hash);
        loaded++;
      }
    }
    console.log(`  ↳ Token blacklist: ${loaded} active entries loaded`);
  }

  async _hydrateRefreshTokenFamilies() {
    const { data, error } = await supabase
      .from('refresh_token_families')
      .select('family_id, user_id, tokens, created_at, last_used_at');

    if (error) {
      console.warn('⚠️ Failed to hydrate refresh token families:', error.message);
      return;
    }

    let loaded = 0;
    for (const row of (data || [])) {
      this.refreshTokenFamilies.set(row.family_id, {
        userId: row.user_id,
        tokens: new Set(row.tokens || []),
        createdAt: new Date(row.created_at).getTime()
      });
      loaded++;
    }
    console.log(`  ↳ Refresh token families: ${loaded} families loaded`);
  }

  async _hydrateLoginAttempts() {
    const { data, error } = await supabase
      .from('users')
      .select('email, failed_login_attempts, account_locked_until');

    if (error) {
      console.warn('⚠️ Failed to hydrate login attempts:', error.message);
      return;
    }

    let loaded = 0;
    for (const row of (data || [])) {
      if (row.failed_login_attempts > 0) {
        const lockedUntil = row.account_locked_until
          ? new Date(row.account_locked_until).getTime()
          : 0;
        this.loginAttempts.set(row.email, {
          count: row.failed_login_attempts,
          lastAttempt: lockedUntil > 0 ? lockedUntil - LOCKOUT_DURATION : Date.now(),
          lockedUntil
        });
        loaded++;
      }
    }
    console.log(`  ↳ Login attempts: ${loaded} tracked accounts loaded`);
  }

  // ═══════════════════════════════════════════════════════════
  // Token Blacklist
  // ═══════════════════════════════════════════════════════════

  /**
   * Blacklist a token. Adds to in-memory Set + persists to DB.
   * @param {string} token - Raw JWT string
   * @param {Date|number} [expiresAt] - When the token naturally expires
   */
  blacklistToken(token, expiresAt) {
    const hash = hashToken(token);
    this.tokenBlacklist.add(hash);

    // Default expiry: 24 hours from now (covers both access + refresh)
    const expiry = expiresAt
      ? (expiresAt instanceof Date ? expiresAt : new Date(expiresAt))
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Async write to DB (fire-and-forget with error logging)
    this._persistBlacklistedToken(hash, expiry).catch(err => {
      console.warn('⚠️ Failed to persist blacklisted token:', err.message);
    });
  }

  async _persistBlacklistedToken(hash, expiresAt) {
    const { error } = await supabase
      .from('token_blacklist')
      .upsert({
        token_hash: hash,
        expires_at: expiresAt.toISOString(),
        blacklisted_at: new Date().toISOString(),
        reason: 'logout'
      });

    if (error) {
      console.warn('⚠️ DB write failed for token blacklist:', error.message);
    }
  }

  /**
   * Check if a token is blacklisted. Fast in-memory lookup.
   * @param {string} token - Raw JWT string
   * @returns {boolean}
   */
  isTokenBlacklisted(token) {
    return this.tokenBlacklist.has(hashToken(token));
  }

  // ═══════════════════════════════════════════════════════════
  // Refresh Token Families
  // ═══════════════════════════════════════════════════════════

  /**
   * Store/update a token family. Updates in-memory Map + persists to DB.
   * @param {string} familyId
   * @param {string} userId
   * @param {string} token - Raw JWT to add to the family
   */
  storeTokenFamily(familyId, userId, token) {
    const hash = hashToken(token);

    if (!this.refreshTokenFamilies.has(familyId)) {
      this.refreshTokenFamilies.set(familyId, {
        userId,
        tokens: new Set(),
        createdAt: Date.now()
      });
    }

    const family = this.refreshTokenFamilies.get(familyId);
    family.tokens.add(hash);

    // Async persist
    this._persistTokenFamily(familyId, userId, family).catch(err => {
      console.warn('⚠️ Failed to persist token family:', err.message);
    });
  }

  async _persistTokenFamily(familyId, userId, family) {
    const { error } = await supabase
      .from('refresh_token_families')
      .upsert({
        family_id: familyId,
        user_id: userId,
        tokens: Array.from(family.tokens),
        last_used_at: new Date().toISOString()
      });

    if (error) {
      console.warn('⚠️ DB write failed for token family:', error.message);
    }
  }

  /**
   * Get a token family by ID. Fast in-memory lookup.
   * Returns the family object or undefined.
   *
   * IMPORTANT: The returned family's `tokens` Set contains hashes.
   * Use `familyHasToken(familyId, rawToken)` to check membership.
   */
  getTokenFamily(familyId) {
    return this.refreshTokenFamilies.get(familyId);
  }

  /**
   * Check if a raw token belongs to a family.
   * @param {string} familyId
   * @param {string} token - Raw JWT
   * @returns {boolean}
   */
  familyHasToken(familyId, token) {
    const family = this.refreshTokenFamilies.get(familyId);
    if (!family) return false;
    return family.tokens.has(hashToken(token));
  }

  /**
   * Remove a specific token from a family (e.g., after rotation).
   * @param {string} familyId
   * @param {string} token - Raw JWT to remove
   */
  removeTokenFromFamily(familyId, token) {
    const family = this.refreshTokenFamilies.get(familyId);
    if (!family) return;

    const hash = hashToken(token);
    family.tokens.delete(hash);

    // Async persist updated family
    this._persistTokenFamily(familyId, family.userId, family).catch(err => {
      console.warn('⚠️ Failed to persist token family update:', err.message);
    });
  }

  /**
   * Remove an entire token family (e.g., on breach detection or logout).
   * @param {string} familyId
   */
  removeTokenFamily(familyId) {
    this.refreshTokenFamilies.delete(familyId);

    // Async delete from DB
    this._deleteTokenFamily(familyId).catch(err => {
      console.warn('⚠️ Failed to delete token family from DB:', err.message);
    });
  }

  async _deleteTokenFamily(familyId) {
    const { error } = await supabase
      .from('refresh_token_families')
      .delete()
      .eq('family_id', familyId);

    if (error) {
      console.warn('⚠️ DB delete failed for token family:', error.message);
    }
  }

  /**
   * Get all family IDs for a given user.
   * @param {string} userId
   * @returns {string[]} array of familyId strings
   */
  getFamiliesForUser(userId) {
    const families = [];
    for (const [familyId, family] of this.refreshTokenFamilies.entries()) {
      if (family.userId === userId) {
        families.push(familyId);
      }
    }
    return families;
  }

  // ═══════════════════════════════════════════════════════════
  // Login Attempts / Account Lockout
  // ═══════════════════════════════════════════════════════════

  /**
   * Record a failed login attempt. Updates in-memory + DB.
   * @param {string} identifier - Typically the lowercase email
   */
  async recordFailedLogin(identifier) {
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();

    if (attempts.count >= LOCKOUT_THRESHOLD) {
      attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
    }

    this.loginAttempts.set(identifier, attempts);

    // Persist to users table
    try {
      const updateData = { failed_login_attempts: attempts.count };
      if (attempts.count >= LOCKOUT_THRESHOLD) {
        updateData.account_locked_until = new Date(attempts.lockedUntil).toISOString();
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('email', identifier);

      if (error) {
        console.warn('⚠️ Failed to persist login attempt:', error.message);
      }
    } catch (err) {
      console.warn('⚠️ Failed to persist login attempt:', err.message);
    }
  }

  /**
   * Get failed attempt count for an identifier. Fast in-memory lookup.
   * @param {string} identifier
   * @returns {{ count: number, lastAttempt: number, lockedUntil: number }}
   */
  getFailedAttempts(identifier) {
    return this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
  }

  /**
   * Clear failed attempts (e.g., after successful login). Updates memory + DB.
   * @param {string} identifier
   */
  async clearFailedAttempts(identifier) {
    this.loginAttempts.delete(identifier);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          failed_login_attempts: 0,
          account_locked_until: null
        })
        .eq('email', identifier);

      if (error) {
        console.warn('⚠️ Failed to clear login attempts in DB:', error.message);
      }
    } catch (err) {
      console.warn('⚠️ Failed to clear login attempts in DB:', err.message);
    }
  }

  /**
   * Check if an account is locked. Fast in-memory check.
   * @param {string} identifier
   * @returns {boolean}
   */
  isAccountLocked(identifier) {
    const attempts = this.loginAttempts.get(identifier);
    if (!attempts) return false;

    if (attempts.count >= LOCKOUT_THRESHOLD) {
      if (Date.now() < (attempts.lockedUntil || (attempts.lastAttempt + LOCKOUT_DURATION))) {
        return true;
      } else {
        // Lockout period expired — reset
        this.loginAttempts.delete(identifier);
        // Async DB reset
        supabase
          .from('users')
          .update({ failed_login_attempts: 0, account_locked_until: null })
          .eq('email', identifier)
          .then(({ error }) => {
            if (error) console.warn('⚠️ Failed to reset expired lockout in DB:', error.message);
          })
          .catch(() => {});
        return false;
      }
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════
  // Cleanup — purge expired entries from DB + memory
  // ═══════════════════════════════════════════════════════════

  async cleanup() {
    try {
      // 1. Remove expired blacklisted tokens
      const { error: blError } = await supabase
        .from('token_blacklist')
        .delete()
        .lte('expires_at', new Date().toISOString());

      if (blError) {
        console.warn('⚠️ Cleanup: failed to purge expired blacklist entries:', blError.message);
      }

      // Also clean in-memory blacklist by re-syncing from DB
      // (expired entries won't be returned)
      const { data: activeBlacklist } = await supabase
        .from('token_blacklist')
        .select('token_hash');

      if (activeBlacklist) {
        this.tokenBlacklist = new Set(activeBlacklist.map(r => r.token_hash));
      }

      // 2. Remove old token families (> 7 days)
      const cutoff = new Date(Date.now() - FAMILY_MAX_AGE).toISOString();
      const { error: famError } = await supabase
        .from('refresh_token_families')
        .delete()
        .lte('last_used_at', cutoff);

      if (famError) {
        console.warn('⚠️ Cleanup: failed to purge old token families:', famError.message);
      }

      // Clean in-memory families
      const now = Date.now();
      for (const [familyId, family] of this.refreshTokenFamilies.entries()) {
        if (now - family.createdAt > FAMILY_MAX_AGE) {
          this.refreshTokenFamilies.delete(familyId);
        }
      }

      console.log('🧹 Security store cleanup completed');
    } catch (error) {
      console.warn('⚠️ Security store cleanup error:', error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Shutdown — flush pending writes, clear intervals
  // ═══════════════════════════════════════════════════════════

  shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    console.log('🔒 PersistentSecurityStore shut down');
  }
}

// Singleton instance
const securityStore = new PersistentSecurityStore();

export { securityStore, PersistentSecurityStore };
export default securityStore;
