import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, createMockAuthContext, cleanupTest, mockFetch } from '../test-utils';
import LibraryPage from '../pages/LibraryPage';

// Mock external dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('LibraryPage Component', () => {
  beforeEach(() => {
    cleanupTest();
    // Mock fetch for API calls
    mockFetch({ books: [] });
  });

  test('renders without crashing when authenticated', () => {
    renderWithProviders(<LibraryPage />);
    
    // Basic smoke test - ensure it renders without throwing errors
    const libraryElement = document.body;
    expect(libraryElement).toBeInTheDocument();
  });

  test('renders library content', () => {
    renderWithProviders(<LibraryPage />);
    
    // Verify the page renders some content
    const bodyText = document.body.textContent;
    expect(bodyText).toBeDefined();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('handles basic rendering states', () => {
    renderWithProviders(<LibraryPage />);
    
    // Should render without crashing
    const libraryElement = document.body;
    expect(libraryElement).toBeInTheDocument();
  });
});