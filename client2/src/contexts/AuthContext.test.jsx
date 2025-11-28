/**
 * AuthContext Unit Tests
 *
 * Basic unit tests for AuthContext functionality.
 * Note: Some async login/logout tests are in __tests__/AuthContext.test.jsx
 */

import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor, render } from '@testing-library/react';

// Import the actual AuthContext
import { AuthProvider, useAuth } from './AuthContext';

// Mock all dependencies
vi.mock('../config/environment.js', () => ({
  default: {
    apiUrl: 'http://localhost:5000',
    getTokenKey: () => 'shelfquest_token',
    getAuthHeaders: () => ({}),
    shouldUseDevHeaderAuth: () => false
  }
}));

vi.mock('../utils/noteSyncUtil.js', () => ({
  syncPendingNotes: vi.fn().mockResolvedValue({ synced: 0, failed: 0 })
}));

vi.mock('../components/Material3', () => ({
  useSnackbar: () => ({
    showSnackbar: vi.fn()
  })
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  BrowserRouter: ({ children }) => children
}));

// Mock fetch
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
    localStorage.clear();
    mockFetch.mockReset();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        headers: new Headers({ 'content-type': 'application/json' })
      })
    );
  });

  test('provides initial auth state', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoadingComplete(result);

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('provides all required auth methods', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoadingComplete(result);

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.updateProfile).toBe('function');
    expect(typeof result.current.changePassword).toBe('function');
    expect(typeof result.current.makeApiCall).toBe('function');
    expect(typeof result.current.makeAuthenticatedApiCall).toBe('function');
    expect(typeof result.current.hasRole).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  test('handles login failure', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoadingComplete(result);

    const errorMessage = 'Invalid credentials';
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: errorMessage }),
        headers: new Headers({ 'content-type': 'application/json' })
      })
    );

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toContain(errorMessage);
  });

  test('clears error when clearError is called', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitForLoadingComplete(result);

    // First cause an error
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Test error' }),
        headers: new Headers({ 'content-type': 'application/json' })
      })
    );

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(result.current.error).toBeTruthy();

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  test('throws error when useAuth is used outside AuthProvider', () => {
    const originalError = console.error;
    console.error = vi.fn();

    const TestComponent = () => {
      useAuth();
      return null;
    };

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });
});
