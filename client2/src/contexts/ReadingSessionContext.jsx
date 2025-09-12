// src/contexts/ReadingSessionContext.jsx
//
// This context manages the user's active reading session.  It exposes
// functions to start and stop reading, update progress and retrieve
// historical statistics.  The implementation below follows the upstream
// version from the user's repository with one key improvement: when the
// provider mounts it restores any existing reading session from
// localStorage and calculates the elapsed reading time based on the
// persisted start time.  This allows timers and stats to continue from
// where the user left off after a page refresh rather than resetting to
// zero.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import API from '../config/api';

// Create context
const ReadingSessionContext = createContext({});

// Hook to use the context
export const useReadingSession = () => {
  const context = useContext(ReadingSessionContext);
  if (!context) {
    throw new Error('useReadingSession must be used within a ReadingSessionProvider');
  }
  return context;
};

// Enhanced provider component
export const ReadingSessionProvider = ({ children }) => {
  const { token } = useAuth();
  const { trackAction, updateStats } = useGamification();
  const [activeSession, setActiveSession] = useState(null);
  const [showReadingTracker, setShowReadingTracker] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    readingTime: 0,
    pagesRead: 0,
    startTime: null
  });

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('active_reading_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setActiveSession(sessionData);
        // Compute elapsed time in seconds from the stored start time.  This
        // avoids resetting the timer to zero after a page refresh.
        const startDate = new Date(sessionData.startTime);
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startDate) / 1000);
        setSessionStats({
          readingTime: elapsedSeconds,
          pagesRead: sessionData.pagesRead || 0,
          startTime: startDate
        });
      } catch (error) {
        console.error('Failed to restore reading session:', error);
        localStorage.removeItem('active_reading_session');
      }
    }
  }, []);

  // Start a new reading session
  const startReadingSession = useCallback(async (book) => {
    try {
      // Create session data
      const sessionData = {
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          cover_url: book.cover_url || book.cover
        },
        startTime: new Date().toISOString(),
        sessionId: Date.now().toString(),
        pagesRead: 0,
        notes: ''
      };
      // Update book's is_reading status in database
      try {
        const response = await fetch(`${API.BASE_URL}/books/${book.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_reading: true,
            last_opened: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          console.warn('Failed to update book is_reading status:', await response.text());
        }
      } catch (error) {
        console.warn('Failed to update book reading status:', error);
      }

      // Track to gamification system
      if (trackAction) {
        try {
          await trackAction('start_reading_session', {
            bookId: book.id,
            bookTitle: book.title,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Failed to track reading start:', error);
        }
      }
      // Update state
      setActiveSession(sessionData);
      setShowReadingTracker(false); // Start minimized
      setSessionStats({
        readingTime: 0,
        pagesRead: 0,
        startTime: new Date()
      });
      // Store in localStorage for persistence
      localStorage.setItem('active_reading_session', JSON.stringify(sessionData));
      console.log('📖 Reading session started for:', book.title);
      return { success: true, session: sessionData };
    } catch (error) {
      console.error('Failed to start reading session:', error);
      return { success: false, error: error.message };
    }
  }, [token]);

  // Stop the current reading session
  const pauseReadingSession = useCallback(() => {
    if (!activeSession) return { success: false, error: 'No active session' };
    
    try {
      const pausedSession = {
        ...activeSession,
        isPaused: true,
        pausedAt: new Date().toISOString(),
        // Calculate accumulated time before pause
        accumulatedTime: (activeSession.accumulatedTime || 0) + 
          Math.floor((new Date() - new Date(activeSession.startTime)) / 1000)
      };
      
      localStorage.setItem('active_reading_session', JSON.stringify(pausedSession));
      setActiveSession(pausedSession);
      
      console.log('📖 Reading session paused');
      return { success: true };
    } catch (error) {
      console.error('Failed to pause reading session:', error);
      return { success: false, error: error.message };
    }
  }, [activeSession]);

  const resumeReadingSession = useCallback(() => {
    if (!activeSession || !activeSession.isPaused) return { success: false, error: 'No paused session' };
    
    try {
      const resumedSession = {
        ...activeSession,
        isPaused: false,
        startTime: new Date().toISOString(), // Reset start time for new segment
        resumedAt: new Date().toISOString()
      };
      
      localStorage.setItem('active_reading_session', JSON.stringify(resumedSession));
      setActiveSession(resumedSession);
      
      console.log('📖 Reading session resumed');
      return { success: true };
    } catch (error) {
      console.error('Failed to resume reading session:', error);
      return { success: false, error: error.message };
    }
  }, [activeSession]);

  const stopReadingSession = useCallback(async () => {
    if (!activeSession) return { success: false, error: 'No active session' };
    try {
      const endTime = new Date();
      const startTime = new Date(activeSession.startTime);
      const durationMinutes = Math.floor((endTime - startTime) / 60000);
      // Update book's is_reading status in database
      try {
        const response = await fetch(`${API.BASE_URL}/books/${activeSession.book.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_reading: false,
            last_opened: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          console.warn('Failed to update book is_reading status on stop:', await response.text());
        }
      } catch (error) {
        console.warn('Failed to update book reading status on stop:', error);
      }

      // Track session end to gamification system
      if (trackAction && durationMinutes > 0) {
        try {
          await trackAction('complete_reading_session', {
            bookId: activeSession.book.id,
            bookTitle: activeSession.book.title,
            duration: durationMinutes,
            sessionLength: durationMinutes,
            pagesRead: activeSession.pagesRead || 0,
            timestamp: endTime.toISOString()
          });
        } catch (error) {
          console.warn('Failed to track reading session completion:', error);
        }
      }
      // Save to session history
      const sessionHistory = JSON.parse(localStorage.getItem('readingSessionHistory') || '[]');
      const completedSession = {
        ...activeSession,
        endTime: endTime.toISOString(),
        duration: durationMinutes,
        totalSeconds: Math.floor((endTime - startTime) / 1000)
      };
      sessionHistory.push(completedSession);
      localStorage.setItem('readingSessionHistory', JSON.stringify(sessionHistory));
      // Clear active session
      localStorage.removeItem('active_reading_session');
      setActiveSession(null);
      setShowReadingTracker(false);
      setSessionStats({
        readingTime: 0,
        pagesRead: 0,
        startTime: null
      });
      console.log('📖 Reading session ended');
      return {
        success: true,
        duration: durationMinutes,
        pages: activeSession.pagesRead || 0,
        session: completedSession
      };
    } catch (error) {
      console.error('Failed to stop reading session:', error);
      return { success: false, error: error.message };
    }
  }, [activeSession, token]);

  // Update progress without ending session
  const updateProgress = useCallback(async (pagesRead, notes) => {
    if (!activeSession) return { success: false, error: 'No active session' };
    try {
      // Update session data
      const updatedSession = {
        ...activeSession,
        pagesRead,
        notes,
        lastUpdated: new Date().toISOString()
      };
      setActiveSession(updatedSession);
      setSessionStats(prev => ({
        ...prev,
        pagesRead
      }));
      // Save to localStorage
      localStorage.setItem('active_reading_session', JSON.stringify(updatedSession));
      // Track to gamification if available
      if (trackAction && pagesRead > 0) {
        try {
          await trackAction('pages_read', {
            pages: pagesRead,
            bookId: activeSession.book.id,
            bookTitle: activeSession.book.title,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Failed to track pages read:', error);
        }
      }
      console.log(`📊 Progress updated: ${pagesRead} pages`);
      return { success: true };
    } catch (error) {
      console.error('Failed to update progress:', error);
      return { success: false, error: error.message };
    }
  }, [activeSession, token]);

  // Show/hide reading tracker
  const showReadingTrackerModal = useCallback(() => {
    setShowReadingTracker(true);
  }, []);
  const hideReadingTracker = useCallback(() => {
    setShowReadingTracker(false);
  }, []);

  // Get session history
  const getSessionHistory = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('readingSessionHistory') || '[]');
    } catch (error) {
      console.error('Failed to load session history:', error);
      return [];
    }
  }, []);

  // Get reading stats
  const getReadingStats = useCallback(() => {
    const history = getSessionHistory();
    const totalSessions = history.length;
    const totalMinutes = history.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalPages = history.reduce((sum, session) => sum + (session.pagesRead || 0), 0);
    // Calculate streak (consecutive days with reading)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasSessionOnDate = history.some(session => {
        const sessionDate = new Date(session.startTime);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime();
      });
      if (hasSessionOnDate) {
        streak++;
      } else if (i > 0) {
        // Don't break on first day (today)
        break;
      }
    }
    return {
      totalSessions,
      totalMinutes,
      totalPages,
      streak,
      averageSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
    };
  }, [getSessionHistory]);

  // Clear all session data (for debugging/reset)
  const clearAllSessions = useCallback(() => {
    localStorage.removeItem('active_reading_session');
    localStorage.removeItem('readingSessionHistory');
    setActiveSession(null);
    setShowReadingTracker(false);
    setSessionStats({
      readingTime: 0,
      pagesRead: 0,
      startTime: null
    });
    console.log('🧹 All reading sessions cleared');
  }, []);

  // Context value
  const value = {
    // State
    activeSession,
    showReadingTracker,
    sessionStats,
    // Actions
    startReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    stopReadingSession,
    updateProgress,
    showReadingTrackerModal,
    hideReadingTracker,
    // Utilities
    getSessionHistory,
    getReadingStats,
    clearAllSessions,
    // Computed
    hasActiveSession: !!activeSession,
    isReading: !!activeSession,
    isPaused: activeSession?.isPaused || false
  };

  return (
    <ReadingSessionContext.Provider value={value}>
      {children}
    </ReadingSessionContext.Provider>
  );
};

// Default export
export default ReadingSessionProvider;