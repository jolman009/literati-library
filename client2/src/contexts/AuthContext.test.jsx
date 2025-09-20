import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor, render } from '@testing-library/react'

// Import the actual AuthContext without global mocks interfering
vi.unmock('./AuthContext')
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

    // Mock localStorage to return both token and user
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'literati_token') return mockToken
      if (key === 'literati_user') return JSON.stringify(mockUser)
      return null
    })

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

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('literati_token', mockResponse.token)
  })

  test('handles login failure', async () => {
    const errorMessage = 'Invalid credentials'
    global.fetch = vi.fn(() => Promise.resolve(createMockApiResponse({ error: errorMessage }, 401)))

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
    global.fetch = vi.fn(() => Promise.resolve(createMockApiResponse({ error: errorMessage }, 409)))

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
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('literati_token')
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

    // Mock localStorage to return both token and user initially
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'literati_token') return mockToken
      if (key === 'literati_user') return JSON.stringify(mockUser)
      return null
    })

    // Mock the profile endpoint to return refreshed user data (not a new token)
    mockFetch(createMockApiResponse(mockUser))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.refreshUser()
    })

    expect(result.current.token).toBe(mockToken) // Token stays the same
    expect(result.current.user).toEqual(mockUser)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('literati_user', JSON.stringify(mockUser))
  })

  test('handles token expiration', async () => {
    const expiredToken = 'expired-token'
    const mockUser = { id: '123', email: 'test@example.com' }

    // Mock localStorage to have token and user initially
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'literati_token') return expiredToken
      if (key === 'literati_user') return JSON.stringify(mockUser)
      return null
    })

    // Mock API call that returns 401 (token expired)
    global.fetch = vi.fn(() => Promise.resolve(createMockApiResponse({ error: 'Token expired' }, 401)))

    const { result } = renderAuthHook()

    // Load initial state
    await act(async () => {
      // Trigger an API call that will fail with 401
      await result.current.refreshUser()
    })

    await waitFor(() => {
      expect(result.current.token).toBeNull()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('literati_token')
    })
  })

  test('makeApiCall includes authorization header when authenticated', async () => {
    const mockToken = 'test-token'
    const mockUser = { id: '123', email: 'test@example.com' }

    // First login to get authenticated state
    mockFetch(createMockApiResponse({ user: mockUser, token: mockToken }))

    const { result } = renderAuthHook()

    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })

    // Verify authenticated state
    expect(result.current.isAuthenticated).toBe(true)

    // Test API call with authorization header
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

  test('hasRole checks user roles correctly', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user', 'premium']
    }
    mockFetch(createMockApiResponse({ user: mockUser, token: 'test-token' }))

    const { result } = renderAuthHook()

    // Log in user with roles
    await act(async () => {
      await result.current.login('test@example.com', 'password')
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

    // Update profile - the API should return the updated data
    const updatedUser = { name: 'New Name' }
    mockFetch(createMockApiResponse(updatedUser))

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
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('literati_token')
  })

  test('throws error when useAuth is used outside AuthProvider', () => {
    // Temporarily mock console.error to avoid noise in test output
    const originalError = console.error
    console.error = vi.fn()

    // Create a component that tries to use useAuth outside provider
    const TestComponent = () => {
      useAuth()
      return null
    }

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    console.error = originalError
  })
})