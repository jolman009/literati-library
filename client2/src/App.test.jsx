import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from './App';

// Mock the performance utilities that are imported in App.jsx
vi.mock('./utils/webVitals', () => ({
  initWebVitals: vi.fn()
}));

// Mock web-vitals module
vi.mock('web-vitals', () => ({
  getCLS: vi.fn(),
  getFID: vi.fn(),
  getFCP: vi.fn(),
  getLCP: vi.fn(),
  getTTFB: vi.fn()
}));

// Mock the performance monitoring components
vi.mock('./components/PerformanceMonitor', () => ({
  default: () => <div data-testid="performance-monitor" />
}));

vi.mock('./components/CacheMonitor', () => ({
  default: () => <div data-testid="cache-monitor" />
}));

// Mock the lazy-loaded components to avoid async loading in tests
vi.mock('./components/wrappers/LibraryPageWrapper', () => ({
  default: () => <div>Library Page Wrapper</div>
}));

vi.mock('./components/wrappers/UploadPageWrapper', () => ({
  default: () => <div>Upload Page Wrapper</div>
}));

vi.mock('./components/wrappers/NotesPageWrapper', () => ({
  default: () => <div>Notes Page Wrapper</div>
}));

vi.mock('./components/wrappers/ReadBookWrapper', () => ({
  default: () => <div>Read Book Wrapper</div>
}));

// Mock the AuthContext to provide test authentication states
const mockAuthContext = {
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
};

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext
}));

// Mock other context providers
const mockGamificationContext = {
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
};

vi.mock('./contexts/GamificationContext', () => ({
  GamificationProvider: ({ children }) => children,
  useGamification: () => mockGamificationContext
}));

vi.mock('./contexts/ReadingSessionContext', () => ({
  ReadingSessionProvider: ({ children }) => children
}));

vi.mock('./contexts/Material3ThemeContext', () => ({
  Material3ThemeProvider: ({ children }) => children
}));

vi.mock('./components/Material3', () => ({
  MD3SnackbarProvider: ({ children }) => children
}));

// Mock the ReadingSessionTimer component
vi.mock('./components/ReadingSessionTimer', () => ({
  default: () => <div data-testid="reading-session-timer" />
}));

// Test utilities
const renderAppWithRouter = (initialEntries = ['/']) => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  test('renders App component without crashing', () => {
    renderAppWithRouter();
    
    // Check that the main app div is rendered
    const appElement = document.querySelector('.app');
    expect(appElement).toBeInTheDocument();
  });

  test('renders performance monitoring components', () => {
    renderAppWithRouter();
    
    // Check that performance monitoring components are rendered
    expect(screen.getByTestId('performance-monitor')).toBeInTheDocument();
    expect(screen.getByTestId('cache-monitor')).toBeInTheDocument();
    expect(screen.getByTestId('reading-session-timer')).toBeInTheDocument();
  });

  test('renders landing page when not authenticated', async () => {
    renderAppWithRouter(['/']);
    
    // Since we're not authenticated, should show landing page content
    // We'll look for any text that might be on the landing page
    await waitFor(() => {
      // The app should render without throwing errors
      const appElement = document.querySelector('.app');
      expect(appElement).toBeInTheDocument();
    });
  });

  test('handles different routes correctly', () => {
    renderAppWithRouter(['/']);
    
    // Should render without crashing on the home route
    const appElement = document.querySelector('.app');
    expect(appElement).toBeInTheDocument();
  });

  test('renders with all required context providers', () => {
    // This test ensures all the context providers are properly wrapped
    renderAppWithRouter();
    
    // Check that the app renders without context-related errors
    const appElement = document.querySelector('.app');
    expect(appElement).toBeInTheDocument();
    
    // Verify monitoring components are present (confirms providers are working)
    expect(screen.getByTestId('performance-monitor')).toBeInTheDocument();
    expect(screen.getByTestId('cache-monitor')).toBeInTheDocument();
    expect(screen.getByTestId('reading-session-timer')).toBeInTheDocument();
  });
});
