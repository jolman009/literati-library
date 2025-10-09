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
    <div className="welcome-section-compact">
      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {actualTheme === 'dark' ? (<Sun size={20} aria-hidden="true" />) : (<Moon size={20} aria-hidden="true" />)}
      </button>

      <div className="welcome-content-grid">
        {/* Left: Greeting & Level Arc */}
        <div className="welcome-info">
          <h1 className="welcome-title-compact">
            {getMotivationalMessage()}
          </h1>

          <p className="welcome-subtitle-compact">
            {user?.name || 'Reader'} • Level {stats?.level || 1}
            {checkInStreak > 0 && ` • ${checkInStreak}-day streak 🔥`}
          </p>

          {/* Daily Check-in Button - Prominent */}
          <button
            onClick={handleDailyCheckIn}
            disabled={hasCheckedInToday}
            className="checkin-button-compact"
          >
            {hasCheckedInToday ? '✓ Checked In Today' : '✅ Daily Check-in'}
            {!hasCheckedInToday && checkInStreak > 0 && (
              <span className="checkin-streak-badge-compact">
                🔥 {checkInStreak} days
              </span>
            )}
          </button>
        </div>

        {/* Right: Level Progress Arc - Smaller */}
        <div className="welcome-arc-container">
          <FillingArc
            progress={levelProgress}
            level={stats?.level || 1}
            variant="detailed"
            size="medium"
            showStats={true}
            stats={{
              totalPoints: stats?.totalPoints || 0,
              nextLevelPoints: (stats?.level || 1) * 100,
              currentLevelPoints: ((stats?.level || 1) - 1) * 100
            }}
          />
        </div>
      </div>
    </div>
  );
};


// Quick Stats Overview Component - Top 4 Stats Cards (like reference image)
const QuickStatsOverview = ({ checkInStreak = 0 }) => {
  const { stats } = useGamification();
  const { actualTheme } = useMaterial3Theme();
  const [loading, setLoading] = useState(!stats);

  // Use prop or fallback to localStorage
  const displayStreak = checkInStreak || parseInt(localStorage.getItem('checkInStreak') || '0');

  useEffect(() => {
    if (stats) setLoading(false);
  }, [stats]);

  // Calculate growth percentage (mock data for now)
  const calculateGrowth = (value) => {
    return value > 0 ? `+${Math.min(Math.floor(value / 10) * 4, 15)}%` : '+0%';
  };

  const statCards = [
    {
      icon: '📚',
      value: stats?.booksRead || 0,
      label: 'Total Books',
      growth: calculateGrowth(stats?.booksRead || 0),
      trend: 'up'
    },
    {
      icon: '⭐',
      value: stats?.totalPoints || 0,
      label: 'Total Points',
      growth: calculateGrowth(stats?.totalPoints || 0),
      trend: 'up'
    },
    {
      icon: '📖',
      value: stats?.pagesRead || 0,
      label: 'Pages Read',
      growth: calculateGrowth(stats?.pagesRead || 0),
      trend: 'up'
    },
    {
      icon: '🔥',
      value: displayStreak,
      label: 'Daily Streak',
      growth: displayStreak > 0 ? `+${displayStreak}d` : '+0d',
      trend: displayStreak > 0 ? 'up' : 'neutral'
    }
  ];

  if (loading) {
    return (
      <div className="stats-cards-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-metric-card">
            <div className="loading-shimmer" style={{ width: '100%', height: '100px', borderRadius: '12px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-cards-grid">
      {statCards.map((stat, index) => (
        <div key={index} className="stat-metric-card">
          <div className="stat-metric-header">
            <span className="stat-metric-value">${stat.value}</span>
            <span className={`stat-metric-growth ${stat.trend}`}>
              {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
            </span>
          </div>
          <div className="stat-metric-footer">
            <span className="stat-metric-label">{stat.label}</span>
            <span className={`stat-metric-percentage ${stat.trend}`}>{stat.growth}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Point Categories Component - Shows how to earn points
const PointCategoriesSection = () => {
  const navigate = useNavigate();

  const pointCategories = [
    {
      title: 'Reading Activities',
      icon: '📖',
      color: '#6366f1',
      actions: [
        { action: 'Start Reading Session', points: 5, icon: '🚀' },
        { action: 'Complete Reading Session', points: 10, icon: '✅' },
        { action: 'Read Page', points: 1, icon: '📄' },
        { action: 'Reading Time', points: '1/min', icon: '⏱️' },
        { action: 'Complete Book', points: 100, icon: '🎉' },
      ]
    },
    {
      title: 'Library Management',
      icon: '📚',
      color: '#8b5cf6',
      actions: [
        { action: 'Upload Book', points: 25, icon: '📤' },
        { action: 'Daily Login', points: 10, icon: '🌅' },
        { action: 'Daily Check-in', points: 10, icon: '✔️' },
      ]
    },
    {
      title: 'Note-Taking & Study',
      icon: '📝',
      color: '#ec4899',
      actions: [
        { action: 'Create Note', points: 15, icon: '📋' },
        { action: 'Create Highlight', points: 10, icon: '✏️' },
      ]
    }
  ];

  return (
    <>
      {pointCategories.map((category, index) => (
        <div key={index} className="point-category-card">
          <div className="point-category-header">
            <h3 className="point-category-title">
              <span className="point-category-icon">{category.icon}</span>
              {category.title}
            </h3>
          </div>
          <div className="point-category-actions">
            {category.actions.map((action, actionIndex) => (
              <div key={actionIndex} className="point-action-item">
                <div className="point-action-info">
                  <span className="point-action-icon">{action.icon}</span>
                  <span className="point-action-name">{action.action}</span>
                </div>
                <div className="point-action-badge" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                  +{action.points}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/gamification-rules')}
            className="point-category-footer-link"
          >
            View all rewards →
          </button>
        </div>
      ))}
    </>
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

        {/* Top Stats Row - 4 metric cards like the reference */}
        <div className="dashboard-stats-row">
          <QuickStatsOverview checkInStreak={checkInStreak} />
        </div>

        {/* Main Content Grid - 2 Column Layout (Welcome + Reading Sessions) */}
        <div className="dashboard-main-content-grid">

          {/* Left Column - Welcome Section (replaces Transaction History) */}
          <div className="dashboard-content-left">
            <WelcomeSection user={user} onCheckInUpdate={setCheckInStreak} />
          </div>

          {/* Right Column - Currently Reading Sessions (replaces Open Projects) */}
          <div className="dashboard-content-right">
            <CurrentlyReading />
          </div>

        </div>

        {/* Bottom Row - Point Categories (How to Earn Points) */}
        <div className="dashboard-bottom-row">
          <PointCategoriesSection />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
