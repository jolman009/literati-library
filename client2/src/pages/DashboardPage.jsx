// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useSnackbar } from '../components/Material3';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import API from '../config/api';
import MD3Card from '../components/Material3/MD3Card';
import LiteraryMentorUI from '../components/LiteraryMentorUI';
import FillingArc from '../components/gamification/FillingArc';
import '../styles/dashboard-page.css';
import ThemeToggle from '../components/ThemeToggle';

// Welcome Component with reduced padding
const WelcomeSection = ({ user, onCheckInUpdate }) => {
  const { stats, achievements } = useGamification();
  const { actualTheme, toggleTheme } = useMaterial3Theme();
  const navigate = useNavigate();
  const { trackAction } = useGamification();
  const { showSnackbar } = useSnackbar();
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  
  // Check if already checked in today and calculate streak on component mount
  const [checkInStreak, setCheckInStreak] = useState(0);
  
  useEffect(() => {
    console.log(' WelcomeSection: useEffect for daily check-in');
    const lastCheckIn = localStorage.getItem('lastDailyCheckIn');
    const today = new Date().toDateString();
    setHasCheckedInToday(lastCheckIn === today);
    
    // Calculate check-in streak
    const streak = parseInt(localStorage.getItem('checkInStreak') || '0');
    setCheckInStreak(streak);
  }, []);
  
  const levelProgress = useMemo(() => {
    if (!stats) return 0;
    const currentLevelMin = (stats.level - 1) * 100;
    const currentLevelMax = stats.level * 100;
    return ((stats.totalPoints - currentLevelMin) / (currentLevelMax - currentLevelMin)) * 100;
  }, [stats]);

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    if (checkInStreak >= 7) return `${timeGreeting}! 🎯 Amazing ${checkInStreak}-day check-in streak!`;
    if (stats?.readingStreak >= 7) return `${timeGreeting}! 🔥 You're on fire with a ${stats.readingStreak}-day reading streak!`;
    if (stats?.booksRead >= 10) return `${timeGreeting}! 📚 Amazing - you've read ${stats.booksRead} books!`;
    if (achievements?.length >= 5) return `${timeGreeting}! 🏆 You're crushing it with ${achievements.length} achievements!`;
    return `${timeGreeting}! Ready to dive into your next great read?`;
  };

  const handleDailyCheckIn = useCallback(async () => {
    try {
      // Check if already checked in today
      const lastCheckIn = localStorage.getItem('lastDailyCheckIn');
      const today = new Date().toDateString();
      
      if (lastCheckIn === today) {
        showSnackbar({
          message: '✨ You\'ve already checked in today! Come back tomorrow.',
          variant: 'info'
        });
        return;
      }
      
      // Calculate streak
      let newStreak = 1;
      const storedStreak = parseInt(localStorage.getItem('checkInStreak') || '0');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      if (lastCheckIn === yesterdayString) {
        // Continuing streak
        newStreak = storedStreak + 1;
      } else if (lastCheckIn && new Date(lastCheckIn) < yesterday) {
        // Streak broken, starting over
        newStreak = 1;
      }
      
      // Save check-in and streak locally
      localStorage.setItem('lastDailyCheckIn', today);
      localStorage.setItem('checkInStreak', newStreak.toString());
      setHasCheckedInToday(true);
      setCheckInStreak(newStreak);
      
      // Update parent component
      if (onCheckInUpdate) {
        onCheckInUpdate(newStreak);
      }
      
      // Track the action if trackAction exists
      if (typeof trackAction === 'function') {
        try {
          await trackAction('daily_checkin', { 
            points: 10,
            streak: newStreak,
            timestamp: new Date().toISOString() 
          });
        } catch (trackError) {
          console.log('Tracking not available, but check-in recorded locally');
        }
      }
      
      // Show success message with streak info
      const streakMessage = newStreak > 1 
        ? `🔥 ${newStreak} day streak!` 
        : '';
      showSnackbar({
        message: `✅ Daily check-in complete! +10 points earned! ${streakMessage}`,
        variant: 'success'
      });
      
      // Optional: Try to sync with backend (but don't fail if it doesn't exist)
      if (API && API.post) {
        API.post('/gamification/daily-checkin').catch(() => {
          // Silently ignore if endpoint doesn't exist
          console.log('Daily check-in saved locally');
        });
      }
      
    } catch (error) {
      console.error('Daily check-in error:', error);
      showSnackbar({
        message: '❌ Check-in failed. Please try again.',
        variant: 'error'
      });
    }
  }, [trackAction, showSnackbar, onCheckInUpdate]);

  return (
    <div className="welcome-section">
      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {actualTheme === 'dark' ? (<Sun size={20} aria-hidden="true" />) : (<Moon size={20} aria-hidden="true" />)}
      </button>

      <div className="welcome-header">
        <h1 className="welcome-title">
          {getMotivationalMessage()}
        </h1>

        <p className="welcome-subtitle">
          Welcome back, {user?.name || 'Reader'}! You're currently Level {stats?.level || 1}
          {checkInStreak > 0 && ` with a ${checkInStreak}-day check-in streak`}.
        </p>

        {/* Level Progress Arc */}
        <div className="level-progress-container">
          <FillingArc
            progress={levelProgress}
            level={stats?.level || 1}
            variant="detailed"
            size="large"
            showStats={true}
            stats={{
              totalPoints: stats?.totalPoints || 0,
              nextLevelPoints: (stats?.level || 1) * 100,
              currentLevelPoints: ((stats?.level || 1) - 1) * 100
            }}
          />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            onClick={() => navigate('/library')}
            className="action-button-primary"
          >
            📚 Continue Reading
          </button>
          
          <button
            onClick={() => navigate('/upload')}
            className="action-button-secondary"
          >
            ⬆️ Add Books
          </button>

          <button
            onClick={handleDailyCheckIn}
            disabled={hasCheckedInToday}
            className="checkin-button"
          >
            {hasCheckedInToday ? '✓ Checked In' : '✅ Daily Check-in'}
            {checkInStreak > 0 && (
              <span className="checkin-streak-badge">
                🔥 {checkInStreak}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// Quick Stats Overview Component with FillingArcs
const QuickStatsOverview = ({ checkInStreak = 0 }) => {
  const { stats } = useGamification();
  const { actualTheme } = useMaterial3Theme();
  const [loading, setLoading] = useState(!stats);

  // Use prop or fallback to localStorage
  const displayStreak = checkInStreak || parseInt(localStorage.getItem('checkInStreak') || '0');

  useEffect(() => {
    if (stats) setLoading(false);
  }, [stats]);

  // Calculate progress percentages for each metric
  const booksReadProgress = Math.min((stats?.booksRead || 0) * 10, 100); // 10 books = 100%
  const pagesReadProgress = Math.min((stats?.pagesRead || 0) / 10, 100); // 1000 pages = 100%
  const checkInStreakProgress = Math.min((displayStreak || 0) * 10, 100); // 10 days = 100%
  const readingStreakProgress = Math.min((stats?.readingStreak || 0) * 10, 100); // 10 days = 100%
  const pointsProgress = ((stats?.totalPoints || 0) % 100); // Progress to next level
  const notesProgress = Math.min((stats?.notesCreated || 0) * 5, 100); // 20 notes = 100%

  const arcVariants = ['simple', 'detailed', 'intricate', 'cosmic', 'simple', 'detailed'];

  const statItems = [
    {
      icon: '📚',
      value: stats?.booksRead || 0,
      label: 'Books Read',
      progress: booksReadProgress,
      variant: 'simple',
      level: Math.floor((stats?.booksRead || 0) / 10) + 1
    },
    {
      icon: '📖',
      value: stats?.pagesRead || 0,
      label: 'Pages Read',
      progress: pagesReadProgress,
      variant: 'detailed',
      level: Math.floor((stats?.pagesRead || 0) / 1000) + 1
    },
    {
      icon: '✅',
      value: displayStreak,
      label: 'Check-in Streak',
      progress: checkInStreakProgress,
      variant: 'intricate',
      level: Math.floor((displayStreak || 0) / 10) + 1
    },
    {
      icon: '🔥',
      value: stats?.readingStreak || 0,
      label: 'Reading Streak',
      progress: readingStreakProgress,
      variant: 'cosmic',
      level: Math.floor((stats?.readingStreak || 0) / 10) + 1
    },
    {
      icon: '⭐',
      value: stats?.totalPoints || 0,
      label: 'Total Points',
      progress: pointsProgress,
      variant: 'simple',
      level: stats?.level || 1
    },
    {
      icon: '📝',
      value: stats?.notesCreated || 0,
      label: 'Notes Created',
      progress: notesProgress,
      variant: 'detailed',
      level: Math.floor((stats?.notesCreated || 0) / 20) + 1
    }
  ];

 if (loading) {
  return (
    <div className="stats-arc-grid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="stat-arc-card">
          <div className="loading-shimmer" style={{ width: '150px', height: '150px', borderRadius: '50%' }}></div>
        </div>
      ))}
    </div>
  );
}

  return (
  <div className="stats-arc-grid">
    {statItems.map((stat, index) => (
      <div
        key={index}
        className={`stat-arc-card ${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <FillingArc
          progress={stat.progress}
          level={stat.level}
          variant={stat.variant}
          size="medium"
          showStats={false}
        />
        <div className="stat-arc-info">
          <div className="stat-arc-icon">{stat.icon}</div>
          <div className="stat-arc-value">{stat.value}</div>
          <div className="stat-arc-label">{stat.label}</div>
        </div>
      </div>
    ))}
  </div>
);
};

// Recent Achievements Component (kept but can be removed if needed)
const RecentAchievements = () => {
  const { achievements, unlockedAchievements } = useGamification();

  const recentAchievements = useMemo(() => {
    if (!achievements || achievements.length === 0 || !unlockedAchievements) return [];

    // Debug logging to understand the data structure
    console.log('🔍 Recent Achievements Debug:', {
      totalAchievements: achievements.length,
      unlockedAchievements: unlockedAchievements,
      firstAchievement: achievements[0],
      achievementSample: achievements.slice(0, 2)
    });

    // Filter for only unlocked achievements and sort by unlock date (most recent first)
    const unlockedAchievementsList = achievements
      .filter(achievement => {
        const isUnlocked = achievement.isUnlocked ||
          unlockedAchievements.has(achievement.id) ||
          (achievement.unlockedAt && new Date(achievement.unlockedAt) <= new Date());

        console.log(`Achievement ${achievement.id || achievement.title}: unlocked = ${isUnlocked}`);
        return isUnlocked;
      })
      .sort((a, b) => {
        // Sort by unlock date if available, otherwise by order in array
        if (a.unlockedAt && b.unlockedAt) {
          return new Date(b.unlockedAt) - new Date(a.unlockedAt);
        }
        return 0;
      });

    console.log('🏆 Unlocked achievements found:', unlockedAchievementsList);

    // Return the 3 most recent unlocked achievements
    return unlockedAchievementsList.slice(0, 3);
  }, [achievements, unlockedAchievements]);

  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div className="section-card">
      <h3 className="section-title">
        🏆 Recent Achievements
      </h3>
      <div className="achievements-grid">
        {recentAchievements.length > 0 ? (
          recentAchievements.map((achievement, index) => (
            <div
              key={achievement.id || index}
              className="achievement-tag"
              title={achievement.description || achievement.title}
            >
              <span>{achievement.icon || '🏅'}</span>
              <span>{achievement.title || achievement.name || 'Achievement'}</span>
            </div>
          ))
        ) : (
          <div className="achievement-placeholder">
            <span style={{ fontSize: '2rem', opacity: 0.5 }}>🎯</span>
            <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>
              Complete actions to unlock achievements!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Currently Reading Section Component
const CurrentlyReading = () => {
  const { activeSession } = useReadingSession(); // Listen to session changes
  const navigate = useNavigate();
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentlyReading = async () => {
      try {
        const token = localStorage.getItem('literati_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Use the API config for consistency
        const response = await API.get('/books');
        const data = response.data;

        // Handle both array and object responses
        const booksArray = Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);

        // Filter for currently reading books
        const readingBooks = booksArray.filter(book => book.is_reading);

        // Also check localStorage for active reading session to ensure sync
        const savedSession = localStorage.getItem('active_reading_session');
        if (savedSession) {
          try {
            const sessionData = JSON.parse(savedSession);
            const activeBookId = sessionData?.book?.id;

            // Ensure the active book is marked as reading if it exists
            if (activeBookId && !readingBooks.find(book => book.id === activeBookId)) {
              const activeBook = booksArray.find(book => book.id === activeBookId);
              if (activeBook) {
                readingBooks.push({ ...activeBook, is_reading: true });
              }
            }
          } catch (sessionError) {
            console.log('Session data parsing error:', sessionError);
          }
        }

        setCurrentlyReading(readingBooks);
      } catch (error) {
        console.error('Failed to fetch currently reading books:', error);
        setCurrentlyReading([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentlyReading();
  }, [activeSession]); // Refresh when active session changes

  // Also listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'active_reading_session') {
        // Re-fetch data when reading session changes in another tab
        const fetchCurrentlyReading = async () => {
          try {
            const token = localStorage.getItem('literati_token');
            if (!token) {
              setLoading(false);
              return;
            }

            const response = await API.get('/books');
            const data = response.data;
            const booksArray = Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);
            const readingBooks = booksArray.filter(book => book.is_reading);

            const savedSession = localStorage.getItem('active_reading_session');
            if (savedSession) {
              try {
                const sessionData = JSON.parse(savedSession);
                const activeBookId = sessionData?.book?.id;
                if (activeBookId && !readingBooks.find(book => book.id === activeBookId)) {
                  const activeBook = booksArray.find(book => book.id === activeBookId);
                  if (activeBook) {
                    readingBooks.push({ ...activeBook, is_reading: true });
                  }
                }
              } catch (sessionError) {
                console.log('Session data parsing error:', sessionError);
              }
            }

            setCurrentlyReading(readingBooks);
          } catch (error) {
            console.error('Failed to fetch currently reading books:', error);
            setCurrentlyReading([]);
          }
        };

        fetchCurrentlyReading();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  if (loading) return <div className="section-card"><h3>Loading currently reading...</h3></div>;

  // Debug: Always show the component with information
  console.log('📖 CurrentlyReading render - books count:', currentlyReading.length);
  
  return (
    <div className="section-card">
      <h3 className="section-title">
        📖 Currently Reading ({currentlyReading.length})
      </h3>
      <div className="books-grid">
        {currentlyReading.slice(0, 4).map((book) => (
          <div
            key={book.id}
            onClick={() => navigate(`/read/${book.id}`)}
            className="book-card"
          >
            <div className="book-title">
              {book.title}
            </div>
            <div className="book-author">
              by {book.author}
            </div>
            {book.progress !== undefined && (
              <div>
                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${book.progress || 0}%` }}
                    />
                  </div>
                </div>
                <div className="progress-text">
                  {book.progress || 0}% complete
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {currentlyReading.length > 4 && (
        <button
          onClick={() => navigate('/library')}
          className="view-all-button"
        >
          View all {currentlyReading.length} books →
        </button>
      )}
    </div>
  );
};

// Recently Added Books Component for Dashboard
const RecentlyAdded = () => {
  const navigate = useNavigate();
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentBooks = useCallback(async () => {
    try {
      const token = localStorage.getItem('literati_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Use the API config for consistency
      const response = await API.get('/books');
      const data = response.data;

      // Handle both array and object responses
      const booksArray = Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);

      // Get recently added books (filter by created_at or dateAdded)
      const recentlyAdded = booksArray
        .filter(book => book.created_at || book.dateAdded || book.upload_date)
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.dateAdded || a.upload_date || 0);
          const dateB = new Date(b.created_at || b.dateAdded || b.upload_date || 0);
          return dateB - dateA;
        })
        .slice(0, 3); // Show only 3 books for dashboard

      setRecentBooks(recentlyAdded);
    } catch (error) {
      console.error('Failed to fetch recent books:', error);
      setRecentBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentBooks();
  }, [fetchRecentBooks]);

  // Listen for storage events to sync when new books are added
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'books_updated' || e.key === 'book_uploaded') {
        // Re-fetch when books are updated
        fetchRecentBooks();
      }
    };

    // Listen for custom events from other parts of the app
    const handleBookUpdate = () => {
      fetchRecentBooks();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bookUploaded', handleBookUpdate);
    window.addEventListener('bookUpdated', handleBookUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookUploaded', handleBookUpdate);
      window.removeEventListener('bookUpdated', handleBookUpdate);
    };
  }, [fetchRecentBooks]);
  
  if (loading) return <div className="section-card-compact"><h3>Loading recent books...</h3></div>;

  // Debug: Always show the component with information
  console.log('📚 RecentlyAdded render - books count:', recentBooks.length);
  
  return (
    <div className="section-card-compact">
      <h3 className="section-title-compact">
        ✨ Recently Added ({recentBooks.length})
      </h3>
      <div className="books-grid-compact">
        {recentBooks.map((book) => (
          <div
            key={book.id}
            onClick={() => navigate('/library')}
            className="book-card-compact"
          >
            <div className="book-title-compact">
              {book.title}
            </div>
            <div className="book-author-compact">
              by {book.author}
            </div>
            <div className="book-date">
              📅 {new Date(book.created_at || book.dateAdded).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      
      {/* View All Link */}
      <div className="view-all-centered">
        <button
          onClick={() => navigate('/library')}
          className="view-all-link"
        >
          View all in Library →
        </button>
      </div>
    </div>
  );
};

// Main Dashboard Component
const DashboardPage = () => {
  console.log('🔄 DashboardPage: Rendering');
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { actualTheme } = useMaterial3Theme();
  const navigate = useNavigate();
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [books, setBooks] = useState([]);
  
  // Load check-in streak on mount
  useEffect(() => {
    console.log(' DashboardPage: useEffect for check-in streak');
    const streak = parseInt(localStorage.getItem('checkInStreak') || '0');
    setCheckInStreak(streak);
  }, []);

  // Load books data for statistics
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await API.get('/books');
        const data = response.data;
        const booksArray = Array.isArray(data.books) ? data.books : [];
        setBooks(booksArray);
      } catch (error) {
        console.error('Error loading books for dashboard:', error);
        setBooks([]); // Fallback to empty array
      }
    };

    loadBooks();
  }, []);

  return (
    <div className={`dashboard-container ${actualTheme === 'dark' ? 'dark' : ''}`}>
      <div className="dashboard-content">
        {/* Welcome Section with Theme Toggle */}
        <WelcomeSection user={user} onCheckInUpdate={setCheckInStreak} />

      {/* Your Progress Section */}
      <div className="progress-section">
        <h2 className="section-header">
          📊 Your Progress
        </h2>
        <QuickStatsOverview checkInStreak={checkInStreak} />
      </div>

      {/* Literary Mentor Section */}
      <div className="progress-section">
        <h2 className="section-header">
          🎓 Your Literary Mentor
        </h2>
        <LiteraryMentorUI 
          currentBook={null} // This can be connected to currently reading books
          onQuizStart={(quiz) => console.log('Starting quiz:', quiz)}
          onDiscussionStart={(discussion) => console.log('Starting discussion:', discussion)}
        />
      </div>

      {/* Currently Reading Section */}
      <CurrentlyReading />


      {/* Recently Added Section */}
      <RecentlyAdded />

      {/* Recent Achievements (Optional - can be removed) */}
      <RecentAchievements />

      {/* Call to Action */}
      <div className="cta-section">
        <h3 className="cta-title">
          🚀 Ready to Level Up?
        </h3>
        <p className="cta-subtitle">
          Continue your reading journey and unlock amazing achievements!
        </p>
        <div className="cta-buttons">
          <button
            onClick={() => navigate('/library')}
            className="cta-button-primary"
          >
            📚 Open Library
          </button>
          
          <button
            onClick={() => navigate('/upload')}
            className="cta-button-secondary"
          >
            ⬆️ Upload Books
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DashboardPage;
