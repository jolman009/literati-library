// src/hooks/useReadingTimer.js
// Enhanced version of your existing hook with better integration

import { useState, useRef, useEffect, useCallback } from 'react';
import { useReadingSession } from '../contexts/ReadingSessionContext';

// Original hook (keep for backwards compatibility)
export const useReadingTimer = (bookId) => {
  const [isReading, setIsReading] = useState(false);
  const startTime = useRef(null);
  const pagesAtStart = useRef(0);

  const startReading = (currentPage = 0) => {
    setIsReading(true);
    startTime.current = Date.now();
    pagesAtStart.current = currentPage;
    console.log('⏱️ Timer started');
  };

  const stopReading = async (currentPage = 0) => {
    if (!isReading || !startTime.current) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime.current) / 60000); // minutes
    const pagesRead = Math.max(0, currentPage - pagesAtStart.current);

    // Track to gamification system
    if (duration > 0) {
      try {
        await window.trackAction?.('reading_time', {
          minutes: duration,
          sessionLength: duration,
          bookId
        });
      } catch (error) {
        console.warn('Failed to track reading time:', error);
      }
    }

    if (pagesRead > 0) {
      try {
        await window.trackAction?.('pages_read', {
          pages: pagesRead,
          bookId
        });
      } catch (error) {
        console.warn('Failed to track pages read:', error);
      }
    }

    setIsReading(false);
    startTime.current = null;
    
    console.log(`📊 Reading session: ${duration}m, ${pagesRead} pages`);
    return { duration, pagesRead };
  };

  // Auto-stop when component unmounts
  useEffect(() => {
    return () => {
      if (isReading) {
        stopReading();
      }
    };
  }, [isReading]);

  return { startReading, stopReading, isReading };
};

// Enhanced hook that integrates with reading session context
export const useEnhancedReadingTimer = (bookId) => {
  const { 
    activeSession, 
    startReadingSession, 
    stopReadingSession, 
    updateProgress 
  } = useReadingSession();
  
  const [sessionTime, setSessionTime] = useState(0);
  const [isLocalReading, setIsLocalReading] = useState(false);
  const startTime = useRef(null);
  const pagesAtStart = useRef(0);
  const intervalRef = useRef(null);

  // Update session time every second when there's an active session
  useEffect(() => {
    if (!activeSession) {
      setSessionTime(0);
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const start = new Date(activeSession.startTime);
      const elapsed = Math.floor((now - start) / 1000);
      setSessionTime(elapsed);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSession]);

  // Enhanced start reading that integrates with session context
  const startReading = useCallback(async (book, currentPage = 0) => {
    try {
      // Start session context if not already active
      let sessionResult = { success: true };
      if (!activeSession) {
        sessionResult = await startReadingSession(book);
      }
      
      // Start local timer
      setIsLocalReading(true);
      startTime.current = Date.now();
      pagesAtStart.current = currentPage;
      
      console.log('⏱️ Enhanced reading timer started');
      return sessionResult;
    } catch (error) {
      console.error('Failed to start enhanced reading:', error);
      return { success: false, error: error.message };
    }
  }, [activeSession, startReadingSession]);

  // Enhanced stop reading with better tracking
  const stopReading = useCallback(async (currentPage = 0) => {
    try {
      let timerResult = {};
      
      // Stop local timer
      if (isLocalReading && startTime.current) {
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime.current) / 60000); // minutes
        const pagesRead = Math.max(0, currentPage - pagesAtStart.current);

        timerResult = { duration, pagesRead };

        // Track to gamification system
        if (duration > 0) {
          try {
            await window.trackAction?.('reading_time', {
              minutes: duration,
              sessionLength: duration,
              bookId
            });
          } catch (error) {
            console.warn('Failed to track reading time:', error);
          }
        }

        if (pagesRead > 0) {
          try {
            await window.trackAction?.('pages_read', {
              pages: pagesRead,
              bookId
            });
          } catch (error) {
            console.warn('Failed to track pages read:', error);
          }
        }

        setIsLocalReading(false);
        startTime.current = null;
      }
      
      // Stop session context
      const sessionResult = await stopReadingSession();
      
      console.log(`📊 Enhanced reading session: ${timerResult.duration || 0}m, ${timerResult.pagesRead || 0} pages`);
      
      return {
        ...sessionResult,
        timerData: timerResult
      };
    } catch (error) {
      console.error('Failed to stop enhanced reading:', error);
      return { success: false, error: error.message };
    }
  }, [isLocalReading, stopReadingSession, bookId]);

  // Update progress without stopping session
  const saveProgress = useCallback(async (pagesRead, notes) => {
    try {
      await updateProgress?.(pagesRead, notes);
      
      // Track pages read to gamification
      if (pagesRead > 0 && bookId) {
        try {
          await window.trackAction?.('pages_read', {
            pages: pagesRead,
            bookId
          });
        } catch (error) {
          console.warn('Failed to track pages read:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save progress:', error);
      return { success: false, error: error.message };
    }
  }, [updateProgress, bookId]);

  // Utility functions
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getSessionInfo = useCallback(() => {
    if (!activeSession) return null;
    
    return {
      book: activeSession.book,
      startTime: activeSession.startTime,
      duration: sessionTime,
      formattedTime: formatTime(sessionTime)
    };
  }, [activeSession, sessionTime, formatTime]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (isLocalReading) {
        stopReading();
      }
    };
  }, [isLocalReading, stopReading]);

  return {
    // Enhanced methods
    startReading,
    stopReading,
    saveProgress,
    
    // State
    isReading: isLocalReading || !!activeSession,
    activeSession,
    sessionTime,
    
    // Utilities
    formatTime,
    getSessionInfo,
    
    // Computed values
    hasActiveSession: !!activeSession,
    isSessionActive: !!activeSession
  };
};

// Hook for components that just need session status
export const useReadingSessionStatus = () => {
  const { activeSession } = useReadingSession();
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    if (!activeSession) {
      setSessionTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(activeSession.startTime);
      const elapsed = Math.floor((now - start) / 1000);
      setSessionTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    activeSession,
    sessionTime,
    formattedTime: formatTime(sessionTime),
    hasActiveSession: !!activeSession
  };
};

// Export everything for flexibility
export default {
  useReadingTimer,
  useEnhancedReadingTimer,
  useReadingSessionStatus
};