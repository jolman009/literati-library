// src/pages/subpages/ReadingPage.jsx
import React, { useState, useEffect } from 'react';
import { MD3Card, MD3Button, MD3Progress, MD3Chip } from '../../components/Material3';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useReadingSession } from '../../contexts/ReadingSessionContext';
import { useNavigate } from 'react-router-dom';
import styles from './ReadingPage.module.css';

const ReadingPage = ({ books = [], onBookAction }) => {
  const { actualTheme } = useMaterial3Theme();
  const {
    activeSession,
    isPaused,
    stopReadingSession,
    pauseReadingSession,
    resumeReadingSession
  } = useReadingSession();
  const navigate = useNavigate();
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [todayStats, setTodayStats] = useState({
    timeRead: 0,
    pagesRead: 0,
    sessionsCompleted: 0
  });

  useEffect(() => {
    // Filter currently reading books
    const reading = books.filter(book =>
      book.is_reading || book.status === 'reading'
    );
    setCurrentlyReadingBooks(reading);

    // Get reading session history from localStorage
    const history = JSON.parse(localStorage.getItem('readingSessionHistory') || '[]');
    setSessionHistory(history);

    // Get recent reading sessions (last 10)
    const recent = history
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 10);
    setRecentSessions(recent);

    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = history.filter(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });

    const stats = {
      timeRead: todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      pagesRead: todaySessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0),
      sessionsCompleted: todaySessions.length
    };
    setTodayStats(stats);
  }, [books]);

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
      <MD3Card
        variant="elevated"
        elevation={1}
        interactive={true}
        onClick={() => handleContinueReading(book)}
        className={styles.bookCard}
      >
        <div className={styles.bookCardContent}>
          {/* Book Cover */}
          <div className={styles.bookCover}>
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className={styles.bookCoverImage} />
            ) : (
              <span className={styles.bookCoverPlaceholder}>📖</span>
            )}
          </div>

          {/* Book Details */}
          <div className={styles.bookDetails}>
            <div>
              <h3 className={styles.bookTitle}>{book.title}</h3>
              <p className={styles.bookAuthor}>{book.author || 'Unknown Author'}</p>
            </div>

            {/* Progress Bar */}
            <div className={styles.bookProgressSection}>
              <div className={styles.bookProgressHeader}>
                <span>Progress</span>
                <span>{pagesRead} / {totalPages} pages</span>
              </div>
              <MD3Progress value={progress} />
              <div className={styles.bookProgressFooter}>
                <span>{progress}% complete</span>
                <span>Last read: {lastRead}</span>
              </div>
            </div>

            {/* Action Button */}
            <MD3Button
              variant="filled"
              onClick={() => handleContinueReading(book)}
              className={styles.continueButton}
            >
              Continue Reading
            </MD3Button>
          </div>
        </div>
      </MD3Card>
    );
  };

  const SessionCard = ({ session }) => {
    const bookTitle = session.book?.title || session.bookTitle || 'Unknown Book';
    const sessionDate = session.startTime || session.start_time;
    const pagesRead = session.pagesRead || session.pages_read || 0;

    return (
      <div className={styles.sessionHistoryItem}>
        <div className={styles.sessionHistoryItemInfo}>
          <div className={styles.sessionHistoryItemTitle}>
            📖 {bookTitle}
          </div>
          <div className={styles.sessionHistoryItemDate}>
            {sessionDate && formatDate(sessionDate)}
          </div>
        </div>
        <div className={styles.sessionHistoryItemStats}>
          <div className={styles.sessionHistoryItemDuration}>
            ⏱️ {formatDuration(session.duration || 0)}
          </div>
          <div className={styles.sessionHistoryItemPages}>
            {pagesRead} pages
          </div>
        </div>
      </div>
    );
  };

  const ActiveSessionCard = () => {
    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
      if (!isPaused) {
        // Initial update
        const start = new Date(activeSession.startTime);
        const now = new Date();
        const elapsed = Math.floor((now - start) / 1000 / 60); // minutes
        setElapsedTime(elapsed);

        // Update every 30 seconds (timer shows minutes, so 1-second updates are wasteful)
        const interval = setInterval(() => {
          const start = new Date(activeSession.startTime);
          const now = new Date();
          const elapsed = Math.floor((now - start) / 1000 / 60); // minutes
          setElapsedTime(elapsed);
        }, 30000); // 30 seconds = 97% fewer re-renders

        return () => clearInterval(interval);
      }
    }, [isPaused, activeSession]);

    // Check if we should render (after all hooks)
    if (!activeSession) return null;

    return (
      <MD3Card variant="filled" className={styles.activeSessionCard}>
        <div className={styles.sessionHeader}>
          <div className={styles.sessionInfo}>
            <span className={styles.sessionIcon}>📚</span>
            <div>
              <h3 className={styles.sessionTitle}>Active Reading Session</h3>
              <p className={styles.sessionBookTitle}>
                {activeSession.book?.title || 'Unknown Book'}
              </p>
            </div>
          </div>
          <MD3Chip
            label={isPaused ? 'Paused' : 'Reading'}
            icon={isPaused ? '⏸️' : '▶️'}
            color={isPaused ? 'warning' : 'success'}
          />
        </div>

        <div className={styles.sessionStatsGrid}>
          <div className={styles.sessionStat}>
            <div className={styles.sessionStatIcon}>⏱️</div>
            <div className={styles.sessionStatValue}>
              {formatDuration(elapsedTime)}
            </div>
            <div className={styles.sessionStatLabel}>Duration</div>
          </div>

          <div className={styles.sessionStat}>
            <div className={styles.sessionStatIcon}>📄</div>
            <div className={styles.sessionStatValue}>
              {activeSession.pagesRead || 0}
            </div>
            <div className={styles.sessionStatLabel}>Pages Read</div>
          </div>
        </div>

        <div className={styles.sessionActions}>
          {isPaused ? (
            <MD3Button
              variant="filled"
              onClick={resumeReadingSession}
            >
              ▶️ Resume Reading
            </MD3Button>
          ) : (
            <MD3Button
              variant="filled"
              onClick={pauseReadingSession}
            >
              ⏸️ Pause Session
            </MD3Button>
          )}
          <MD3Button
            variant="outlined"
            onClick={stopReadingSession}
          >
            ⏹️ End Session
          </MD3Button>
          <MD3Button
            variant="text"
            onClick={() => navigate(`/read/${activeSession.book?.id}`)}
          >
            Open Book
          </MD3Button>
        </div>
      </MD3Card>
    );
  };

  return (
    <div className={styles.readingPage}>
      {/* Header Section */}
      <div className={styles.readingHeader}>
        <h1 className={styles.pageTitle}>
          <span className={styles.titleIcon}>📖</span>
          Reading Sessions
        </h1>

        {/* Navigation Links */}
        <div className={styles.headerNav}>
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'library' } })}
            className={styles.navButton}
          >
            📚 Library
          </MD3Button>
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'stats' } })}
            className={styles.navButton}
          >
            📊 Statistics
          </MD3Button>
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'collections' } })}
            className={styles.navButton}
          >
            📁 Collections
          </MD3Button>
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'notes' } })}
            className={styles.navButton}
          >
            📝 Notes
          </MD3Button>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.readingContent}>
        {/* Active Session Card */}
        <div role="region" aria-label="Active reading session" aria-live="polite">
          <ActiveSessionCard />
        </div>

      {/* Today's Reading Stats */}
      <div role="region" aria-label="Today's reading statistics">
        <MD3Card variant="filled" className={styles.todayStatsCard}>
          <h3 className={styles.todayStatsTitle}>
            <span>📅</span> Today's Reading
          </h3>
          <div className={styles.todayStatsGrid}>
            <div className={styles.todayStatItem}>
              <div className={styles.todayStatIcon}>⏱️</div>
              <div className={styles.todayStatValue}>
                {formatDuration(todayStats.timeRead)}
              </div>
              <div className={styles.todayStatLabel}>Time Read</div>
            </div>

            <div className={styles.todayStatItem}>
              <div className={styles.todayStatIcon}>📄</div>
              <div className={styles.todayStatValue}>
                {todayStats.pagesRead}
              </div>
              <div className={styles.todayStatLabel}>Pages Read</div>
            </div>

            <div className={styles.todayStatItem}>
              <div className={styles.todayStatIcon}>🎯</div>
              <div className={styles.todayStatValue}>
                {todayStats.sessionsCompleted}
              </div>
              <div className={styles.todayStatLabel}>Sessions</div>
            </div>
          </div>
        </MD3Card>
      </div>

      <h3 className={styles.sectionTitle}>
        Currently Reading Books
      </h3>

      {currentlyReadingBooks.length === 0 ? (
        <MD3Card className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>📚</div>
          <h3 className={styles.emptyStateTitle}>No books in progress</h3>
          <p className={styles.emptyStateMessage}>
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
          <div className={styles.bookCardsGrid}>
            {currentlyReadingBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Recent Reading Sessions */}
          {recentSessions.length > 0 && (
            <MD3Card className={styles.sessionHistoryCard}>
              <h3 className={styles.sessionHistoryTitle}>
                Recent Reading Sessions
              </h3>
              <div className={styles.sessionHistoryList}>
                {recentSessions.map((session, index) => (
                  <SessionCard key={session.id || index} session={session} />
                ))}
              </div>
            </MD3Card>
          )}

          {/* Reading Stats Summary */}
          <MD3Card className={styles.quickStatsCard}>
            <h3 className={styles.quickStatsTitle}>Quick Stats</h3>
            <div className={styles.quickStatsGrid}>
              <div className={styles.quickStatItem}>
                <div className={styles.quickStatIcon}>📚</div>
                <div className={styles.quickStatValue}>
                  {currentlyReadingBooks.length}
                </div>
                <div className={styles.quickStatLabel}>Books in Progress</div>
              </div>

              <div className={styles.quickStatItem}>
                <div className={styles.quickStatIcon}>📖</div>
                <div className={styles.quickStatValue}>
                  {Math.round(
                    currentlyReadingBooks.reduce((sum, book) => sum + (book.progress || 0), 0) /
                    currentlyReadingBooks.length
                  ) || 0}%
                </div>
                <div className={styles.quickStatLabel}>Average Progress</div>
              </div>

              <div className={styles.quickStatItem}>
                <div className={styles.quickStatIcon}>⏱️</div>
                <div className={styles.quickStatValue}>
                  {recentSessions.length}
                </div>
                <div className={styles.quickStatLabel}>Recent Sessions</div>
              </div>
            </div>
          </MD3Card>
        </>
      )}
      </div>
    </div>
  );
};

export default ReadingPage;