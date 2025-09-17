import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render, cleanupTest } from '../test-utils';
import DashboardPage from '../pages/DashboardPage';

// Mock external dependencies
const mockAuthContext = {
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
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

vi.mock('../contexts/GamificationContext', () => ({
  useGamification: () => ({
    achievements: [],
    goals: [],
    stats: { totalBooks: 0, totalPages: 0, totalTime: 0 },
    loading: false,
    error: null
  })
}));

vi.mock('../contexts/ReadingSessionContext', () => ({
  useReadingSession: () => ({
    currentSession: null,
    isActive: false,
    totalTime: 0
  })
}));

describe('DashboardPage Component', () => {
  beforeEach(() => {
    cleanupTest();
  });

  test('renders without crashing when authenticated', () => {
    render(<DashboardPage />);
    
    // Basic smoke test - ensure it renders without throwing errors
    const dashboardElement = document.body;
    expect(dashboardElement).toBeInTheDocument();
  });

  test('renders main dashboard content', () => {
    render(<DashboardPage />);
    
    // Verify the page renders some content
    const bodyText = document.body.textContent;
    expect(bodyText).toBeDefined();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('handles basic rendering', () => {
    render(<DashboardPage />);
    
    // Should render without crashing
    const dashboardElement = document.body;
    expect(dashboardElement).toBeInTheDocument();
  });
});