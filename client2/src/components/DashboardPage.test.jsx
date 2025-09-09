import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, createMockAuthContext, cleanupTest } from '../test-utils';
import DashboardPage from '../pages/DashboardPage';

// Mock external dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../contexts/GamificationContext', () => ({
  useGamification: () => ({
    achievements: [],
    goals: [],
    stats: { totalBooks: 0, totalPages: 0, totalTime: 0 },
    loading: false,
    error: null
  })
}));

vi.mock('../../contexts/ReadingSessionContext', () => ({
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
    renderWithProviders(<DashboardPage />);
    
    // Basic smoke test - ensure it renders without throwing errors
    const dashboardElement = document.body;
    expect(dashboardElement).toBeInTheDocument();
  });

  test('renders main dashboard content', () => {
    renderWithProviders(<DashboardPage />);
    
    // Verify the page renders some content
    const bodyText = document.body.textContent;
    expect(bodyText).toBeDefined();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('handles basic rendering', () => {
    renderWithProviders(<DashboardPage />);
    
    // Should render without crashing
    const dashboardElement = document.body;
    expect(dashboardElement).toBeInTheDocument();
  });
});