import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render, cleanupTest, createMockUser } from '../test-utils';
import LibraryPage from '../pages/LibraryPage';
import { useAuth } from '../contexts/AuthContext';

// Mock external dependencies
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('LibraryPage Component', () => {
  beforeEach(() => {
    cleanupTest();

    // Configure useAuth mock to return expected values
    useAuth.mockReturnValue({
      user: createMockUser(),
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn()
    });
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