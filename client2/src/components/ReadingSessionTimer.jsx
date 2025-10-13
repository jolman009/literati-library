// src/components/ReadingSessionTimer.jsx
// Single, prominent reading session timer

import React, { useState, useEffect, useRef } from 'react';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { MD3Button } from './Material3';

// Helper to constrain position within bounds
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

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

  // Dragging state
  const timerRef = useRef(null);
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

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

  // Drag handlers
  const onPointerDown = (e) => {
    // Only start drag from header area
    if (!e.currentTarget.dataset.draggable) return;

    setDragging(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    dragStart.current = { x: clientX, y: clientY };
    startPos.current = { ...pos };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return;

    if (e.cancelable) e.preventDefault();

    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;

    // Constrain within viewport
    const node = timerRef.current;
    const w = node?.offsetWidth ?? 280;
    const h = node?.offsetHeight ?? 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const nextX = clamp(startPos.current.x + dx, 0, vw - w);
    const nextY = clamp(startPos.current.y + dy, 0, vh - h);

    setPos({ x: nextX, y: nextY });
  };

  const endDrag = () => setDragging(false);

  useEffect(() => {
    const handleMove = (e) => onPointerMove(e);
    const handleUp = () => endDrag();

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging]);

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
        ref={timerRef}
        onClick={() => setIsMinimized(false)}
        data-draggable="true"
        onPointerDown={onPointerDown}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          zIndex: 1000,
          background: isDark
            ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: dragging ? 'grabbing' : 'grab',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: 'monospace',
          userSelect: 'none',
          transition: dragging ? 'none' : 'all 0.2s ease',
          opacity: dragging ? 0.95 : 1
        }}
        onMouseEnter={(e) => !dragging && (e.target.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1.05)`)}
        onMouseLeave={(e) => !dragging && (e.target.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1)`)}
      >
        {isPaused ? '⏸️' : '📖'} {formatTime(elapsedTime)}
      </div>
    );
  }

  return (
    <div
      ref={timerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        zIndex: 1000,
        background: isDark ? '#1e293b' : '#ffffff',
        border: `2px solid ${isDark ? '#3b82f6' : '#2563eb'}`,
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: '280px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: dragging ? 'grabbing' : 'default',
        opacity: dragging ? 0.95 : 1,
        transition: dragging ? 'none' : 'box-shadow 0.2s ease'
      }}
    >
      {/* Header - Draggable */}
      <div
        data-draggable="true"
        onPointerDown={onPointerDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>📖</span>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: isDark ? '#f1f5f9' : '#1e293b'
            }}>
              Reading Session
            </div>
            <div style={{
              fontSize: '10px',
              color: isDark ? '#94a3b8' : '#64748b',
              opacity: 0.7
            }}>
              Drag to move
            </div>
          </div>
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