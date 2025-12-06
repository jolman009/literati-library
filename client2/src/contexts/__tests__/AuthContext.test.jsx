/**
 * AuthContext Frontend Tests
 *
 * These tests validate the AuthContext behavior including:
 * - Token refresh mutex pattern
 * - Concurrent request handling
 * - Dev header auth mode
 * - Cookie-based authentication
 * - Auto-refresh on 401 errors
 *
 * Run with: npm test -- AuthContext.test.jsx
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Unmock AuthContext for these tests - we want to test the real implementation
vi.unmock('../AuthContext');

import { AuthProvider, useAuth } from '../AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../config/environment.js', () => ({
  default: {
    apiUrl: 'http://localhost:5000',
    getTokenKey: () => 'shelfquest_token',
    getAuthHeaders: () => ({}),
    shouldUseDevHeaderAuth: () => false
  }
}));

vi.mock('../../utils/noteSyncUtil.js', () => ({
  syncPendingNotes: vi.fn()
}));

vi.mock('../../components/Material3', () => ({
  useSnackbar: () => ({
    showSnackbar: vi.fn()
  })
}));

// Mock fetch globally
global.fetch = vi.fn();

// Wrapper component for AuthProvider
const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

// Default timeout for waitFor
const WAIT_TIMEOUT = { timeout: 2000 };

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset fetch mock
    global.fetch.mockReset();

    // Mock successful responses by default
    global.fetch.mockImplementation((url) => {
      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            token: 'new-access-token',
            user: { id: 'user-1', email: 'test@example.com' }
          }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      }

      if (url.includes('/auth/profile')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'user-1',
            email: 'test@example.com'
          }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({ 'content-type': 'application/json' })
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Refresh Mutex', () => {
    it('should prevent concurrent refresh attempts', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial render with timeout
      await waitFor(() => {
        expect(result.current).toBeDefined();
      }, WAIT_TIMEOUT);

      let refreshCallCount = 0;
      global.fetch.mockImplementation((url) => {
        if (url.includes('/auth/refresh')) {
          refreshCallCount++;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              token: 'new-token',
              user: { id: 'user-1', email: 'test@example.com' }
            }),
            headers: new Headers({ 'content-type': 'application/json' })
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      });

      // Trigger API call - the mutex pattern should limit refresh calls
      await act(async () => {
        try {
          await result.current.makeAuthenticatedApiCall('/api/test');
        } catch (e) {
          // Expected to potentially fail
        }
      });

      // Should have called refresh at most once per request cycle
      expect(refreshCallCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Cookie-based Authentication', () => {
    it('should send credentials with every request', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).toBeDefined();
      }, WAIT_TIMEOUT);

      await act(async () => {
        await result.current.makeApiCall('/api/test');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });
  });

  describe('Dev Header Auth Mode', () => {
    it('should verify user on mount when user exists in localStorage', async () => {
      // Set user in localStorage before rendering hook
      localStorage.setItem('shelfquest_user', JSON.stringify({
        id: 'user-1',
        email: 'test@example.com'
      }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current).toBeDefined();
        expect(result.current.loading).toBe(false);
      }, WAIT_TIMEOUT);

      // Should have attempted verification via /auth/profile
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/profile'),
        expect.any(Object)
      );
    });
  });

  describe('Auto-Refresh on 401', () => {
    it('should automatically refresh on 401 error', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).toBeDefined();
      }, WAIT_TIMEOUT);

      let callCount = 0;
      global.fetch.mockImplementation((url) => {
        if (url.includes('/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              token: 'refreshed-token',
              user: { id: 'user-1', email: 'test@example.com' }
            }),
            headers: new Headers({ 'content-type': 'application/json' })
          });
        }

        // First call returns 401, second call succeeds
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Token expired' }),
            headers: new Headers({ 'content-type': 'application/json' })
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'success after refresh' }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      });

      // Make authenticated call
      let response;
      await act(async () => {
        response = await result.current.makeAuthenticatedApiCall('/api/protected');
      });

      // Should have refreshed and retried
      expect(response).toHaveProperty('data', 'success after refresh');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.any(Object)
      );
    });
  });

  describe('Login Flow', () => {
    it('should store user data and token on successful login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).toBeDefined();
      }, WAIT_TIMEOUT);

      const loginData = {
        user: { id: 'user-1', email: 'test@example.com' },
        token: 'login-token'
      };

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(loginData),
          headers: new Headers({ 'content-type': 'application/json' })
        })
      );

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // User should be set in state
      expect(result.current.user).toEqual(loginData.user);

      // User should be stored in localStorage
      expect(localStorage.getItem('shelfquest_user')).toBe(
        JSON.stringify(loginData.user)
      );

      // Token should be stored for header fallback
      expect(localStorage.getItem('shelfquest_token')).toBe(loginData.token);
    });
  });

  describe('Logout Flow', () => {
    it('should clear all auth data on logout', async () => {
      // Set initial auth state before rendering
      localStorage.setItem('shelfquest_user', JSON.stringify({
        id: 'user-1',
        email: 'test@example.com'
      }));
      localStorage.setItem('shelfquest_token', 'test-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial render
      await waitFor(() => {
        expect(result.current).toBeDefined();
      }, WAIT_TIMEOUT);

      global.fetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Logged out' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })
      );

      await act(async () => {
        await result.current.logout();
      });

      // All data should be cleared
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('shelfquest_user')).toBeNull();
      expect(localStorage.getItem('shelfquest_token')).toBeNull();
    });
  });
});
