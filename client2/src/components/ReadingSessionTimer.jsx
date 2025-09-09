// src/components/ReadingSessionTimer.jsx
// Single, prominent reading session timer

import React, { useState, useEffect } from 'react';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { MD3Button } from './Material3';

const ReadingSessionTimer = () => {
  const { 
    activeSession, 
    stopReadingSession, 
    pauseReadingSession,
    resumeReadingSession,
    isPaused,
    sessionStats 
  } = useReadingSession();
  const { actualTheme } = useMaterial3Theme();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Update timer every second when session is active
  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      if (activeSession.isPaused) {
        // When paused, use accumulated time
        setElapsedTime(activeSession.accumulatedTime || 0);
      } else {
        // When active, calculate current elapsed time
        const startTime = new Date(activeSession.startTime);
        const now = new Date();
        const currentElapsed = Math.floor((now - startTime) / 1000);
        const totalElapsed = (activeSession.accumulatedTime || 0) + currentElapsed;
        setElapsedTime(totalElapsed);
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [activeSession]);

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    try {
      await stopReadingSession();
    } catch (error) {
      console.error('Failed to stop reading session:', error);
    }
  };

  const handlePause = () => {
    try {
      pauseReadingSession();
    } catch (error) {
      console.error('Failed to pause reading session:', error);
    }
  };

  const handleResume = () => {
    try {
      resumeReadingSession();
    } catch (error) {
      console.error('Failed to resume reading session:', error);
    }
  };

  // Don't render if no active session
  if (!activeSession) return null;

  const isDark = actualTheme === 'dark';

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: isDark 
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: 'monospace',
          userSelect: 'none',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        {isPaused ? '⏸️' : '📖'} {formatTime(elapsedTime)}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: isDark ? '#1e293b' : '#ffffff',
        border: `2px solid ${isDark ? '#3b82f6' : '#2563eb'}`,
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: '280px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>📖</span>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: isDark ? '#f1f5f9' : '#1e293b'
          }}>
            Reading Session
          </span>
        </div>
        
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: isDark ? '#94a3b8' : '#64748b',
            padding: '4px'
          }}
          title="Minimize"
        >
          ➖
        </button>
      </div>

      {/* Book Info */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#e2e8f0' : '#334155',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {activeSession.book?.title || 'Unknown Book'}
        </div>
        <div style={{
          fontSize: '12px',
          color: isDark ? '#94a3b8' : '#64748b'
        }}>
          by {activeSession.book?.author || 'Unknown Author'}
        </div>
      </div>

      {/* Timer Display */}
      <div style={{
        background: isDark 
          ? 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: '700',
          fontFamily: 'monospace',
          marginBottom: '4px'
        }}>
          {formatTime(elapsedTime)}
        </div>
        <div style={{
          fontSize: '12px',
          opacity: 0.9
        }}>
          Reading Time
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <MD3Button
          variant="outlined"
          onClick={() => setIsMinimized(true)}
          style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
        >
          Minimize
        </MD3Button>
        <MD3Button
          variant={isPaused ? "filled" : "outlined"}
          onClick={isPaused ? handleResume : handlePause}
          style={{ 
            flex: 1, 
            fontSize: '12px', 
            padding: '8px 12px',
            background: isPaused ? '#059669' : 'transparent',
            color: isPaused ? 'white' : (isDark ? '#f1f5f9' : '#334155')
          }}
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </MD3Button>
        <MD3Button
          variant="filled"
          onClick={handleStop}
          style={{ 
            flex: 1,
            fontSize: '12px',
            padding: '8px 12px',
            background: '#dc2626',
            color: 'white'
          }}
        >
          🛑 Stop
        </MD3Button>
      </div>
    </div>
  );
};

export default ReadingSessionTimer;