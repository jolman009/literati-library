import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Make vi globally available
global.vi = vi

// Mock modules that cause issues in test environment
vi.mock('epubjs', () => ({
  default: vi.fn(() => ({
    renderTo: vi.fn(),
    open: vi.fn(),
    destroy: vi.fn()
  })),
  Book: vi.fn()
}))

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(() => Promise.resolve({
    numPages: 1,
    getPage: vi.fn(() => Promise.resolve({
      render: vi.fn(),
      getViewport: vi.fn(() => ({ width: 100, height: 100 }))
    }))
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Extend expect with jest-dom matchers
expect.extend({})

// Global context mocks for use across all tests
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  deleteAccount: vi.fn(),
  refreshUser: vi.fn(),
  clearError: vi.fn(),
  hasRole: vi.fn(() => false),
  makeApiCall: vi.fn(),
  makeAuthenticatedApiCall: vi.fn(),
  ...overrides
});

export const createMockGamificationContext = (overrides = {}) => ({
  stats: {
    level: 1,
    totalPoints: 0,
    booksRead: 0,
    streakDays: 0,
    totalMinutesRead: 0,
    goals: [],
    achievements: []
  },
  loading: false,
  error: null,
  addPoints: vi.fn(),
  updateReadingTime: vi.fn(),
  completeGoal: vi.fn(),
  getAchievements: vi.fn(),
  clearError: vi.fn(),
  ...overrides
});

export const createMockReadingSessionContext = (overrides = {}) => ({
  currentSession: null,
  isReading: false,
  stats: {
    totalMinutesRead: 0,
    booksCompleted: 0,
    currentStreak: 0
  },
  startReading: vi.fn(),
  pauseReading: vi.fn(),
  stopReading: vi.fn(),
  updateProgress: vi.fn(),
  getStats: vi.fn(),
  loading: false,
  error: null,
  ...overrides
});

export const createMockMaterial3ThemeContext = (overrides = {}) => ({
  theme: 'light',
  isLight: true,
  isDark: false,
  actualTheme: 'light',
  toggleTheme: vi.fn(),
  setLightTheme: vi.fn(),
  setDarkTheme: vi.fn(),
  setSystemTheme: vi.fn(),
  generateThemeFromImage: vi.fn(),
  applyDynamicColors: vi.fn(),
  ...overrides
});