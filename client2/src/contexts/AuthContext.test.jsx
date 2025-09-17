import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import {
  cleanupTest,
  createMockSupabaseClient,
  createMockApiResponse,
  createMockApiError,
  mockFetch
} from '../test-utils'

// Mock axios
vi.mock('axios')

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => createMockSupabaseClient())
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('AuthContext', () => {
  beforeEach(() => {
    cleanupTest()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  const renderAuthHook = () => {
    return renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    })
  }

  test('provides initial auth state', () => {
    const { result } = renderAuthHook()

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  test('loads existing token from localStorage on mount', async () => {
    const mockToken = 'existing-token'
    const mockUser = { id: '123', email: 'test@example.com' }

    mockLocalStorage.getItem.mockReturnValue(mockToken)
    mockFetch(createMockApiResponse({ user: mockUser }))

    const { result } = renderAuthHook()

    await waitFor(() => {
      expect(result.current.token).toBe(mockToken)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  test('handles login success', async () => {
    const mockResponse = {
      user: { id: '123', email: 'test@example.com', name: 'Test User' },
      token: 'login-token'
    }

    mockFetch(createMockApiResponse(mockResponse))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    expect(result.current.user).toEqual(mockResponse.user)
    expect(result.current.token).toBe(mockResponse.token)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBeNull()

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockResponse.token)
  })

  test('handles login failure', async () => {
    const errorMessage = 'Invalid credentials'
    global.fetch = vi.fn(() => Promise.reject(createMockApiError(errorMessage, 401)))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword')
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toContain(errorMessage)
  })

  test('handles registration success', async () => {
    const mockResponse = {
      user: { id: '456', email: 'new@example.com', name: 'New User' },
      token: 'register-token'
    }

    mockFetch(createMockApiResponse(mockResponse))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.register('new@example.com', 'password', 'New User')
    })

    expect(result.current.user).toEqual(mockResponse.user)
    expect(result.current.token).toBe(mockResponse.token)
    expect(result.current.isAuthenticated).toBe(true)
  })

  test('handles registration failure', async () => {
    const errorMessage = 'Email already exists'
    global.fetch = vi.fn(() => Promise.reject(createMockApiError(errorMessage, 409)))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.register('existing@example.com', 'password', 'User')
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toContain(errorMessage)
  })

  test('handles logout', async () => {
    // First log in
    const mockUser = { id: '123', email: 'test@example.com' }
    mockFetch(createMockApiResponse({ user: mockUser, token: 'test-token' }))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    // Then logout
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
  })

  test('clears error when clearError is called', async () => {
    // First cause an error
    global.fetch = vi.fn(() => Promise.reject(createMockApiError('Test error')))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword')
    })

    expect(result.current.error).toBeTruthy()

    // Clear the error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  test('handles token refresh', async () => {
    const mockToken = 'old-token'
    const newToken = 'refreshed-token'
    const mockUser = { id: '123', email: 'test@example.com' }

    mockLocalStorage.getItem.mockReturnValue(mockToken)

    // Mock refresh endpoint
    mockFetch(createMockApiResponse({ token: newToken, user: mockUser }))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.refreshUser()
    })

    expect(result.current.token).toBe(newToken)
    expect(result.current.user).toEqual(mockUser)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', newToken)
  })

  test('handles token expiration', async () => {
    const expiredToken = 'expired-token'
    mockLocalStorage.getItem.mockReturnValue(expiredToken)

    // Mock API call that returns 401 (token expired)
    global.fetch = vi.fn(() => Promise.reject(createMockApiError('Token expired', 401)))

    const { result } = renderAuthHook()

    await waitFor(() => {
      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    })
  })

  test('makeApiCall includes authorization header when authenticated', async () => {
    const mockToken = 'test-token'
    const mockUser = { id: '123', email: 'test@example.com' }

    mockLocalStorage.getItem.mockReturnValue(mockToken)
    mockFetch(createMockApiResponse({ user: mockUser }))

    const { result } = renderAuthHook()

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    // Test API call
    const testData = { message: 'success' }
    mockFetch(createMockApiResponse(testData))

    await act(async () => {
      await result.current.makeAuthenticatedApiCall('/api/test')
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockToken}`
        })
      })
    )
  })

  test('hasRole checks user roles correctly', () => {
    const { result } = renderAuthHook()

    // Set user with roles
    act(() => {
      result.current.user = {
        id: '123',
        email: 'test@example.com',
        roles: ['user', 'premium']
      }
    })

    expect(result.current.hasRole('user')).toBe(true)
    expect(result.current.hasRole('premium')).toBe(true)
    expect(result.current.hasRole('admin')).toBe(false)
  })

  test('handles password change', async () => {
    // First log in
    const mockUser = { id: '123', email: 'test@example.com' }
    mockFetch(createMockApiResponse({ user: mockUser, token: 'test-token' }))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    // Change password
    mockFetch(createMockApiResponse({ message: 'Password changed successfully' }))

    await act(async () => {
      await result.current.changePassword('oldpassword', 'newpassword')
    })

    expect(result.current.error).toBeNull()
  })

  test('handles profile update', async () => {
    // First log in
    const mockUser = { id: '123', email: 'test@example.com', name: 'Old Name' }
    mockFetch(createMockApiResponse({ user: mockUser, token: 'test-token' }))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    // Update profile
    const updatedUser = { ...mockUser, name: 'New Name' }
    mockFetch(createMockApiResponse({ user: updatedUser }))

    await act(async () => {
      await result.current.updateProfile({ name: 'New Name' })
    })

    expect(result.current.user.name).toBe('New Name')
  })

  test('handles account deletion', async () => {
    // First log in
    const mockUser = { id: '123', email: 'test@example.com' }
    mockFetch(createMockApiResponse({ user: mockUser, token: 'test-token' }))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    // Delete account
    mockFetch(createMockApiResponse({ message: 'Account deleted' }))

    await act(async () => {
      await result.current.deleteAccount('password')
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
  })

  test('throws error when useAuth is used outside AuthProvider', () => {
    // Temporarily mock console.error to avoid noise in test output
    const originalError = console.error
    console.error = vi.fn()

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    console.error = originalError
  })
})