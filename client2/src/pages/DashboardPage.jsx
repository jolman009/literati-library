// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sun, Moon, RefreshCw } from 'lucide-react';
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
import PointsHistory from '../components/gamification/PointsHistory';
import '../styles/dashboard-page.css';
import ThemeToggle from '../components/ThemeToggle';

// Welcome Component with reduced padding
const WelcomeSection = ({ user, onCheckInUpdate }) => {
  const { stats, achievements, syncWithServer, trackAction } = useGamification();
  const { actualTheme, toggleTheme } = useMaterial3Theme();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

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
      // Safety check: ensure showSnackbar exists
      if (!showSnackbar || typeof showSnackbar !== 'function') {
        console.error('Snackbar not available');
        alert('Check-in feature is temporarily unavailable');
        return;
      }

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

      // Sync with backend using the /actions endpoint
      if (API && API.post) {
        API.post('/api/gamification/actions', {
          action: 'daily_checkin',
          data: { streak: newStreak },
          timestamp: new Date().toISOString()
        }).then(() => {
          console.log('✅ Daily check-in synced with server');
        }).catch((error) => {
          console.log('ℹ️ Daily check-in saved locally, will sync when online');
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

  const handleSync = useCallback(async () => {
    // Safety check: ensure showSnackbar exists
    if (!showSnackbar || typeof showSnackbar !== 'function') {
      console.error('Snackbar not available');
      alert('Sync feature is temporarily unavailable');
      return;
    }

    if (!syncWithServer || typeof syncWithServer !== 'function') {
      console.warn('Sync function not available');
      showSnackbar({
        message: '⚠️ Sync feature is not available',
        variant: 'warning'
      });
      return;
    }

    setIsSyncing(true);

    try {
      const result = await syncWithServer();

      if (result?.success) {
        setLastSyncTime(new Date());
        showSnackbar({
          message: `✅ Synced! ${result.stats?.totalPoints || 0} points`,
          variant: 'success'
        });
      } else if (result?.error?.includes('offline') || result?.error?.includes('Not authenticated')) {
        setLastSyncTime(new Date());
        showSnackbar({
          message: '📡 Working offline - data saved locally',
          variant: 'info'
        });
      } else {
        setLastSyncTime(new Date());
        showSnackbar({
          message: '📡 Data saved locally',
          variant: 'info'
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      showSnackbar({
        message: '📡 Saved locally - will sync when server is ready',
        variant: 'info'
      });
    } finally {
      setIsSyncing(false);
    }
  }, [syncWithServer, showSnackbar]);

  return (
    <div className="welcome-section-compact">
      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleTheme}
        className="theme-toggle-button"
        aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {actualTheme === 'dark' ? (<Sun size={20} aria-hidden="true" />) : (<Moon size={20} aria-hidden="true" />)}
        <span className="sr-only">
          {actualTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </span>
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

          {/* Manual Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`sync-button ${isSyncing ? 'syncing' : ''} ${lastSyncTime ? 'synced' : ''}`}
            aria-label={isSyncing ? 'Syncing data with server' : 'Sync data with server'}
            aria-busy={isSyncing}
            title="Sync your data with the server to ensure consistency across devices"
          >
            <RefreshCw
              className={`sync-icon ${isSyncing ? 'spinning' : ''}`}
              size={16}
            />
            <span className="sync-button-text">
              {isSyncing ? 'Syncing...' : lastSyncTime ? 'Synced' : 'Sync Data'}
            </span>
            {lastSyncTime && !isSyncing && (
              <span className="sync-time-badge">
                {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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


// Quick Stats Overview Component - Top 6 Stats Cards with Swiper (includes Notes Points & Reading Sessions)
const QuickStatsOverview = ({ checkInStreak = 0 }) => {
  const { stats } = useGamification();
  const { actualTheme } = useMaterial3Theme();
  const [loading, setLoading] = useState(!stats);
  const [refreshing, setRefreshing] = useState(false);
  const [notesPoints, setNotesPoints] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [readingSessionsCount, setReadingSessionsCount] = useState(0);
  const [totalPointsFromServer, setTotalPointsFromServer] = useState(0);
  const [totalMinutesRead, setTotalMinutesRead] = useState(0);
  const { getReadingStats } = useReadingSession();
  const NOTES_POINTS_PER = 15;

  // 🔍 DEBUG: Log stats on every render
  console.log('🔍 QuickStatsOverview: Component rendering');
  console.log('🔍 QuickStatsOverview: stats =', stats);
  console.log('🔍 QuickStatsOverview: loading =', loading);
  console.log('🔍 QuickStatsOverview: notesPoints =', notesPoints);

  // Use prop or fallback to localStorage
  const displayStreak = checkInStreak || parseInt(localStorage.getItem('checkInStreak') || '0');

  // Fetch notes-specific points and reading sessions count from breakdown API
  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        console.log('📊 QuickStatsOverview: Fetching gamification breakdown data...');
        const response = await API.get('/api/gamification/actions/breakdown');
        const { categories, breakdown } = response.data;

        // Prefer server values but never below local fallbacks
        const serverNotesPoints = categories?.notes || 0;
        const localNotesCount = typeof stats?.notesCreated === 'number' ? stats.notesCreated : 0;
        const localNotesPoints = localNotesCount * NOTES_POINTS_PER;

        const noteActions = breakdown.find(b => b.action === 'note_created');
        const serverNotesCount = noteActions?.count || 0;

        const sessionActions = breakdown.find(b => b.action === 'reading_session_completed');
        const serverSessionCount = sessionActions?.count || 0;

        let localSessionCount = 0;
        try {
          const rs = typeof getReadingStats === 'function' ? getReadingStats() : null;
          localSessionCount = rs?.totalSessions || 0;
        } catch {}

        setNotesPoints(Math.max(serverNotesPoints, localNotesPoints));
        setNotesCount(Math.max(serverNotesCount, localNotesCount));
        setReadingSessionsCount(Math.max(serverSessionCount, localSessionCount));
        setTotalPointsFromServer(categories?.total || 0);

        console.log('✅ QuickStatsOverview: Data updated', {
          notesPoints: categories?.notes || 0,
          notesCount: noteActions?.count || 0,
          sessionCount: sessionActions?.count || 0,
          totalPoints: categories?.total || 0,
          rawCategories: categories,
          rawBreakdown: breakdown,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Failed to fetch gamification data:', error);
        setNotesPoints(0);
        setNotesCount(0);
        setReadingSessionsCount(0);
        setTotalPointsFromServer(0);
      }
    };

    if (stats) {
      // Add a small delay to ensure server has processed the action
      const timer = setTimeout(() => {
        fetchGamificationData();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [stats]);

  // 🔄 Auto-refresh data from server every 30 seconds (cross-device sync)
  useEffect(() => {
    const fetchLatestData = async () => {
      try {
        const response = await API.get('/api/gamification/actions/breakdown');
        const { categories, breakdown } = response.data;

        const serverNotesPoints = categories?.notes || 0;
        const noteActions = breakdown.find(b => b.action === 'note_created');
        const serverNotesCount = noteActions?.count || 0;
        const sessionActions = breakdown.find(b => b.action === 'reading_session_completed');
        const serverSessionCount = sessionActions?.count || 0;

        let localSessionCount = 0;
        try {
          const rs = typeof getReadingStats === 'function' ? getReadingStats() : null;
          localSessionCount = rs?.totalSessions || 0;
        } catch {}

        setNotesPoints(Math.max(serverNotesPoints, stats?.notesCreated * NOTES_POINTS_PER || 0));
        setNotesCount(Math.max(serverNotesCount, stats?.notesCreated || 0));
        setReadingSessionsCount(Math.max(serverSessionCount, localSessionCount));
        setTotalPointsFromServer(categories?.total || 0);

        console.log('🔄 QuickStatsOverview: Auto-poll refresh completed', {
          serverSessionCount,
          localSessionCount,
          finalSessionCount: Math.max(serverSessionCount, localSessionCount),
          totalPoints: categories?.total || 0,
          rawCategories: categories,
          rawBreakdown: breakdown
        });
      } catch (error) {
        console.error('❌ Auto-poll refresh failed:', error);
      }
    };

    // Poll every 30 seconds
    const pollInterval = setInterval(fetchLatestData, 30000);

    // Also fetch immediately on mount
    fetchLatestData();

    return () => clearInterval(pollInterval);
  }, [stats, getReadingStats]);

  // 🔔 Listen for gamification updates and refresh data automatically
  useEffect(() => {
    console.log('🔧 QuickStatsOverview: Setting up gamificationUpdate event listener');
    console.log('🔧 QuickStatsOverview: Component mounted and listening on window object');

    const handleGamificationUpdate = async (event) => {
      console.log('🔔 QuickStatsOverview: *** RECEIVED GAMIFICATION UPDATE EVENT ***', event.detail);

      // Wait a bit for server to process the action before fetching
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Re-fetch breakdown data when gamification updates occur
      try {
        setRefreshing(true);
        console.log('📊 QuickStatsOverview: Auto-refreshing after gamification update...');
        const response = await API.get('/api/gamification/actions/breakdown');
        const { categories, breakdown } = response.data;

        const serverNotesPoints2 = categories?.notes || 0;
        const localNotesCount2 = typeof stats?.notesCreated === 'number' ? stats.notesCreated : 0;
        const localNotesPoints2 = localNotesCount2 * NOTES_POINTS_PER;

        const noteActions2 = breakdown.find(b => b.action === 'note_created');
        const serverNotesCount2 = noteActions2?.count || 0;
        const sessionActions2 = breakdown.find(b => b.action === 'reading_session_completed');
        const serverSessionCount2 = sessionActions2?.count || 0;

        let localSessionCount2 = 0;
        try {
          const rs2 = typeof getReadingStats === 'function' ? getReadingStats() : null;
          localSessionCount2 = rs2?.totalSessions || 0;
        } catch {}

        setNotesPoints(Math.max(serverNotesPoints2, localNotesPoints2));
        setNotesCount(Math.max(serverNotesCount2, localNotesCount2));
        setReadingSessionsCount(Math.max(serverSessionCount2, localSessionCount2));

        console.log('✅ QuickStatsOverview: Auto-refresh completed', {
          action: event.detail.action,
          notesPoints: categories?.notes || 0,
          notesCount: noteActions2?.count || 0,
          sessionCount: sessionActions2?.count || 0
        });
      } catch (error) {
        console.error('❌ QuickStatsOverview: Auto-refresh failed:', error);
      } finally {
        setRefreshing(false);
      }
    };

    window.addEventListener('gamificationUpdate', handleGamificationUpdate);
    console.log('👂 QuickStatsOverview: Listening for gamificationUpdate events');

    return () => {
      window.removeEventListener('gamificationUpdate', handleGamificationUpdate);
      console.log('👋 QuickStatsOverview: Stopped listening for gamificationUpdate events');
    };
  }, []);

  useEffect(() => {
    if (stats) setLoading(false);
  }, [stats]);

  // Fallback: keep reading sessions count in sync with local history
  useEffect(() => {
    const updateFromLocal = () => {
      try {
        const rs = typeof getReadingStats === 'function' ? getReadingStats() : null;
        setReadingSessionsCount(rs?.totalSessions || 0);
        setTotalMinutesRead(rs?.totalMinutes || 0);
      } catch {}
    };

    // Initialize from local on mount
    updateFromLocal();

    // Update when reading session history changes (cross-tab via storage)
    const onStorage = (e) => {
      if (!e || e.key === 'readingSessionHistory') updateFromLocal();
    };

    // Also update when gamification events fire
    const onGamification = () => updateFromLocal();

    window.addEventListener('storage', onStorage);
    window.addEventListener('gamificationUpdate', onGamification);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gamificationUpdate', onGamification);
    };
  }, [getReadingStats]);

  // Fallback sync: ensure notes metrics reflect local stats when API breakdown is unavailable or delayed
  useEffect(() => {
    if (typeof stats?.notesCreated === 'number') {
      setNotesCount(stats.notesCreated);
      setNotesPoints(stats.notesCreated * NOTES_POINTS_PER);
    }
  }, [stats?.notesCreated]);

  // Calculate growth percentage (mock data for now)
  const calculateGrowth = (value) => {
    return value > 0 ? `+${Math.min(Math.floor(value / 10) * 4, 15)}%` : '+0%';
  };

  // Format minutes into readable time (e.g., "2h 30m" or "45m")
  const formatTimeRead = (minutes) => {
    if (minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // 🔍 DEBUG: Log what we're about to display
  console.log('📊 QuickStatsOverview: Preparing stat cards with:', {
    booksRead: stats?.booksRead,
    totalPoints: stats?.totalPoints,
    totalPointsFromServer,
    notesPoints,
    notesCount,
    readingSessionsCount,
    totalMinutesRead,
    displayStreak
  });

  const statCards = [
    {
      icon: '📚',
      value: stats?.booksRead || 0,
      label: 'Books in Library',
      subtitle: `${stats?.booksCompleted || 0} completed`,
      growth: calculateGrowth(stats?.booksRead || 0),
      trend: 'up'
    },
    {
      icon: '⭐',
      value: totalPointsFromServer || stats?.totalPoints || 0,
      label: 'Total Points',
      growth: calculateGrowth(totalPointsFromServer || stats?.totalPoints || 0),
      trend: 'up'
    },
    {
      icon: '📋',
      value: notesPoints,
      label: 'Notes Points',
      subtitle: `${notesCount} notes`,
      growth: notesCount > 0 ? `${notesCount} notes` : '+0',
      trend: notesCount > 0 ? 'up' : 'neutral'
    },
    {
      icon: '📚',
      value: readingSessionsCount,
      label: 'Reading Sessions',
      subtitle: 'completed',
      growth: readingSessionsCount > 0 ? `${readingSessionsCount} sessions` : '+0',
      trend: readingSessionsCount > 0 ? 'up' : 'neutral'
    },
    {
      icon: '⏱️',
      value: formatTimeRead(totalMinutesRead),
      label: 'Time Read',
      subtitle: totalMinutesRead > 0 ? `${totalMinutesRead} minutes` : '',
      growth: totalMinutesRead > 0 ? `${totalMinutesRead}m` : '+0',
      trend: totalMinutesRead > 0 ? 'up' : 'neutral'
    },
    {
      icon: '🔥',
      value: displayStreak,
      label: 'Daily Streak',
      growth: displayStreak > 0 ? `+${displayStreak}d` : '+0d',
      trend: displayStreak > 0 ? 'up' : 'neutral'
    }
  ];

  console.log('📊 QuickStatsOverview: Final stat cards:', statCards);

  if (loading) {
    return (
      <div className="simple-scroll-container">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="stat-metric-card">
            <div className="loading-shimmer" style={{ width: '100%', height: '100px', borderRadius: '12px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="simple-scroll-container" style={{ opacity: refreshing ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
      {statCards.map((stat, index) => (
        <div key={index} className="stat-metric-card" style={{ position: 'relative' }}>
          {refreshing && index === 0 && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '12px',
              opacity: 0.6
            }}>
              🔄
            </div>
          )}
          <div className="stat-metric-header">
            <span className="stat-metric-value">{stat.value}</span>
            <span className={`stat-metric-growth ${stat.trend}`}>
              {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
            </span>
          </div>
          <div className="stat-metric-footer">
            <span className="stat-metric-label">{stat.label}</span>
            {stat.subtitle && (
              <span className="stat-metric-subtitle">{stat.subtitle}</span>
            )}
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
    <div className="point-categories-wrapper">
      <div className="point-categories-section-header">
        <h2 className="point-categories-section-title">
          <span className="section-title-icon">🎮</span>
          Ways to Earn Points
        </h2>
        <p className="point-categories-section-subtitle">
          Complete these activities to level up and unlock achievements
        </p>
      </div>

      <div className="point-categories-grid">
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
      </div>
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
              COMPLETE ACTIONS TO UNLOCK ACHIEVEMENTS!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Currently Reading Section Componentss
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
        📖 Currently READING ({currentlyReading.length})
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
        {/* Metric Cards - Horizontal Scroll */}
        <QuickStatsOverview checkInStreak={checkInStreak} />
        {/* Main Content Grid - 2 Column Layout (Welcome + Reading Sessions) */}
        <div className="dashboard-main-content-grid">

          {/* Left Column - Welcome Section (replaces Transaction History) */}
          <div className="dashboard-content-left">
            <WelcomeSection user={user} onCheckInUpdate={setCheckInStreak} />
          </div>

          {/* Right Column - Currently Reading Sessions (replaces Open Projects) */}
          <div className="dashboard-content-right">
            <CurrentlyReading />

            {/* Points History - Show recent point-earning actions */}
            <div style={{ marginTop: '20px' }}>
              <PointsHistory limit={10} />
            </div>
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
