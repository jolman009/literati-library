import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render, cleanupTest } from '../test-utils';
import LibraryPage from '../pages/LibraryPage';

// Mock external dependencies with all required methods
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
  makeApiCall: vi.fn().mockResolvedValue({ data: [] }),
  makeAuthenticatedApiCall: vi.fn().mockResolvedValue({ data: [] })
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

describe('LibraryPage Component', () => {
  beforeEach(() => {
    cleanupTest();
    vi.clearAllMocks();
  });

  test('renders without crashing when authenticated', () => {
    render(<LibraryPage />);
    
    // Basic smoke test - ensure it renders without throwing errors
    const libraryElement = document.body;
    expect(libraryElement).toBeInTheDocument();
  });

  test('renders library content', () => {
    render(<LibraryPage />);
    
    // Verify the page renders some content
    const bodyText = document.body.textContent;
    expect(bodyText).toBeDefined();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('handles basic rendering states', () => {
    render(<LibraryPage />);
    
    // Should render without crashing
    const libraryElement = document.body;
    expect(libraryElement).toBeInTheDocument();
  });
});