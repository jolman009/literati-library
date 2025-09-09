// src/components/FloatingTimer.jsx
import React, { useState, useEffect } from 'react';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import './FloatingTimer.css';

const FloatingTimer = () => {
  const { 
    activeSession, 
    hasActiveSession, 
    sessionStats, 
    pauseReadingSession, 
    resumeReadingSession, 
    stopReadingSession,
    isPaused 
  } = useReadingSession();

  const [currentTime, setCurrentTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!hasActiveSession || isPaused) return;

    const interval = setInterval(() => {
      if (activeSession?.startTime) {
        const startTime = new Date(activeSession.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const accumulated = activeSession.accumulatedTime || 0;
        setCurrentTime(accumulated + elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasActiveSession, isPaused, activeSession]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await resumeReadingSession();
    } else {
      await pauseReadingSession();
    }
  };

  const handleStop = async () => {
    const result = await stopReadingSession();
    if (result.success) {
      setCurrentTime(0);
    }
  };

  if (!hasActiveSession) return null;

  return (
    <div 
      className={`floating-timer ${isMinimized ? 'minimized' : ''}`}
      style={{ 
        position: 'fixed',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      <div className="timer-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="timer-info">
          <span className="timer-icon">📖</span>
          <div className="timer-details">
            <div className="book-title">
              {activeSession?.book?.title || 'Reading Session'}
            </div>
            <div className="timer-display">
              {formatTime(currentTime)}
              {isPaused && <span className="paused-indicator">⏸️</span>}
            </div>
          </div>
        </div>
        <button 
          className="minimize-btn"
          aria-label={isMinimized ? 'Expand timer' : 'Minimize timer'}
        >
          {isMinimized ? '⬆️' : '⬇️'}
        </button>
      </div>

      {!isMinimized && (
        <div className="timer-controls">
          <button 
            onClick={handlePauseResume}
            className="control-btn pause-resume"
            aria-label={isPaused ? 'Resume reading' : 'Pause reading'}
          >
            {isPaused ? '▶️' : '⏸️'}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button 
            onClick={handleStop}
            className="control-btn stop"
            aria-label="Stop reading session"
          >
            ⏹️ End Session
          </button>
        </div>
      )}

      <div className="session-stats">
        <span className="stat">
          📄 {sessionStats.pagesRead || 0} pages
        </span>
      </div>
    </div>
  );
};

export default FloatingTimer;