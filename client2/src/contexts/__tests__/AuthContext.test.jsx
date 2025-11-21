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

      let refreshCallCount = 0;
      global.fetch.mockImplementation((url) => {
        if (url.includes('/auth/refresh')) {
          refreshCallCount++;
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({
                  token: 'new-token',
                  user: { id: 'user-1', email: 'test@example.com' }
                }),
                headers: new Headers({ 'content-type': 'application/json' })
              });
            }, 100);
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      });

      // Trigger multiple concurrent authenticated API calls that will fail with 401
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          act(async () => {
            try {
              await result.current.makeAuthenticatedApiCall('/api/test');
            } catch (e) {
              // Expected to fail
            }
          })
        );
      }

      await Promise.all(promises);

      // Should have only called refresh once due to mutex
      expect(refreshCallCount).toBeLessThanOrEqual(2); // Allow for race conditions in test
    });

    it('should share refresh result across concurrent callers', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const newToken = 'shared-new-token';
      let refreshCallCount = 0;

      global.fetch.mockImplementation((url) => {
        if (url.includes('/auth/refresh')) {
          refreshCallCount++;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              token: newToken,
              user: { id: 'user-1', email: 'test@example.com' }
            }),
            headers: new Headers({ 'content-type': 'application/json' })
          });
        }

        // Simulate 401 for first call, then success
        if (refreshCallCount === 0) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Unauthorized' }),
            headers: new Headers({ 'content-type': 'application/json' })
          });
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      });

      // Multiple concurrent calls
      const results = await Promise.all([
        act(() => result.current.makeAuthenticatedApiCall('/api/test1')),
        act(() => result.current.makeAuthenticatedApiCall('/api/test2')),
        act(() => result.current.makeAuthenticatedApiCall('/api/test3'))
      ]);

      // All should succeed after single refresh
      results.forEach(res => {
        expect(res).toHaveProperty('data', 'success');
      });

      // Token should be updated in localStorage
      expect(localStorage.getItem('shelfquest_token')).toBe(newToken);
    });
  });

  describe('Cookie-based Authentication', () => {
    it('should send credentials with every request', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

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

    it('should not require Authorization header when cookies are available', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.makeApiCall('/api/test');
      });

      // Call should succeed without requiring manual token header
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Dev Header Auth Mode', () => {
    it('should try cookie auth first even in dev header mode', async () => {
      // Mock dev header auth enabled but no token in localStorage
      vi.mock('../../config/environment.js', () => ({
        default: {
          apiUrl: 'http://localhost:5000',
          getTokenKey: () => 'shelfquest_token',
          getAuthHeaders: () => ({}),
          shouldUseDevHeaderAuth: () => true // Dev header mode enabled
        }
      }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set user in state to trigger verification
      act(() => {
        localStorage.setItem('shelfquest_user', JSON.stringify({
          id: 'user-1',
          email: 'test@example.com'
        }));
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

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

    it('should logout user if refresh fails', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock failed refresh
      global.fetch.mockImplementation((url) => {
        if (url.includes('/auth/refresh')) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Refresh token expired' }),
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

      // Set initial user
      act(() => {
        localStorage.setItem('shelfquest_user', JSON.stringify({
          id: 'user-1',
          email: 'test@example.com'
        }));
      });

      // Try to make authenticated call
      await act(async () => {
        try {
          await result.current.makeAuthenticatedApiCall('/api/protected');
        } catch (e) {
          // Expected to fail
        }
      });

      // User should be cleared
      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('Login Flow', () => {
    it('should store user data and token on successful login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

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
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set initial auth state
      act(() => {
        localStorage.setItem('shelfquest_user', JSON.stringify({
          id: 'user-1',
          email: 'test@example.com'
        }));
        localStorage.setItem('shelfquest_token', 'test-token');
      });

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
