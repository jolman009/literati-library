// src/components/FloatingReadingTimer.jsx
// Complete version with all reading timer components

import React, { useState, useEffect, useRef } from 'react';
import { Timer, BookOpen, X, Maximize2, Minimize2, Square, Play, Pause } from 'lucide-react';
import { useReadingSession } from '../contexts/ReadingSessionContext';

// ===============================================
// BASIC FLOATING READING TIMER
// ===============================================

export const FloatingReadingTimer = () => {
  const { 
    activeSession, 
    showReadingTracker, 
    showReadingTrackerModal, 
    stopReadingSession 
  } = useReadingSession();
  
  const [readingTime, setReadingTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const intervalRef = useRef(null);

  // Update timer every second
  useEffect(() => {
    if (!activeSession) return;

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const start = new Date(activeSession.startTime);
      const elapsed = Math.floor((now - start) / 1000);
      setReadingTime(elapsed);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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

  const handleStopReading = async () => {
    const result = await stopReadingSession();
    if (result?.success) {
      console.log(`✅ Session completed: ${result.duration}m, ${result.pages} pages`);
    }
  };

  // Don't show if no active session or if full tracker is visible
  if (!activeSession || showReadingTracker) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-72'
      }`}>
        {isMinimized ? (
          // Minimized view - just the timer icon
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors"
            title="Expand timer"
          >
            <div className="reading-indicator">
              <Timer className="w-6 h-6" />
            </div>
          </button>
        ) : (
          // Full view - enhanced with Material 3 styling
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="reading-indicator w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Reading</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleStopReading}
                  className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Stop reading"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Book Info */}
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activeSession.book.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {activeSession.book.author}
              </p>
            </div>

            {/* Enhanced Timer Display */}
            <div className="text-center mb-3 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 font-mono timer-display">
                {formatTime(readingTime)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Reading time</div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={showReadingTrackerModal}
                className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Open Tracker
              </button>
              <button
                onClick={handleStopReading}
                className="py-2 px-3 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Stop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===============================================
// ENHANCED FLOATING READING TIMER (Material 3)
// ===============================================

export const EnhancedFloatingReadingTimer = () => {
  const { 
    activeSession, 
    showReadingTracker, 
    showReadingTrackerModal, 
    stopReadingSession,
    pauseReadingSession,
    resumeReadingSession,
    isPaused
  } = useReadingSession();
  
  const [readingTime, setReadingTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const intervalRef = useRef(null);

  // Update timer every second
  useEffect(() => {
    if (!activeSession) return;

    intervalRef.current = setInterval(() => {
      if (activeSession.isPaused) {
        // When paused, use accumulated time + time before pause
        setReadingTime(activeSession.accumulatedTime || 0);
      } else {
        // When active, calculate current elapsed time
        const now = new Date();
        const start = new Date(activeSession.startTime);
        const currentElapsed = Math.floor((now - start) / 1000);
        const totalElapsed = (activeSession.accumulatedTime || 0) + currentElapsed;
        setReadingTime(totalElapsed);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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

  const handleStopReading = async () => {
    const result = await stopReadingSession();
    if (result?.success) {
      console.log(`✅ Session completed: ${result.duration}m, ${result.pages} pages`);
    }
  };

  const handlePauseReading = () => {
    const result = pauseReadingSession();
    if (result?.success) {
      console.log('⏸️ Reading session paused');
    }
  };

  const handleResumeReading = () => {
    const result = resumeReadingSession();
    if (result?.success) {
      console.log('▶️ Reading session resumed');
    }
  };

  const handleToggleActions = () => {
    setShowActions(!showActions);
  };

  // Don't show if no active session
  if (!activeSession) return null;

  return (
    <div className="md3-fab-group md3-fab-group--bottom-right md3-reading-fab">
      {/* Action FABs (when expanded) */}
      {showActions && (
        <div className="md3-fab-group__actions">
          <div className="md3-fab-group__action">
            <div className="md3-fab-group__action-label">Open Tracker</div>
            <button
              className="md3-fab md3-fab--small md3-fab--secondary"
              onClick={showReadingTrackerModal}
              title="Open Reading Tracker"
            >
              <div className="md3-fab__content">
                <div className="md3-fab__icon">
                  <Maximize2 size={20} />
                </div>
              </div>
              <div className="md3-fab__ripple"></div>
              <div className="md3-fab__focus-ring"></div>
            </button>
          </div>
          
          <div className="md3-fab-group__action">
            <div className="md3-fab-group__action-label">
              {isPaused ? 'Resume Reading' : 'Pause Reading'}
            </div>
            <button
              className="md3-fab md3-fab--small md3-fab--secondary"
              onClick={isPaused ? handleResumeReading : handlePauseReading}
              title={isPaused ? 'Resume Reading Session' : 'Pause Reading Session'}
            >
              <div className="md3-fab__content">
                <div className="md3-fab__icon">
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </div>
              </div>
              <div className="md3-fab__ripple"></div>
              <div className="md3-fab__focus-ring"></div>
            </button>
          </div>
          
          <div className="md3-fab-group__action">
            <div className="md3-fab-group__action-label">Stop Reading</div>
            <button
              className="md3-fab md3-fab--small md3-fab--tertiary"
              onClick={handleStopReading}
              title="Stop Reading Session"
            >
              <div className="md3-fab__content">
                <div className="md3-fab__icon">
                  <Square size={20} />
                </div>
              </div>
              <div className="md3-fab__ripple"></div>
              <div className="md3-fab__focus-ring"></div>
            </button>
          </div>
        </div>
      )}

      {/* Main Timer FAB */}
      <button
        className={`md3-fab md3-fab--primary ${isMinimized ? 'md3-fab--medium' : 'md3-fab--extended'}`}
        onClick={isMinimized ? () => setIsMinimized(false) : handleToggleActions}
        title={isMinimized ? 'Expand Timer' : 'Timer Actions'}
      >
        <div className="md3-fab__content">
          <div className="md3-fab__icon">
            {isMinimized ? (
              <Timer size={24} />
            ) : showActions ? (
              <X size={24} />
            ) : (
              <div className="reading-indicator">
                <BookOpen size={24} />
              </div>
            )}
          </div>
          {!isMinimized && (
            <div className="md3-fab__label timer-display">
              {formatTime(readingTime)}
            </div>
          )}
        </div>
        <div className="md3-fab__ripple"></div>
        <div className="md3-fab__focus-ring"></div>
      </button>

      {/* Minimize Button (when expanded) */}
      {!isMinimized && (
        <button
          className="md3-fab md3-fab--small md3-fab--surface"
          onClick={() => setIsMinimized(true)}
          title="Minimize Timer"
          style={{ position: 'absolute', top: '-50px', right: '0' }}
        >
          <div className="md3-fab__content">
            <div className="md3-fab__icon">
              <Minimize2 size={20} />
            </div>
          </div>
          <div className="md3-fab__ripple"></div>
          <div className="md3-fab__focus-ring"></div>
        </button>
      )}
    </div>
  );
};

// ===============================================
// START READING BUTTONS
// ===============================================

// Simple Tailwind CSS version (works immediately)
export const StartReadingButton = ({ 
  book, 
  className = '', 
  children,
  variant = 'primary',
  ...props 
}) => {
  const { startReadingSession, activeSession } = useReadingSession();
  const [loading, setLoading] = useState(false);

  const handleStartReading = async () => {
    if (activeSession) {
      const shouldStop = window.confirm(
        'You have an active reading session. Stop it and start a new one?'
      );
      if (!shouldStop) return;
    }

    setLoading(true);
    try {
      const result = await startReadingSession(book);
      if (result?.success) {
        console.log(`📖 Started reading: ${book.title}`);
      }
    } catch (error) {
      console.error('Failed to start reading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
  };

  return (
    <button
      className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      onClick={handleStartReading}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Starting...</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          <span>{children || 'Start Reading'}</span>
        </>
      )}
    </button>
  );
};

// Material 3 version (needs MD3 CSS)
export const MD3StartReadingButton = ({ 
  book, 
  variant = 'filled', 
  size = 'medium',
  className = '', 
  children,
  showIcon = true,
  ...props 
}) => {
  const { startReadingSession, activeSession } = useReadingSession();
  const [loading, setLoading] = useState(false);

  const handleStartReading = async () => {
    if (activeSession) {
      const shouldStop = window.confirm(
        'You have an active reading session. Stop it and start a new one?'
      );
      if (!shouldStop) return;
    }

    setLoading(true);
    try {
      const result = await startReadingSession(book);
      if (result?.success) {
        console.log(`📖 Started reading: ${book.title}`);
      }
    } catch (error) {
      console.error('Failed to start reading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = () => {
    const baseClass = 'md3-button';
    const variantClass = `md3-button--${variant}`;
    const sizeClass = size !== 'medium' ? `md3-button--${size}` : '';
    
    return [baseClass, variantClass, sizeClass, className]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <button
      className={getButtonClass()}
      onClick={handleStartReading}
      disabled={loading}
      {...props}
    >
      <div className="md3-button__content">
        {loading ? (
          <div className="md3-button__loading">
            <svg className="md3-button__spinner" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        ) : (
          showIcon && (
            <div className="md3-button__icon">
              <Play size={20} />
            </div>
          )
        )}
        <span className="md3-button__label">
          {loading ? 'Starting...' : (children || 'Start Reading')}
        </span>
      </div>
      <div className="md3-button__ripple"></div>
      <div className="md3-button__focus-ring"></div>
    </button>
  );
};

// ===============================================
// READING SESSION STATUS
// ===============================================

export const ReadingSessionStatus = () => {
  const { activeSession } = useReadingSession();
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(activeSession.startTime);
      const elapsed = Math.floor((now - start) / 1000);
      setReadingTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeSession) return null;

  return (
    <div className="flex items-center space-x-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <BookOpen className="w-4 h-4" />
      </div>
      <div className="text-sm">
        <div className="font-medium font-mono">{formatTime(readingTime)}</div>
        <div className="text-xs opacity-75 truncate max-w-32">
          {activeSession.book.title}
        </div>
      </div>
    </div>
  );
};

// Material 3 version
export const MD3ReadingSessionStatus = () => {
  const { activeSession } = useReadingSession();
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(activeSession.startTime);
      const elapsed = Math.floor((now - start) / 1000);
      setReadingTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeSession) return null;

  return (
    <div className="md3-chip md3-chip--assist reading-session-status">
      <div className="md3-chip__content">
        <div className="md3-chip__icon">
          <div className="reading-indicator">
            <BookOpen size={18} />
          </div>
        </div>
        <span className="md3-chip__label timer-display">
          {formatTime(readingTime)}
        </span>
        <div className="md3-chip__subtitle">
          {activeSession.book.title}
        </div>
      </div>
      <div className="md3-chip__ripple"></div>
    </div>
  );
};

// ===============================================
// DEFAULT EXPORT
// ===============================================

export default FloatingReadingTimer;