import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock AuthContext for testing
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

// Mock GamificationContext for testing
export const createMockGamificationContext = (overrides = {}) => ({
  achievements: [],
  goals: [],
  stats: { totalBooks: 0, totalPages: 0, totalTime: 0 },
  loading: false,
  error: null,
  refreshAchievements: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  ...overrides
});

// Mock ReadingSessionContext for testing
export const createMockReadingSessionContext = (overrides = {}) => ({
  currentSession: null,
  isActive: false,
  totalTime: 0,
  startSession: vi.fn(),
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  stopSession: vi.fn(),
  ...overrides
});

// Mock Material3ThemeContext for testing
export const createMockMaterial3ThemeContext = (overrides = {}) => ({
  theme: 'light',
  setTheme: vi.fn(),
  toggleTheme: vi.fn(),
  ...overrides
});

// Test wrapper components
export const TestAuthProvider = ({ children, authContext }) => {
  // Mock the useAuth hook to return our test context
  vi.mock('../contexts/AuthContext', () => ({
    AuthProvider: ({ children }) => children,
    useAuth: () => authContext || createMockAuthContext()
  }));
  
  return children;
};

export const TestGamificationProvider = ({ children, gamificationContext }) => {
  vi.mock('../contexts/GamificationContext', () => ({
    GamificationProvider: ({ children }) => children,
    useGamification: () => gamificationContext || createMockGamificationContext()
  }));
  
  return children;
};

export const TestReadingSessionProvider = ({ children, readingSessionContext }) => {
  vi.mock('../contexts/ReadingSessionContext', () => ({
    ReadingSessionProvider: ({ children }) => children,
    useReadingSession: () => readingSessionContext || createMockReadingSessionContext()
  }));
  
  return children;
};

export const TestMaterial3ThemeProvider = ({ children, themeContext }) => {
  vi.mock('../contexts/Material3ThemeContext', () => ({
    Material3ThemeProvider: ({ children }) => children,
    useMaterial3Theme: () => themeContext || createMockMaterial3ThemeContext()
  }));
  
  return children;
};

// All-in-one test providers wrapper
export const AllTestProviders = ({ 
  children, 
  authContext, 
  gamificationContext, 
  readingSessionContext,
  themeContext,
  initialRoutes = ['/']
}) => {
  return (
    <MemoryRouter initialEntries={initialRoutes}>
      <TestAuthProvider authContext={authContext}>
        <TestGamificationProvider gamificationContext={gamificationContext}>
          <TestReadingSessionProvider readingSessionContext={readingSessionContext}>
            <TestMaterial3ThemeProvider themeContext={themeContext}>
              {children}
            </TestMaterial3ThemeProvider>
          </TestReadingSessionProvider>
        </TestGamificationProvider>
      </TestAuthProvider>
    </MemoryRouter>
  );
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    authContext,
    gamificationContext,
    readingSessionContext,
    themeContext,
    initialRoutes,
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <AllTestProviders
      authContext={authContext}
      gamificationContext={gamificationContext}
      readingSessionContext={readingSessionContext}
      themeContext={themeContext}
      initialRoutes={initialRoutes}
    >
      {children}
    </AllTestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Custom render function with just Router (for simpler tests)
export const renderWithRouter = (ui, { initialEntries = ['/'], ...options } = {}) => {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock localStorage for tests
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  return localStorageMock;
};

// Mock fetch for API calls
export const mockFetch = (mockResponse = {}, status = 200) => {
  const mockFn = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(mockResponse),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
      headers: new Headers({ 'content-type': 'application/json' })
    })
  );

  global.fetch = mockFn;
  return mockFn;
};

// Utility to wait for async operations in tests
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Common test scenarios
export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2023-01-01T00:00:00Z'
};

export const TEST_BOOK = {
  id: 'test-book-id',
  title: 'Test Book',
  author: 'Test Author',
  file_path: '/test/path/book.pdf',
  cover_image: '/test/path/cover.jpg',
  created_at: '2023-01-01T00:00:00Z'
};

export const TEST_NOTE = {
  id: 'test-note-id',
  book_id: 'test-book-id',
  content: 'This is a test note',
  page_number: 1,
  created_at: '2023-01-01T00:00:00Z'
};

// Test cleanup utility
export const cleanupTest = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  
  // Clear localStorage mock
  if (window.localStorage) {
    window.localStorage.clear();
  }
  
  // Reset fetch mock
  if (global.fetch && vi.isMockFunction(global.fetch)) {
    global.fetch.mockClear();
  }
};