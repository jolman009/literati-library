// src/pages/subpages/ReadingPage.jsx
import React, { useState, useEffect } from 'react';
import { MD3Card, MD3Button, MD3Progress, MD3Chip } from '../../components/Material3';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useNavigate } from 'react-router-dom';

const ReadingPage = ({ books = [], onBookAction, readingSessions = [] }) => {
  const { actualTheme } = useMaterial3Theme();
  const navigate = useNavigate();
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    // Filter currently reading books
    const reading = books.filter(book => 
      book.isReading || book.status === 'reading'
    );
    setCurrentlyReadingBooks(reading);

    // Get recent reading sessions
    const recent = readingSessions
      ?.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 5) || [];
    setRecentSessions(recent);
  }, [books, readingSessions]);

  const handleContinueReading = (book) => {
    if (onBookAction) {
      onBookAction('read', book);
    } else {
      navigate(`/read/${book.id}`);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const BookCard = ({ book }) => {
    const progress = book.progress || 0;
    const lastRead = book.last_opened ? formatDate(book.last_opened) : 'Not started';
    const pagesRead = Math.round((progress / 100) * (book.total_pages || 0));
    const totalPages = book.total_pages || 0;

    return (
      <MD3Card style={{
        padding: '20px',
        background: actualTheme === 'dark' 
          ? 'linear-gradient(135deg, #1e293b, #334155)'
          : 'linear-gradient(135deg, #ffffff, #f8fafc)',
        border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
        transition: 'transform 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Book Cover */}
          <div style={{
            width: '100px',
            height: '150px',
            borderRadius: '8px',
            background: book.coverUrl 
              ? `url(${book.coverUrl}) center/cover`
              : `linear-gradient(135deg, #667eea, #764ba2)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {!book.coverUrl && (
              <span style={{ fontSize: '40px' }}>📖</span>
            )}
          </div>

          {/* Book Details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
                marginBottom: '4px'
              }}>
                {book.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
              }}>
                {book.author || 'Unknown Author'}
              </p>
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: 'auto' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '12px',
                color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
              }}>
                <span>Progress</span>
                <span>{pagesRead} / {totalPages} pages</span>
              </div>
              <MD3Progress value={progress} />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
                fontSize: '12px',
                color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
              }}>
                <span>{progress}% complete</span>
                <span>Last read: {lastRead}</span>
              </div>
            </div>

            {/* Action Button */}
            <MD3Button
              variant="filled"
              onClick={() => handleContinueReading(book)}
              style={{
                marginTop: '12px',
                width: 'fit-content'
              }}
            >
              Continue Reading
            </MD3Button>
          </div>
        </div>
      </MD3Card>
    );
  };

  const SessionCard = ({ session }) => (
    <div style={{
      padding: '16px',
      background: actualTheme === 'dark' ? '#334155' : '#f8fafc',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{
          fontSize: '14px',
          fontWeight: '500',
          color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
          marginBottom: '4px'
        }}>
          {session.book_title || 'Unknown Book'}
        </div>
        <div style={{
          fontSize: '12px',
          color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
        }}>
          {formatDate(session.start_time)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#6750a4'
        }}>
          {formatDuration(session.duration || 0)}
        </div>
        <div style={{
          fontSize: '12px',
          color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
        }}>
          {session.pages_read || 0} pages
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
        marginBottom: '24px'
      }}>
        📖 Currently Reading
      </h2>

      {currentlyReadingBooks.length === 0 ? (
        <MD3Card style={{
          padding: '48px',
          textAlign: 'center',
          background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
            marginBottom: '8px'
          }}>
            No books in progress
          </h3>
          <p style={{
            fontSize: '14px',
            color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
            marginBottom: '24px'
          }}>
            Start reading a book from your library to see it here
          </p>
          <MD3Button
            variant="filled"
            onClick={() => navigate('/library')}
          >
            Browse Library
          </MD3Button>
        </MD3Card>
      ) : (
        <>
          {/* Currently Reading Books */}
          <div style={{
            display: 'grid',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {currentlyReadingBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Recent Reading Sessions */}
          {recentSessions.length > 0 && (
            <MD3Card style={{
              padding: '24px',
              background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
                marginBottom: '20px'
              }}>
                Recent Reading Sessions
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {recentSessions.map((session, index) => (
                  <SessionCard key={session.id || index} session={session} />
                ))}
              </div>
            </MD3Card>
          )}

          {/* Reading Stats Summary */}
          <MD3Card style={{
            padding: '24px',
            marginTop: '32px',
            background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
              marginBottom: '20px'
            }}>
              Quick Stats
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                background: actualTheme === 'dark' ? '#334155' : '#f8fafc',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#6750a4'
                }}>
                  {currentlyReadingBooks.length}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
                  marginTop: '4px'
                }}>
                  Books in Progress
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: actualTheme === 'dark' ? '#334155' : '#f8fafc',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📖</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#4caf50'
                }}>
                  {Math.round(
                    currentlyReadingBooks.reduce((sum, book) => sum + (book.progress || 0), 0) / 
                    currentlyReadingBooks.length
                  ) || 0}%
                </div>
                <div style={{
                  fontSize: '12px',
                  color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
                  marginTop: '4px'
                }}>
                  Average Progress
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: actualTheme === 'dark' ? '#334155' : '#f8fafc',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏱️</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#2196f3'
                }}>
                  {recentSessions.length}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
                  marginTop: '4px'
                }}>
                  Recent Sessions
                </div>
              </div>
            </div>
          </MD3Card>
        </>
      )}
    </div>
  );
};

export default ReadingPage;