import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, cleanupTest } from '../test-utils';
import LibraryPage from './LibraryPage';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../contexts/Material3ThemeContext', () => ({
  useMaterial3Theme: vi.fn()
}));

vi.mock('../contexts/ReadingSessionContext', () => ({
  useReadingSession: vi.fn()
}));

vi.mock('../contexts/GamificationContext', () => ({
  useGamification: vi.fn()
}));

const defaultBooks = [
  {
    id: '1',
    title: 'Alpha',
    author: 'Author A',
    language: 'English',
    format: 'pdf',
    file_type: 'application/pdf',
    created_at: '2026-01-01T00:00:00.000Z',
    completed: false,
    is_reading: false
  },
  {
    id: '2',
    title: 'Beta',
    author: 'Author B',
    language: 'Spanish',
    format: 'epub',
    file_type: 'application/epub+zip',
    filename: 'beta.epub',
    created_at: '2026-01-02T00:00:00.000Z',
    completed: false,
    is_reading: false
  },
  {
    id: '3',
    title: 'Gamma',
    author: 'Author C',
    language: 'english',
    file_type: 'application/epub+zip',
    created_at: '2026-01-03T00:00:00.000Z',
    completed: false,
    is_reading: false
  },
  {
    id: '4',
    title: 'Delta',
    author: 'Author D',
    language: null,
    file_type: 'application/pdf',
    created_at: '2026-01-04T00:00:00.000Z',
    completed: false,
    is_reading: false
  },
  {
    id: '5',
    title: 'Epsilon',
    author: 'Author E',
    language: 'French',
    file_type: 'application/octet-stream',
    filename: 'epsilon.epub',
    created_at: '2026-01-05T00:00:00.000Z',
    completed: false,
    is_reading: false
  },
  {
    id: '6',
    title: 'Zeta',
    author: 'Author F',
    language: null,
    file_type: null,
    filename: 'zeta.txt',
    created_at: '2026-01-06T00:00:00.000Z',
    completed: false,
    is_reading: false
  }
];

const getShowingText = () => document.querySelector('.showing-count-row')?.textContent || '';
const getVisibleTitles = () =>
  Array.from(document.querySelectorAll('tbody tr .col-title')).map(node => node.textContent?.trim());
const getFirstVisibleTitle = () => getVisibleTitles()[0];

const setup = async (books = defaultBooks) => {
  const makeAuthenticatedApiCall = vi.fn(async (path) => {
    if (path.startsWith('/books')) return { items: books };
    if (path === '/notes') return [];
    return {};
  });

  useAuth.mockReturnValue({
    user: { id: 'user-1' },
    makeAuthenticatedApiCall
  });

  render(<LibraryPage />);
  await waitFor(() => expect(screen.getByText('My Library')).toBeInTheDocument());
  await waitFor(() => expect(makeAuthenticatedApiCall).toHaveBeenCalledWith('/books?limit=200&offset=0'));
};

describe('LibraryPage language/file type filters and sorting', () => {
  beforeEach(() => {
    cleanupTest();

    useMaterial3Theme.mockReturnValue({ actualTheme: 'light' });
    useGamification.mockReturnValue({ trackAction: vi.fn() });
    useReadingSession.mockReturnValue({
      activeSession: null,
      isPaused: false,
      startReadingSession: vi.fn(),
      pauseReadingSession: vi.fn(),
      resumeReadingSession: vi.fn(),
      stopReadingSession: vi.fn()
    });
  });

  test('filters by one language', async () => {
    await setup();

    fireEvent.click(screen.getByRole('button', { name: 'Spanish (1)' }));

    expect(getVisibleTitles()).toEqual(['Beta']);
    expect(getShowingText()).toContain('Showing 1-1 of 1 books');
  });

  test('supports multi-select language OR filtering', async () => {
    await setup();

    fireEvent.click(screen.getByRole('button', { name: 'English (2)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Spanish (1)' }));

    const titles = getVisibleTitles();
    expect(titles).toContain('Alpha');
    expect(titles).toContain('Beta');
    expect(titles).toContain('Gamma');
    expect(titles).not.toContain('Delta');
    expect(titles).not.toContain('Epsilon');
    expect(titles).not.toContain('Zeta');
  });

  test('combines language and file type filters with AND', async () => {
    await setup();

    fireEvent.click(screen.getByRole('button', { name: 'EPUB (3)' }));
    fireEvent.click(screen.getByRole('button', { name: 'English (2)' }));

    expect(getVisibleTitles()).toEqual(['Gamma']);
    expect(getShowingText()).toContain('Showing 1-1 of 1 books');
  });

  test('handles unknown language/file type filtering', async () => {
    await setup();

    fireEvent.click(screen.getByRole('button', { name: 'Unknown (2)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unknown (1)' }));

    expect(getVisibleTitles()).toEqual(['Zeta']);
  });

  test('sorts by language and file type using normalized values', async () => {
    await setup();

    fireEvent.click(screen.getByRole('button', { name: /Language/i }));
    fireEvent.click(screen.getByRole('button', { name: /Language/i }));
    expect(getFirstVisibleTitle()).toBe('Alpha');

    fireEvent.click(screen.getByRole('button', { name: /File Type/i }));
    fireEvent.click(screen.getByRole('button', { name: /File Type/i }));
    expect(getFirstVisibleTitle()).toBe('Beta');
  });

  test('resets pagination to page 1 when metadata filter changes', async () => {
    const books = Array.from({ length: 21 }, (_, index) => ({
      id: String(index + 1),
      title: `Book ${index + 1}`,
      author: `Author ${index + 1}`,
      language: index === 20 ? 'Spanish' : 'English',
      format: index === 20 ? 'epub' : 'pdf',
      file_type: index === 20 ? 'application/epub+zip' : 'application/pdf',
      created_at: `2026-02-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
      completed: false,
      is_reading: false
    }));

    await setup(books);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(getShowingText()).toContain('Showing 21-21 of 21 books');

    fireEvent.click(screen.getByRole('button', { name: 'Spanish (1)' }));
    expect(getShowingText()).toContain('Showing 1-1 of 1 books');
  });
});
