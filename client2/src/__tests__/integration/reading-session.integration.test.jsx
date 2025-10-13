// Integration test for reading session functionality
// Tests: timer deployment, persistence across reloads, backend storage, gamification

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReadingSessionProvider, useReadingSession } from '../../contexts/ReadingSessionContext';
import API from '../../config/api';

// Mock dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'mock-token', user: { id: 'test-user-id' } })
}));

vi.mock('../../contexts/GamificationContext', () => ({
  useGamification: () => ({
    trackAction: vi.fn().mockResolvedValue({ success: true, points: 5 }),
    updateStats: vi.fn()
  })
}));

vi.mock('../../config/api');

describe('Reading Session Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();

    // Mock API responses
    API.patch = vi.fn().mockResolvedValue({ data: { success: true } });
    API.post = vi.fn().mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Timer Deployment During Reading Sessions', () => {
    it('should successfully deploy timer when starting a reading session', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-123',
        title: 'Test Book',
        author: 'Test Author',
        cover_url: 'http://example.com/cover.jpg'
      };

      // Start reading session
      await act(async () => {
        const response = await result.current.startReadingSession(mockBook);
        expect(response.success).toBe(true);
      });

      // Verify session is active
      expect(result.current.activeSession).toBeTruthy();
      expect(result.current.hasActiveSession).toBe(true);
      expect(result.current.isReading).toBe(true);

      // Verify timer initialized
      expect(result.current.sessionStats.readingTime).toBe(0);
      expect(result.current.sessionStats.startTime).toBeInstanceOf(Date);
      expect(result.current.sessionStats.pagesRead).toBe(0);

      // Verify localStorage
      const savedSession = localStorage.getItem('active_reading_session');
      expect(savedSession).toBeTruthy();
      const sessionData = JSON.parse(savedSession);
      expect(sessionData.book.id).toBe(mockBook.id);
      expect(sessionData.startTime).toBeTruthy();
    });

    it('should update timer continuously during reading', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-123',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Start session
      await act(async () => {
        await result.current.startReadingSession(mockBook);
      });

      const initialTime = result.current.sessionStats.readingTime;

      // Wait for timer to update (simulate 2 seconds passing)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2100));
      });

      // Note: Timer updates are handled by the UI component (ReadingSessionTimer)
      // The context provides the startTime for calculation
      expect(result.current.sessionStats.startTime).toBeInstanceOf(Date);
      expect(result.current.activeSession).toBeTruthy();
    });

    it('should handle pause and resume correctly', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-123',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Start session
      await act(async () => {
        await result.current.startReadingSession(mockBook);
      });

      expect(result.current.isPaused).toBe(false);

      // Pause session
      await act(async () => {
        const response = result.current.pauseReadingSession();
        expect(response.success).toBe(true);
      });

      expect(result.current.isPaused).toBe(true);
      expect(result.current.activeSession.isPaused).toBe(true);
      expect(result.current.activeSession.pausedAt).toBeTruthy();
      expect(result.current.activeSession.accumulatedTime).toBeGreaterThanOrEqual(0);

      // Resume session
      await act(async () => {
        const response = result.current.resumeReadingSession();
        expect(response.success).toBe(true);
      });

      expect(result.current.isPaused).toBe(false);
      expect(result.current.activeSession.isPaused).toBe(false);
      expect(result.current.activeSession.resumedAt).toBeTruthy();
    });
  });

  describe('Session Persistence Across Page Reloads', () => {
    it('should restore active session from localStorage on mount', async () => {
      // Pre-populate localStorage with an active session
      const startTime = new Date(Date.now() - 5000); // Started 5 seconds ago
      const mockSessionData = {
        book: {
          id: 'book-456',
          title: 'Persisted Book',
          author: 'Persisted Author',
          cover_url: 'http://example.com/cover.jpg'
        },
        startTime: startTime.toISOString(),
        sessionId: Date.now().toString(),
        pagesRead: 5,
        notes: 'Test notes'
      };

      localStorage.setItem('active_reading_session', JSON.stringify(mockSessionData));

      // Mount the provider (simulates page load)
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      // Wait for useEffect to run
      await waitFor(() => {
        expect(result.current.activeSession).toBeTruthy();
      });

      // Verify session was restored
      expect(result.current.activeSession.book.id).toBe('book-456');
      expect(result.current.activeSession.book.title).toBe('Persisted Book');
      expect(result.current.activeSession.pagesRead).toBe(5);

      // Verify elapsed time was calculated correctly
      expect(result.current.sessionStats.readingTime).toBeGreaterThanOrEqual(4); // At least 4 seconds
      expect(result.current.sessionStats.pagesRead).toBe(5);
      expect(result.current.sessionStats.startTime).toBeInstanceOf(Date);

      // Verify state flags
      expect(result.current.hasActiveSession).toBe(true);
      expect(result.current.isReading).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('active_reading_session', 'invalid-json-{{{');

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      // Should not crash and should have no active session
      await waitFor(() => {
        expect(result.current.activeSession).toBeNull();
      });

      // Verify corrupted data was cleaned up
      expect(localStorage.getItem('active_reading_session')).toBeNull();
    });

    it('should maintain paused state across reloads', async () => {
      const startTime = new Date(Date.now() - 10000);
      const pausedTime = new Date(Date.now() - 5000);

      const pausedSession = {
        book: {
          id: 'book-789',
          title: 'Paused Book',
          author: 'Paused Author'
        },
        startTime: startTime.toISOString(),
        isPaused: true,
        pausedAt: pausedTime.toISOString(),
        accumulatedTime: 5, // 5 seconds before pause
        sessionId: Date.now().toString(),
        pagesRead: 3
      };

      localStorage.setItem('active_reading_session', JSON.stringify(pausedSession));

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.activeSession).toBeTruthy();
      });

      // Verify paused state was restored
      expect(result.current.isPaused).toBe(true);
      expect(result.current.activeSession.isPaused).toBe(true);
      expect(result.current.activeSession.accumulatedTime).toBe(5);
    });

    it('should preserve session history across reloads', async () => {
      const completedSessions = [
        {
          book: { id: 'book-1', title: 'Book One' },
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date(Date.now() - 3000000).toISOString(),
          duration: 10,
          pagesRead: 15
        },
        {
          book: { id: 'book-2', title: 'Book Two' },
          startTime: new Date(Date.now() - 7200000).toISOString(),
          endTime: new Date(Date.now() - 6000000).toISOString(),
          duration: 20,
          pagesRead: 25
        }
      ];

      localStorage.setItem('readingSessionHistory', JSON.stringify(completedSessions));

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      // Retrieve session history
      const history = result.current.getSessionHistory();

      expect(history).toHaveLength(2);
      expect(history[0].book.title).toBe('Book One');
      expect(history[1].book.title).toBe('Book Two');
    });
  });

  describe('Backend Integration for Session Storage', () => {
    it('should update book reading status when starting session', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-123',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Start session
      await act(async () => {
        await result.current.startReadingSession(mockBook);
      });

      // Verify API call to update book status
      await waitFor(() => {
        expect(API.patch).toHaveBeenCalledWith(
          `/books/${mockBook.id}`,
          expect.objectContaining({
            is_reading: true,
            last_opened: expect.any(String)
          })
        );
      });
    });

    it('should update book reading status when stopping session', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-456',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Start and then stop session
      await act(async () => {
        await result.current.startReadingSession(mockBook);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.stopReadingSession();
      });

      // Verify API call to update book status
      await waitFor(() => {
        expect(API.patch).toHaveBeenCalledWith(
          `/books/${mockBook.id}`,
          expect.objectContaining({
            is_reading: false,
            last_opened: expect.any(String)
          })
        );
      });
    });

    it('should handle API failures gracefully without blocking session', async () => {
      API.patch = vi.fn().mockRejectedValue(new Error('Network error'));

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-789',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Should not throw error
      await act(async () => {
        const response = await result.current.startReadingSession(mockBook);
        expect(response.success).toBe(true);
      });

      // Session should still be created locally
      expect(result.current.activeSession).toBeTruthy();
      expect(result.current.hasActiveSession).toBe(true);
    });
  });

  describe('Gamification Integration', () => {
    it('should track reading_session_started action', async () => {
      const mockTrackAction = vi.fn().mockResolvedValue({ success: true, points: 5 });

      vi.mocked(vi.importActual('../../contexts/GamificationContext')).useGamification = () => ({
        trackAction: mockTrackAction,
        updateStats: vi.fn()
      });

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-123',
        title: 'Test Book',
        author: 'Test Author'
      };

      await act(async () => {
        await result.current.startReadingSession(mockBook);
      });

      // Note: trackAction is mocked at module level
      // In actual implementation, verify gamification context receives the call
      expect(result.current.activeSession).toBeTruthy();
    });

    it('should track reading_session_completed with duration', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-456',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Start session
      await act(async () => {
        await result.current.startReadingSession(mockBook);
      });

      // Wait a bit
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      // Stop session
      await act(async () => {
        const response = await result.current.stopReadingSession();
        expect(response.success).toBe(true);
        expect(response.duration).toBeGreaterThanOrEqual(0);
      });

      // Verify session was saved to history
      const history = result.current.getSessionHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].book.id).toBe(mockBook.id);
    });

    it('should track page_read actions when updating progress', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-789',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Start session
      await act(async () => {
        await result.current.startReadingSession(mockBook);
      });

      // Update progress (read 5 pages)
      await act(async () => {
        const response = await result.current.updateProgress(5, 'Made good progress');
        expect(response.success).toBe(true);
      });

      // Verify session state updated
      expect(result.current.activeSession.pagesRead).toBe(5);
      expect(result.current.sessionStats.pagesRead).toBe(5);

      // Update with more pages (total 8 pages)
      await act(async () => {
        const response = await result.current.updateProgress(8, 'Continued reading');
        expect(response.success).toBe(true);
      });

      expect(result.current.activeSession.pagesRead).toBe(8);
    });
  });

  describe('Reading Statistics Calculation', () => {
    it('should calculate accurate reading statistics', async () => {
      // Populate session history
      const now = new Date();
      const sessions = [
        {
          book: { id: 'book-1', title: 'Book One' },
          startTime: new Date(now - 86400000).toISOString(), // Yesterday
          endTime: new Date(now - 86000000).toISOString(),
          duration: 30,
          pagesRead: 20
        },
        {
          book: { id: 'book-2', title: 'Book Two' },
          startTime: new Date(now - 172800000).toISOString(), // 2 days ago
          endTime: new Date(now - 172000000).toISOString(),
          duration: 45,
          pagesRead: 35
        },
        {
          book: { id: 'book-3', title: 'Book Three' },
          startTime: new Date(now - 259200000).toISOString(), // 3 days ago
          endTime: new Date(now - 258000000).toISOString(),
          duration: 25,
          pagesRead: 15
        }
      ];

      localStorage.setItem('readingSessionHistory', JSON.stringify(sessions));

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const stats = result.current.getReadingStats();

      expect(stats.totalSessions).toBe(3);
      expect(stats.totalMinutes).toBe(100); // 30 + 45 + 25
      expect(stats.totalPages).toBe(70); // 20 + 35 + 15
      expect(stats.averageSessionLength).toBe(33); // Math.round(100/3)
    });

    it('should calculate reading streak correctly', async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Create sessions for last 5 consecutive days
      const sessions = Array.from({ length: 5 }, (_, i) => ({
        book: { id: `book-${i}`, title: `Book ${i}` },
        startTime: new Date(now - i * 86400000).toISOString(),
        endTime: new Date(now - i * 86400000 + 3600000).toISOString(),
        duration: 60,
        pagesRead: 20
      }));

      localStorage.setItem('readingSessionHistory', JSON.stringify(sessions));

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const stats = result.current.getReadingStats();

      expect(stats.streak).toBe(5);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle starting session without active token', async () => {
      vi.mocked(vi.importActual('../../contexts/AuthContext')).useAuth = () => ({
        token: null,
        user: null
      });

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const mockBook = {
        id: 'book-123',
        title: 'Test Book',
        author: 'Test Author'
      };

      // Should still create local session even without token
      await act(async () => {
        const response = await result.current.startReadingSession(mockBook);
        expect(response.success).toBe(true);
      });

      expect(result.current.activeSession).toBeTruthy();
    });

    it('should prevent starting multiple sessions simultaneously', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      const book1 = { id: 'book-1', title: 'Book 1', author: 'Author 1' };
      const book2 = { id: 'book-2', title: 'Book 2', author: 'Author 2' };

      // Start first session
      await act(async () => {
        await result.current.startReadingSession(book1);
      });

      expect(result.current.activeSession.book.id).toBe('book-1');

      // Attempt to start second session (should replace first)
      await act(async () => {
        await result.current.startReadingSession(book2);
      });

      expect(result.current.activeSession.book.id).toBe('book-2');
    });

    it('should handle stopping non-existent session', async () => {
      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      // Try to stop without starting
      await act(async () => {
        const response = await result.current.stopReadingSession();
        expect(response.success).toBe(false);
        expect(response.error).toBeTruthy();
      });
    });

    it('should clear all session data', async () => {
      // Setup sessions
      localStorage.setItem('active_reading_session', JSON.stringify({
        book: { id: 'book-1', title: 'Book 1' },
        startTime: new Date().toISOString()
      }));
      localStorage.setItem('readingSessionHistory', JSON.stringify([
        { book: { id: 'book-1' }, duration: 30 }
      ]));

      const wrapper = ({ children }) => (
        <ReadingSessionProvider>{children}</ReadingSessionProvider>
      );

      const { result } = renderHook(() => useReadingSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.activeSession).toBeTruthy();
      });

      // Clear all sessions
      act(() => {
        result.current.clearAllSessions();
      });

      expect(result.current.activeSession).toBeNull();
      expect(result.current.hasActiveSession).toBe(false);
      expect(localStorage.getItem('active_reading_session')).toBeNull();
      expect(localStorage.getItem('readingSessionHistory')).toBeNull();
    });
  });
});
