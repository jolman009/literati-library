// src/components/ReadingTracker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Clock, BookOpen, Eye, Timer, RotateCcw, BarChart3, Award } from 'lucide-react';

export const ReadingTracker = ({ book, onClose, token }) => {
  const [isReading, setIsReading] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const [pagesRead, setPagesRead] = useState(0);
  const [showTracker, setShowTracker] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const intervalRef = useRef(null);
  const inactivityRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (inactivityRef.current) {
      clearInterval(inactivityRef.current);
      inactivityRef.current = null;
    }
  };

  const startReading = () => {
    if (!isReading) {
      setIsReading(true);
      setSessionStart(new Date());
      
      intervalRef.current = setInterval(() => {
        setReadingTime(prev => prev + 1);
      }, 1000);

      console.log('📖 Reading session started');
    }
  };

  const pauseReading = () => {
    if (isReading) {
      setIsReading(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      console.log('⏸️ Reading session paused');
    }
  };

  const saveSession = async () => {
    if (readingTime > 0 && token) {
      try {
        const minutes = Math.floor(readingTime / 60);
        
        // Save reading session to backend
        const response = await fetch('/api/reading-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bookId: book.id,
            duration: minutes,
            pagesRead,
            startTime: sessionStart?.toISOString(),
            endTime: new Date().toISOString()
          })
        });

        if (response.ok) {
          console.log('✅ Reading session saved');
          
          // Track to gamification system
          if (window.trackAction) {
            if (minutes > 0) {
              await window.trackAction('reading_time', {
                minutes,
                sessionLength: minutes,
                bookId: book.id
              });
            }
            
            if (pagesRead > 0) {
              await window.trackAction('pages_read', {
                pages: pagesRead,
                bookId: book.id
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to save reading session:', error);
      }
    }
  };

  const handleClose = async () => {
    pauseReading();
    await saveSession();
    cleanup();
    if (onClose) {
      onClose();
    }
  };

  const resetSession = () => {
    setReadingTime(0);
    setPagesRead(0);
    setSessionStart(null);
    pauseReading();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-detect reading activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      
      if (!isReading) {
        startReading();
      }
    };

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      
      // Stop reading after 30 seconds of inactivity
      if (timeSinceActivity > 30000 && isReading) {
        pauseReading();
      }
    };

    const events = ['click', 'scroll', 'keydown', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    inactivityRef.current = setInterval(checkInactivity, 5000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      cleanup();
    };
  }, [isReading]);

  // Auto-start reading when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startReading();
    }, 2000);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  if (!token) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No authentication token found.</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header with Reading Tracker */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
          <div className="flex items-center space-x-4">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {book?.title || 'Reading Session'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {book?.author ? `by ${book.author}` : 'Interactive Reading Tracker'}
              </p>
            </div>
          </div>

          {/* Reading Tracker Controls */}
          {showTracker && (
            <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-blue-600" />
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {formatTime(readingTime)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-green-600" />
                <input
                  type="number"
                  value={pagesRead}
                  onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">pages</span>
              </div>

              <button
                type="button"
                onClick={isReading ? pauseReading : startReading}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isReading 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                }`}
              >
                {isReading ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isReading ? 'Pause' : 'Start'}</span>
              </button>

              <button
                type="button"
                onClick={resetSession}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          )}

          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4">
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Reading tracker active</p>
            <p className="text-sm">Your reading time and progress are being tracked automatically</p>
            
            {/* Reading Status */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isReading ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span>{isReading ? 'Currently Reading' : 'Paused'}</span>
                </div>
                
                {isReading && (
                  <div className="text-gray-500 dark:text-gray-400">
                    Auto-pause after 30s of inactivity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReadingTracker;