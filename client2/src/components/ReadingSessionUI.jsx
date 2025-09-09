// src/components/ReadingSessionUI.jsx - UI Components for Reading Sessions
import React, { useState, useEffect } from 'react';
import { Timer, BookOpen, Play, Pause, X, Maximize2 } from 'lucide-react';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useAuth } from '../contexts/AuthContext';
import ReadingTracker from './ReadingTracker';

// Floating Reading Timer - Shows when session is active but tracker is hidden
export const FloatingReadingTimer = () => {
  const { activeSession, sessionStats, showReadingTracker, showReadingTrackerModal, stopReadingSession } = useReadingSession();
  const [readingTime, setReadingTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Update timer every second
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

  const handleStopReading = async () => {
    const result = await stopReadingSession();
    if (result.success) {
      // Show completion notification
      console.log(`✅ Reading session completed: ${result.duration}m, ${result.pages} pages`);
    }
  };

  // Don't show if no active session or if tracker is visible
  if (!activeSession || showReadingTracker) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-72'
      }`}>
        {isMinimized ? (
          // Minimized view - just the timer
          <button
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-700"
          >
            <Timer className="w-6 h-6" />
          </button>
        ) : (
          // Full view
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Reading</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Minimize"
                >
                  <Maximize2 className="w-4 h-4 rotate-180" />
                </button>
                <button
                  onClick={handleStopReading}
                  className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  title="Stop Reading"
                >
                  <X className="w-4 h-4" />
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{formatTime(readingTime)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{sessionStats.pagesRead || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pages</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={showReadingTrackerModal}
                className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Tracker
              </button>
              <button
                onClick={handleStopReading}
                className="py-2 px-3 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
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

// Reading Session Manager - Handles the ReadingTracker modal
export const ReadingSessionManager = () => {
  const { activeSession, showReadingTracker, hideReadingTracker } = useReadingSession();
  const { token } = useAuth();

  if (!activeSession || !showReadingTracker) return null;

  return (
    <ReadingTracker
      book={activeSession.book}
      onClose={hideReadingTracker}
      token={token}
    />
  );
};

// Start Reading Button - Enhanced button for starting sessions
export const StartReadingButton = ({ book, className = '', children, ...props }) => {
  const { startReadingSession, hasActiveSession } = useReadingSession();
  const [loading, setLoading] = useState(false);

  const handleStartReading = async () => {
    if (hasActiveSession) {
      // Ask user if they want to stop current session
      const shouldStop = window.confirm('You have an active reading session. Stop it and start a new one?');
      if (!shouldStop) return;
    }

    setLoading(true);
    try {
      const result = await startReadingSession(book);
      if (result.success) {
        console.log(`📖 Started reading: ${book.title}`);
      }
    } catch (error) {
      console.error('Failed to start reading session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartReading}
      disabled={loading}
      className={`flex items-center space-x-2 ${className}`}
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

// Reading Session Status Indicator - Shows in header/nav
export const ReadingSessionStatus = () => {
  const { activeSession, sessionStats, showReadingTrackerModal } = useReadingSession();
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
    <button
      onClick={showReadingTrackerModal}
      className="flex items-center space-x-3 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
    >
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <BookOpen className="w-4 h-4" />
      </div>
      <div className="text-sm">
        <div className="font-medium">{formatTime(readingTime)}</div>
        <div className="text-xs opacity-75">{activeSession.book.title}</div>
      </div>
    </button>
  );
};