// src/components/TimerPopupWidget.jsx - NEW MODAL VERSION
import React, { useState, useEffect } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  Square, 
  Plus,
  Minus,
  X
} from 'lucide-react';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';

const TimerPopupWidget = ({ book, isOpen, onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(book?.currentPage || 1);
  const [sessionStarted, setSessionStarted] = useState(false);

  const { startReadingSession, stopReadingSession, updateProgress } = useReadingSession();
  const { trackAction } = useGamification();

  const presets = [
    { label: '10 min', minutes: 10, icon: '⚡', description: 'Quick read' },
    { label: '25 min', minutes: 25, icon: '🍅', description: 'Pomodoro' },
    { label: '45 min', minutes: 45, icon: '📚', description: 'Deep dive' },
    { label: '60 min', minutes: 60, icon: '🎯', description: 'Long session' }
  ];

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive && sessionStarted) {
      setIsActive(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, sessionStarted]);

  const startTimer = async (minutes) => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setIsActive(true);
    setSessionStarted(true);
    
    // Start reading session in context
    try {
      await startReadingSession(book);
      trackAction('start_reading_session', { 
        bookId: book.id, 
        plannedDuration: minutes 
      });
    } catch (error) {
      console.error('Failed to start reading session:', error);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    trackAction(isActive ? 'pause_session' : 'resume_session');
  };

  const stopTimer = async () => {
    if (sessionStarted) {
      await handleSessionComplete();
    }
    resetTimer();
    onClose(); // Close modal when stopping
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(0);
    setTotalTime(0);
    setSelectedPreset(null);
    setSessionStarted(false);
  };

  const handleSessionComplete = async () => {
    const readingTime = Math.floor((totalTime - timeLeft) / 60);
    const pagesRead = currentPage - (book?.currentPage || 1);
    
    try {
      // Stop reading session in context
      await stopReadingSession();
      
      // Update book progress if pages were read
      if (pagesRead > 0) {
        await updateProgress(book.id, currentPage, readingTime);
      }
      
      // Track gamification
      trackAction('complete_reading_session', {
        bookId: book.id,
        minutesRead: readingTime,
        pagesRead: pagesRead
      });
      
      // Show success message
      console.log(`🎉 Reading session completed! ${readingTime} minutes, ${pagesRead} pages`);
      
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            transform: 'scale(1)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  Reading Session
                </h2>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#6b7280',
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {book?.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e5e7eb';
                e.target.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#6b7280';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!sessionStarted ? (
            // Session Setup Screen
            <div>
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  How long do you want to read?
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {presets.map((preset) => (
                    <button
                      key={preset.minutes}
                      onClick={() => startTimer(preset.minutes)}
                      style={{
                        padding: '20px 16px',
                        borderRadius: '16px',
                        border: '2px solid #e5e7eb',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.backgroundColor = '#eff6ff';
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ fontSize: '32px' }}>{preset.icon}</div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {preset.label}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Time */}
              <div style={{
                padding: '24px',
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{
                  margin: '0 0 16px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Custom duration:
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <button
                    onClick={() => setCustomMinutes(Math.max(5, customMinutes - 5))}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: '2px solid #e5e7eb',
                      backgroundColor: 'white',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#1f2937'
                    }}>
                      {customMinutes}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      minutes
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setCustomMinutes(Math.min(180, customMinutes + 5))}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: '2px solid #e5e7eb',
                      backgroundColor: 'white',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.backgroundColor = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                <button
                  onClick={() => startTimer(customMinutes)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Start {customMinutes} minute session
                </button>
              </div>
            </div>
          ) : (
            // Active Timer Screen
            <div style={{ textAlign: 'center' }}>
              {/* Circular Progress */}
              <div style={{
                position: 'relative',
                width: '200px',
                height: '200px',
                margin: '0 auto 32px'
              }}>
                <svg 
                  style={{ width: '200px', height: '200px', transform: 'rotate(-90deg)' }}
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 2.827} 282.7`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {formatTime(timeLeft)}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>
                    {Math.floor((totalTime - timeLeft) / 60)}m elapsed
                  </div>
                </div>
              </div>

              {/* Page Tracker */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    Current Page:
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '2px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.backgroundColor = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      minWidth: '60px',
                      textAlign: 'center'
                    }}>
                      {currentPage}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: '2px solid #e5e7eb',
                        backgroundColor: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.backgroundColor = '#eff6ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.backgroundColor = 'white';
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Timer Controls */}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={toggleTimer}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive ? 
                      'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' : 
                      'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isActive ? 'Pause' : 'Resume'}
                </button>
                
                <button
                  onClick={stopTimer}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.backgroundColor = '#dc2626';
                    e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.backgroundColor = '#ef4444';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default TimerPopupWidget;