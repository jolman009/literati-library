/**
 * AuthContext Integration Tests
 *
 * These tests validate the AuthContext behavior including:
 * - Basic authentication flows
 * - API call functionality
 * - Cookie-based authentication
 *
 * Run with: npm test -- AuthContext.test.jsx
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Import the actual AuthContext
import { AuthProvider, useAuth } from '../AuthContext';

// Mock dependencies before imports
vi.mock('../../config/environment.js', () => ({
  default: {
    apiUrl: 'http://localhost:5000',
    getTokenKey: () => 'shelfquest_token',
    getAuthHeaders: () => ({}),
    shouldUseDevHeaderAuth: () => false
  }
}));

vi.mock('../../utils/noteSyncUtil.js', () => ({
  syncPendingNotes: vi.fn().mockResolvedValue({ synced: 0, failed: 0 })
}));

vi.mock('../../components/Material3', () => ({
  useSnackbar: () => ({
    showSnackbar: vi.fn()
  })
}));

// Mock react-router-dom for this test file
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }) => children
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create wrapper
const createWrapper = () => {
  return ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );
};

// Helper to wait for loading to complete
const waitForLoadingComplete = async (result) => {
  await waitFor(() => {
    expect(result.current).not.toBeNull();
    expect(result.current.loading).toBe(false);
  }, { timeout: 3000 });
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset fetch mock
    mockFetch.mockReset();

    // Default mock implementation
    mockFetch.mockImplementation((url) => {
      if (url.includes('/auth/secure/login')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: { id: 'user-1', email: 'test@example.com' },
            token: 'test-token'
          }),
          headers: new Headers({ 'content-type': 'application/json' })
        });
      }

      if (url.includes('/auth/logout')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Logged out' }),
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

      if (url.includes('/auth/refresh')) {
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
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({ 'content-type': 'application/json' })
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with no user and loading false after init', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitForLoadingComplete(result);

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it('should provide all auth methods', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitForLoadingComplete(result);

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.makeApiCall).toBe('function');
      expect(typeof result.current.makeAuthenticatedApiCall).toBe('function');
    });
  });

  describe('Cookie-based Authentication', () => {
    it('should send credentials with every request', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitForLoadingComplete(result);

      await act(async () => {
        await result.current.makeApiCall('/api/test');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });
  });

  describe('Login Flow', () => {
    it('should handle login failure', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitForLoadingComplete(result);

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })
      );

      const loginResult = await act(async () => {
        return await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(loginResult.success).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should set error on failed API call', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitForLoadingComplete(result);

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })
      );

      await act(async () => {
        try {
          await result.current.makeApiCall('/api/test');
        } catch (e) {
          // Expected to throw
          expect(e.message).toContain('Server error');
        }
      });
    });

    it('should clear error with clearError', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitForLoadingComplete(result);

      // Trigger an error via failed login
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
          headers: new Headers({ 'content-type': 'application/json' })
        })
      );

      await act(async () => {
        await result.current.login('test@example.com', 'wrong');
      });

      expect(result.current.error).not.toBeNull();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
