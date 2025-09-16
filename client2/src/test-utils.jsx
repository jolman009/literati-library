import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock the contexts to avoid import issues during testing
const MockAuthProvider = ({ children }) => {
  return <div data-testid="mock-auth-provider">{children}</div>
}

const MockMaterial3ThemeProvider = ({ children }) => {
  return <div data-testid="mock-theme-provider">{children}</div>
}

const MockGamificationProvider = ({ children }) => {
  return <div data-testid="mock-gamification-provider">{children}</div>
}

const MockReadingSessionProvider = ({ children }) => {
  return <div data-testid="mock-reading-provider">{children}</div>
}


// All providers wrapper
const AllProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <MockMaterial3ThemeProvider>
        <MockAuthProvider>
          <MockGamificationProvider>
            <MockReadingSessionProvider>
              {children}
            </MockReadingSessionProvider>
          </MockGamificationProvider>
        </MockAuthProvider>
      </MockMaterial3ThemeProvider>
    </BrowserRouter>
  )
}

// Custom render function
const customRender = (ui, options = {}) => {
  const { wrapper = AllProviders, ...renderOptions } = options
  return render(ui, { wrapper, ...renderOptions })
}

// Test data generators
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  created_at: new Date().toISOString(),
  ...overrides
})

export const createMockBook = (overrides = {}) => ({
  id: '1',
  title: 'Test Book',
  author: 'Test Author',
  cover_url: null,
  file_url: null,
  file_type: 'pdf',
  user_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockNote = (overrides = {}) => ({
  id: '1',
  content: 'Test note content',
  page_number: 1,
  book_id: '1',
  user_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

export const createMockReadingSession = (overrides = {}) => ({
  id: '1',
  book_id: '1',
  user_id: '1',
  start_time: new Date().toISOString(),
  end_time: null,
  duration: 0,
  pages_read: 0,
  created_at: new Date().toISOString(),
  ...overrides
})

export const createMockAchievement = (overrides = {}) => ({
  id: '1',
  name: 'First Book',
  description: 'Read your first book',
  icon: '📚',
  condition_type: 'books_read',
  condition_value: 1,
  points: 100,
  unlocked: false,
  unlocked_at: null,
  ...overrides
})

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  status,
  data,
  headers: {},
  config: {}
})

export const mockApiError = (message = 'API Error', status = 500) => ({
  response: {
    status,
    data: { error: message }
  }
})

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }