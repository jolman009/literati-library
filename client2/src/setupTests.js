import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Setup environment variables for tests
import.meta.env.VITE_API_BASE_URL = 'http://localhost:5000'
import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
import.meta.env.VITE_AI_SERVICE_URL = 'http://localhost:8000'
import.meta.env.NODE_ENV = 'test'
import.meta.env.MODE = 'test'

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

// Global context mocks that all tests can use
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    },
    token: 'test-token',
    loading: false,
    error: null,
    isAuthenticated: true,
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
    makeAuthenticatedApiCall: vi.fn()
  })
}))

vi.mock('./contexts/GamificationContext', () => ({
  GamificationProvider: ({ children }) => children,
  useGamification: () => ({
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
    clearError: vi.fn()
  })
}))

// Do not mock ReadingSessionContext globally; integration tests rely on real behavior

vi.mock('./contexts/Material3ThemeContext', () => ({
  Material3ThemeProvider: ({ children }) => children,
  useMaterial3Theme: () => ({
    theme: 'light',
    isLight: true,
    isDark: false,
    actualTheme: 'light',
    toggleTheme: vi.fn(),
    setLightTheme: vi.fn(),
    setDarkTheme: vi.fn(),
    setSystemTheme: vi.fn(),
    generateThemeFromImage: vi.fn(),
    applyDynamicColors: vi.fn()
  })
}))

// Mock React Router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Navigate: ({ children }) => children,
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/test' }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => {
    const React = require('react');
    return React.createElement('a', { href: to, ...props }, children);
  }
}))

// Mock Material3 components and hooks
vi.mock('./components/Material3', () => ({
  Material3ThemeProvider: ({ children }) => children,
  MD3SnackbarProvider: ({ children }) => children,
  useSnackbar: () => ({
    showSnackbar: vi.fn(),
    hideSnackbar: vi.fn()
  }),
  MD3Button: ({ children, onClick, ...props }) => {
    const React = require('react');
    return React.createElement('button', { onClick, 'data-testid': 'md3-button', ...props }, children);
  },
  MD3Card: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'md3-card', ...props }, children);
  },
  MD3Input: ({ value, onChange, ...props }) => {
    const React = require('react');
    return React.createElement('input', { value, onChange, 'data-testid': 'md3-input', ...props });
  }
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

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(() => Promise.resolve({ data: [] })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      put: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    })),
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

// Mock indexedDB
global.indexedDB = {
  open: vi.fn(() => Promise.resolve({
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve()),
          put: vi.fn(() => Promise.resolve()),
          delete: vi.fn(() => Promise.resolve()),
          clear: vi.fn(() => Promise.resolve())
        }))
      }))
    }
  })),
  deleteDatabase: vi.fn(() => Promise.resolve())
}

// Mock fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    clone: vi.fn()
  })
)

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

// Provide a resilient localStorage mock for environments where jsdom doesn't expose it
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  const ls = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(String(key), String(value)) },
    removeItem: (key) => { store.delete(String(key)) },
    clear: () => { store.clear() },
    key: (index) => Array.from(store.keys())[Number(index)] ?? null,
    get length() { return store.size }
  }
  // Ensure availability on all common globals and as an identifier in tests
  globalThis.localStorage = ls
  if (typeof window !== 'undefined') window.localStorage = ls
  // Vitest helper to create a global identifier
  if (typeof vi !== 'undefined' && vi.stubGlobal) vi.stubGlobal('localStorage', ls)
}

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
