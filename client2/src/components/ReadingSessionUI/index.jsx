// src/components/ReadingSessionUI/index.js
import React, { useState, useEffect, createContext, useContext } from 'react';

// ===============================================
// READING SESSION CONTEXT
// ===============================================

const ReadingSessionContext = createContext();

export const useReadingSession = () => {
  const context = useContext(ReadingSessionContext);
  if (!context) {
    throw new Error('useReadingSession must be used within ReadingSessionProvider');
  }
  return context;
};

export const ReadingSessionProvider = ({ children }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Load active session from localStorage
    const saved = localStorage.getItem('activeReadingSession');
    if (saved) {
      try {
        setActiveSession(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading active session:', error);
      }
    }

    // Load session history
    const savedSessions = localStorage.getItem('readingSessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
  }, []);

  const startSession = (bookId, bookTitle) => {
    const newSession = {
      id: Date.now(),
      bookId,
      bookTitle,
      startTime: new Date().toISOString(),
      duration: 0,
      pagesRead: 0
    };

    setActiveSession(newSession);
    localStorage.setItem('activeReadingSession', JSON.stringify(newSession));
  };

  const endSession = () => {
    if (activeSession) {
      const completedSession = {
        ...activeSession,
        endTime: new Date().toISOString(),
        duration: Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000)
      };

      const updatedSessions = [...sessions, completedSession];
      setSessions(updatedSessions);
      localStorage.setItem('readingSessions', JSON.stringify(updatedSessions));
      localStorage.removeItem('activeReadingSession');
      setActiveSession(null);
    }
  };

  const updateSession = (updates) => {
    if (activeSession) {
      const updated = { ...activeSession, ...updates };
      setActiveSession(updated);
      localStorage.setItem('activeReadingSession', JSON.stringify(updated));
    }
  };

  return (
    <ReadingSessionContext.Provider value={{
      activeSession,
      sessions,
      startSession,
      endSession,
      updateSession
    }}>
      {children}
    </ReadingSessionContext.Provider>
  );
};

export const EnhancedFloatingReadingTimer = () => {
  const { activeSession, endSession } = useReadingSession();
  const [sessionTime, setSessionTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (activeSession) {
      setIsVisible(true);
      const startTime = new Date(activeSession.startTime).getTime();
      
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSessionTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
      setSessionTime(0);
    }
  }, [activeSession]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    endSession();
    setIsVisible(false);
  };

  if (!isVisible || !activeSession) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#6750a4',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      <span>📖</span>
      <span>{formatTime(sessionTime)}</span>
      <span style={{ fontSize: '12px', opacity: 0.8 }}>|
        {activeSession.bookTitle?.substring(0, 15)}...
      </span>
      <button
        onClick={handleEndSession}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '2px',
          marginLeft: '4px'
        }}
      >
        ✕
      </button>
    </div>
  );
};

// ===============================================
// FLOATING READING TIMER (Original)
// ===============================================

export const FloatingReadingTimer = () => {
  const [sessionTime, setSessionTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if there's an active reading session
    const activeSession = localStorage.getItem('activeReadingSession');
    if (activeSession) {
      setIsVisible(true);
      
      // Start timer
      const interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#6750a4',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      <span>📖</span>
      <span>{formatTime(sessionTime)}</span>
      <button
        onClick={() => setIsVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '2px',
          marginLeft: '4px'
        }}
      >
        ✕
      </button>
    </div>
  );
};

// ===============================================
// READING SESSION MANAGER
// ===============================================

export const ReadingSessionManager = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Load saved sessions
    const savedSessions = localStorage.getItem('readingSessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Error loading reading sessions:', error);
      }
    }
  }, []);

  const startSession = (bookId, bookTitle) => {
    const newSession = {
      id: Date.now(),
      bookId,
      bookTitle,
      startTime: new Date().toISOString(),
      duration: 0,
      pagesRead: 0
    };

    localStorage.setItem('activeReadingSession', JSON.stringify(newSession));
    
    // Trigger timer visibility
    window.dispatchEvent(new CustomEvent('reading-session-started'));
  };

  const endSession = (sessionData) => {
    const updatedSessions = [...sessions, sessionData];
    setSessions(updatedSessions);
    localStorage.setItem('readingSessions', JSON.stringify(updatedSessions));
    localStorage.removeItem('activeReadingSession');
    
    // Hide timer
    window.dispatchEvent(new CustomEvent('reading-session-ended'));
  };

  // This component doesn't render anything visible
  // It's just for session management logic
  return null;
};

// ===============================================
// READING PROGRESS TRACKER
// ===============================================

export const ReadingProgressTracker = ({ bookId, onProgressUpdate }) => {
  const [startTime] = useState(Date.now());
  const [pagesRead, setPagesRead] = useState(0);

  useEffect(() => {
    const handlePageChange = (event) => {
      if (event.detail && event.detail.pagesRead !== undefined) {
        setPagesRead(event.detail.pagesRead);
        
        const duration = Math.floor((Date.now() - startTime) / 1000);
        onProgressUpdate?.({
          bookId,
          duration,
          pagesRead: event.detail.pagesRead,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Listen for page change events
    window.addEventListener('reading-progress', handlePageChange);
    
    return () => {
      window.removeEventListener('reading-progress', handlePageChange);
    };
  }, [bookId, startTime, onProgressUpdate]);

  return null;
};

// ===============================================
// READING PROGRESS DISPLAY
// ===============================================

export const ReadingProgressDisplay = ({ pagesRead }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(255,255,255,0.9)',
      padding: '8px 12px',
      borderRadius: '16px',
      fontSize: '12px',
      color: '#666',
      zIndex: 999
    }}>
      Pages: {pagesRead}
    </div>
  );
};

// ===============================================
// READING STREAK INDICATOR
// ===============================================

export const ReadingStreakIndicator = () => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Load streak from storage
    const savedStreak = localStorage.getItem('readingStreak') || '0';
    setStreak(parseInt(savedStreak, 10));
  }, []);

  if (streak === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      backgroundColor: '#ff6b35',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      🔥 {streak} day{streak !== 1 ? 's' : ''}
    </div>
  );
};

// ===============================================
// SESSION SUMMARY MODAL
// ===============================================

export const SessionSummaryModal = ({ isOpen, onClose, sessionData }) => {
  if (!isOpen || !sessionData) return null;

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 16px 0', color: '#6750a4' }}>
          🎉 Reading Session Complete!
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '8px 0', fontSize: '16px', fontWeight: '500' }}>
            {sessionData.bookTitle}
          </p>
          <p style={{ margin: '4px 0', color: '#666' }}>
            Duration: {formatDuration(sessionData.duration)}
          </p>
          <p style={{ margin: '4px 0', color: '#666' }}>
            Pages read: {sessionData.pagesRead}
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            backgroundColor: '#6750a4',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Continue Reading Journey
        </button>
      </div>
    </div>
  );
};

// ===============================================
// DEFAULT EXPORT FOR CONVENIENCE
// ===============================================

const ReadingSessionUI = {
  FloatingReadingTimer,
  EnhancedFloatingReadingTimer,
  ReadingSessionManager,
  ReadingProgressTracker,
  ReadingStreakIndicator,
  SessionSummaryModal,
  ReadingSessionProvider,
  useReadingSession
};

export default ReadingSessionUI;