// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useSnackbar } from '../components/Material3';
import { getBookStatus } from '../components/BookStatus';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import PointsHistory from '../components/gamification/PointsHistory';
import MentorPreviewCard from '../components/MentorPreviewCard';
import API from '../config/api';
import '../styles/dashboard-page.css';
import ThemeToggle from '../components/ThemeToggle';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
// Removed legacy onboarding overlay

// Welcome Component with reduced padding
const WelcomeSection = ({ user, onStartTour, activeSession }) => {
  const { stats, achievements } = useGamification();
  const navigate = useNavigate();

  // Calculate level progress percentage
  const levelProgress = useMemo(() => {
    if (!stats) return 0;
    const currentLevelMin = (stats.level - 1) * 100;
    const currentLevelMax = stats.level * 100;
    const progress = ((stats.totalPoints - currentLevelMin) / (currentLevelMax - currentLevelMin)) * 100;
    return Math.min(Math.max(progress, 0), 100); // Clamp between 0-100
  }, [stats]);

  // Activity streak from server (automatically tracked)
  const activityStreak = stats?.readingStreak || 0;

  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    if (activityStreak >= 7) return `${timeGreeting}! 🔥 You're on fire with a ${activityStreak}-day activity streak!`;
    if (stats?.booksRead >= 10) return `${timeGreeting}! 📚 Amazing - you've read ${stats.booksRead} books!`;
    if (achievements?.length >= 5) return `${timeGreeting}! 🏆 You're crushing it with ${achievements.length} achievements!`;
    return `${timeGreeting}! Ready to dive into your next great read?`;
  };

  const primaryCtaLabel = activeSession?.book ? 'Resume reading' : 'Start reading';
  const handlePrimaryCta = () => {
    if (activeSession?.book?.id) {
      navigate(`/read/${activeSession.book.id}`);
      return;
    }
    navigate('/library');
  };

  return (
    <div className="welcome-section-compact">
      <div className="welcome-content">
        {/* Greeting & Actions */}
        <div className="welcome-info">
          <h1 className="welcome-title-compact">
            {getMotivationalMessage()}
          </h1>

          <p className="welcome-purpose">Track reading, earn rewards, and grow your library.</p>

          {/* Subtitle - Activity streak auto-tracked from user activities */}
          <div className="welcome-subtitle-row">
            <p className="welcome-subtitle-compact">
              {user?.name || 'Reader'} • Level {stats?.level || 1}
              {activityStreak > 0 && ` • ${activityStreak}-day streak 🔥`}
            </p>
          </div>

          <div className="welcome-cta-row">
            <button className="md3-filled-button" onClick={handlePrimaryCta}>
              <span className="material-symbols-outlined" aria-hidden>auto_stories</span>
              {primaryCtaLabel}
            </button>
            <button className="md3-tonal-button" onClick={() => navigate('/upload')}>
              <span className="material-symbols-outlined" aria-hidden>add</span>
              Add a book
            </button>
          </div>

          {/* Level Progress Bar with Total Points */}
          <div className="progress-block-elevated">
            <div className="level-progress-container">
              <div className="level-progress-header">
                <span className="level-progress-text">
                  {Math.floor(levelProgress)}% to Level {(stats?.level || 1) + 1}
                </span>
                <span className="total-points-display" title="Total Points Earned">
                  ⭐ {stats?.totalPoints?.toLocaleString() || 0} pts
                </span>
              </div>
              <div className="level-progress-bar">
                <div
                  className="level-progress-fill"
                  style={{ width: `${levelProgress}%` }}
                  aria-label={`${Math.floor(levelProgress)}% progress to Level ${(stats?.level || 1) + 1}`}
                />
              </div>
              {achievements?.length > 0 && (
                <div className="badge-strip" aria-label="Recent achievements">
                  {achievements.slice(0, 8).map((achievement, index) => (
                    <div className="badge-chip" key={achievement.id || index} title={achievement.description || achievement.title}>
                      <span className="material-symbols-outlined" aria-hidden>workspace_premium</span>
                      <span className="badge-chip-label">{achievement.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Preview Card - Bottom of Welcome Section */}
      <MentorPreviewCard />
    </div>
  );
};

const GoalSelector = () => {
  const { goalPreference, setGoalPreference } = useGamification();
  const [preference, setPreference] = useState(goalPreference || 'minutes');

  useEffect(() => {
    setPreference(goalPreference || 'minutes');
  }, [goalPreference]);

  const handleChange = (value) => {
    setPreference(value);
    setGoalPreference?.(value);
  };

  return (
    <div className="goal-selector" aria-label="Choose your goal type">
      <div className="goal-selector-header">
        <div>
          <p className="goal-selector-label">Goal focus</p>
          <p className="goal-selector-subtext">Choose how you want to measure progress</p>
        </div>
      </div>
      <div className="goal-toggle-group" role="group" aria-label="Goal preference">
        <button
          className={`md3-segmented ${preference === 'minutes' ? 'active' : ''}`}
          onClick={() => handleChange('minutes')}
        >
          Minutes per week
        </button>
        <button
          className={`md3-segmented ${preference === 'books' ? 'active' : ''}`}
          onClick={() => handleChange('books')}
        >
          Books per month
        </button>
      </div>
    </div>
  );
};

const SmartResumeCard = ({ books }) => {
  const navigate = useNavigate();
  const { activeSession, getSessionHistory } = useReadingSession();
  const [recentSession, setRecentSession] = useState(null);

  useEffect(() => {
    const history = typeof getSessionHistory === 'function' ? getSessionHistory() : [];
    if (history?.length > 0) {
      setRecentSession(history[history.length - 1]);
    }
  }, [getSessionHistory]);

  const session = activeSession || recentSession;
  if (!session || !session.book) return null;

  const book = session.book.id ? books?.find(b => b.id === session.book.id) || session.book : session.book;
  const totalPages = book?.total_pages || book?.totalPages || book?.page_count;
  const currentPage = book?.current_page || session.book.current_page || session.book.page || 1;
  const pagesLeft = totalPages ? Math.max(totalPages - currentPage, 0) : null;
  const estimatedMinutes = pagesLeft ? Math.max(Math.round(pagesLeft * 1), 5) : 10;

  return (
    <div className="smart-resume-card">
      <div className="smart-resume-meta">
        <p className="smart-resume-label">Continue reading</p>
        <h3 className="smart-resume-title">{book.title}</h3>
        {book.author && <p className="smart-resume-author">by {book.author}</p>}
        <p className="smart-resume-progress">
          Page {currentPage}
          {totalPages ? ` of ${totalPages}` : ''}
          {pagesLeft !== null && ` • ~${estimatedMinutes} min to finish`}
        </p>
      </div>
      <div className="smart-resume-actions">
        <button className="md3-filled-button" onClick={() => navigate(`/read/${book.id}`)}>
          <span className="material-symbols-outlined" aria-hidden>play_arrow</span>
          Resume
        </button>
        <button className="md3-tonal-button" onClick={() => navigate('/notes')}>
          <span className="material-symbols-outlined" aria-hidden>post_add</span>
          Add note
        </button>
      </div>
    </div>
  );
};


// Quick Stats Overview Component - Top 6 Stats Cards with Swiper (includes Notes Points & Reading Sessions)
const QuickStatsOverview = ({ totalBooks = null, completedBooks = null, inProgressBooks = null, className = '' }) => {
  const { stats } = useGamification();
  const { actualTheme } = useMaterial3Theme();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(!stats);
  const [refreshing, setRefreshing] = useState(false);
  const [notesPoints, setNotesPoints] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [readingSessionsCount, setReadingSessionsCount] = useState(0);
  // 🔧 FIX: Initialize with GamificationContext stats if available
  const [totalPointsFromServer, setTotalPointsFromServer] = useState(stats?.totalPoints || 0);
  const [totalMinutesRead, setTotalMinutesRead] = useState(0);
  const { getReadingStats, activeSession, sessionStats } = useReadingSession();
  const { showSnackbar } = useSnackbar();
  const [serverWins, setServerWins] = useState(false);
  const NOTES_POINTS_PER = 15;

  // 🔍 DEBUG: Log stats on every render
  console.warn('🔍 QuickStatsOverview: Component rendering');
  console.warn('🔍 QuickStatsOverview: stats =', stats);
  console.warn('🔍 QuickStatsOverview: loading =', loading);
  console.warn('🔍 QuickStatsOverview: notesPoints =', notesPoints);

  // ✅ Activity-based streak from server stats (automatically tracked from user activities)
  const displayStreak = stats?.readingStreak || 0;

  // Fetch notes-specific points, reading sessions count, total points and time read from APIs
  const fetchGamificationData = useCallback(async () => {
    try {
      console.warn('📊 QuickStatsOverview: Fetching gamification breakdown data...');
      const [breakdownResp, statsResp] = await Promise.all([
        API.get('/api/gamification/actions/breakdown'),
        API.get('/api/gamification/stats').catch((e) => {
          console.warn('⚠️ Stats endpoint unavailable, will use local fallbacks for time/points', e?.message || e);
          return null;
        })
      ]);
      const { categories, breakdown } = breakdownResp.data;

      // Prefer server values but never below local fallbacks
      const serverNotesPoints = categories?.notes || 0;
      const localNotesCount = typeof stats?.notesCreated === 'number' ? stats.notesCreated : 0;
      const localNotesPoints = localNotesCount * NOTES_POINTS_PER;

      const noteActions = breakdown.find(b => b.action === 'note_created');
      const serverNotesCount = noteActions?.count || 0;

      // ✅ FIX: Get session count from stats API instead of broken breakdown
      const statsData = statsResp?.data || null;
      const serverSessionCount = statsData?.sessionsCompleted || 0;

      let localSessionCount = 0;
      try {
        const rs = typeof getReadingStats === 'function' ? getReadingStats() : null;
        localSessionCount = rs?.totalSessions || 0;
      } catch {}

      // 🔧 FIX: Defensive updates - never regress to lower values
      setNotesPoints(prev => Math.max(prev, serverNotesPoints, localNotesPoints));
      setNotesCount(prev => Math.max(prev, serverNotesCount, localNotesCount));
      setReadingSessionsCount(prev => Math.max(prev, serverSessionCount, localSessionCount));

      // Prefer server totals from /stats when available, fallback to breakdown categories total
      const serverTotals = statsData?.totalPoints ?? categories?.total ?? 0;
      // 🔧 FIX: Never regress to 0
      setTotalPointsFromServer(prev => Math.max(prev, serverTotals));
      // Notify if server totals are being used over local to reassure cross-device sync
      const localTotals = stats?.totalPoints || 0;
      const serverBeatsLocal = serverTotals > localTotals;
      setServerWins(Boolean(serverBeatsLocal));
      if (serverBeatsLocal) {
        try {
          const key = 'serverTotalsToastShownAt';
          const lastShown = parseInt(localStorage.getItem(key) || '0', 10);
          const now = Date.now();
          if (!lastShown || now - lastShown > 10 * 60 * 1000) { // 10 minutes debounce
            showSnackbar({
              message: `⭐ Synced totals from server: ${serverTotals} points`,
              variant: 'info'
            });
            localStorage.setItem(key, String(now));
          }
        } catch {}
      }
      // 🔧 FIX: Time read pulled from stats - defensive update
      if (typeof statsData?.totalReadingTime === 'number' && statsData.totalReadingTime > 0) {
        setTotalMinutesRead(prev => Math.max(prev, statsData.totalReadingTime));
      }

      // Notes count/points from stats when available (covers cases where user_actions lacks entries)
      if (typeof statsData?.notesCreated === 'number') {
        setNotesCount(prev => Math.max(prev, serverNotesCount, statsData.notesCreated));
        setNotesPoints(prev => Math.max(prev, serverNotesPoints, statsData.notesCreated * NOTES_POINTS_PER));
      }

      console.warn('✅ QuickStatsOverview: Data updated', {
        notesPoints: categories?.notes || 0,
        notesCount: noteActions?.count || 0,
        totalPoints: categories?.total || 0,
        rawCategories: categories,
        rawBreakdown: breakdown,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to fetch gamification data, using local fallbacks:', error);
      
      // 🔧 FIX: Use local fallbacks instead of setting to 0
      const localNotesCount = typeof stats?.notesCreated === 'number' ? stats.notesCreated : 0;
      const localNotesPoints = localNotesCount * NOTES_POINTS_PER;
      
      let localSessionCount = 0;
      try {
        const rs = typeof getReadingStats === 'function' ? getReadingStats() : null;
        localSessionCount = rs?.totalSessions || 0;
      } catch {}
      
      // Also try to get reading sessions from localStorage directly
      try {
        const sessionHistory = JSON.parse(localStorage.getItem('readingSessionHistory') || '[]');
        if (Array.isArray(sessionHistory) && sessionHistory.length > 0) {
          localSessionCount = Math.max(localSessionCount, sessionHistory.length);
        }
      } catch (localError) {
        console.warn('Could not read from localStorage:', localError);
      }
      
      // 🔧 FIX: Even in error fallback, use defensive updates
      setNotesPoints(prev => Math.max(prev, localNotesPoints));
      setNotesCount(prev => Math.max(prev, localNotesCount));
      setReadingSessionsCount(prev => Math.max(prev, localSessionCount));
      setTotalPointsFromServer(prev => Math.max(prev, stats?.totalPoints || 0));

      console.warn('📊 QuickStatsOverview: Using local fallback data', {
        notesPoints: localNotesPoints,
        notesCount: localNotesCount,
        sessionCount: localSessionCount,
        totalPoints: stats?.totalPoints || 0
      });
    }
  }, [stats, getReadingStats]);

  // 🔄 Consolidated effect for auto-refresh and event handling
  useEffect(() => {
    let pollInterval = null;
    let isMounted = true;
    let lastFetchTime = 0;

    const fetchLatestData = async (source = 'auto-poll') => {
      // Debounce: Prevent fetching more than once every 3 seconds
      const now = Date.now();
      if (now - lastFetchTime < 3000) {
        console.warn(`⏱️ Skipping fetch - last fetch was ${now - lastFetchTime}ms ago`);
        return;
      }
      lastFetchTime = now;

      try {
        console.warn(`🔄 QuickStatsOverview: Fetching data (${source})...`);
        const [breakdownResp, statsResp] = await Promise.all([
          API.get('/api/gamification/actions/breakdown'),
          API.get('/api/gamification/stats').catch(() => null)
        ]);
        if (!isMounted) return; // Component unmounted, don't update state

        const { categories, breakdown } = breakdownResp.data;

        const serverNotesPoints = categories?.notes || 0;
        const noteActions = breakdown.find(b => b.action === 'note_created');
        const serverNotesCount = noteActions?.count || 0;
        // ✅ FIX: Get session count from stats API instead of broken breakdown
        const serverSessionCount = statsResp?.data?.sessionsCompleted || 0;

        let localSessionCount = 0;
        try {
          const rs = typeof getReadingStats === 'function' ? getReadingStats() : null;
          localSessionCount = rs?.totalSessions || 0;
        } catch {}

        setNotesPoints(prev => Math.max(prev, serverNotesPoints, stats?.notesCreated * NOTES_POINTS_PER || 0));
        setNotesCount(prev => Math.max(prev, serverNotesCount, stats?.notesCreated || 0));
        setReadingSessionsCount(prev => Math.max(prev, serverSessionCount, localSessionCount));

        const pointsFromStats = statsResp?.data?.totalPoints;
        const newTotalPoints = typeof pointsFromStats === 'number' ? pointsFromStats : (categories?.total || 0);
        // 🔧 FIX: Defensive update - never regress to 0
        setTotalPointsFromServer(prev => Math.max(prev, newTotalPoints));

        // 🔧 FIX: Defensive update for reading time - never regress to 0
        if (typeof statsResp?.data?.totalReadingTime === 'number' && statsResp.data.totalReadingTime > 0) {
          setTotalMinutesRead(prev => Math.max(prev, statsResp.data.totalReadingTime));
        }
        if (typeof statsResp?.data?.notesCreated === 'number') {
          setNotesCount(prev => Math.max(prev, statsResp.data.notesCreated));
          setNotesPoints(prev => Math.max(prev, (statsResp.data.notesCreated * NOTES_POINTS_PER)));
        }

        console.warn(`✅ QuickStatsOverview: ${source} refresh completed`, {
          serverSessionCount,
          localSessionCount,
          finalSessionCount: Math.max(serverSessionCount, localSessionCount),
          totalPoints: categories?.total || 0
        });
      } catch (error) {
        console.error(`❌ ${source} refresh failed:`, error);
      }
    };

    // Event handler for reading session completion
    const handleReadingSessionCompleted = () => {
      console.warn('📊 Reading session completed, refreshing stats...');
      setTimeout(() => fetchLatestData('session-completed'), 1000);
    };

    // Event handler for gamification updates
    const handleGamificationUpdate = (event) => {
      console.warn('🔔 QuickStatsOverview: *** RECEIVED GAMIFICATION UPDATE EVENT ***', event.detail);
      setTimeout(() => fetchLatestData('gamification-update'), 1000);
    };

    // Register event listeners
    window.addEventListener('readingSessionCompleted', handleReadingSessionCompleted);
    window.addEventListener('gamificationUpdate', handleGamificationUpdate);

    // Initial fetch on mount
    fetchLatestData('mount');

    // Poll every 60 seconds (reduced from 30 to prevent rate limiting)
    pollInterval = setInterval(() => fetchLatestData('auto-poll'), 60000);

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('readingSessionCompleted', handleReadingSessionCompleted);
      window.removeEventListener('gamificationUpdate', handleGamificationUpdate);
    };
  }, []); // Empty dependency array - only run once on mount

  // ✅ REMOVED DUPLICATE: The event listener is now handled in the consolidated useEffect above

  useEffect(() => {
    if (stats) setLoading(false);
  }, [stats]);

  // 🔧 FIX: Defensive fallback for reading sessions - NEVER regress to 0
  useEffect(() => {
    const updateFromLocal = () => {
      try {
        const rs = typeof getReadingStats === 'function' ? getReadingStats() : null;

        // Defensive update: Only increase, never decrease
        if (rs?.totalSessions) {
          setReadingSessionsCount(prev => Math.max(prev, rs.totalSessions));
        }

        // Calculate total minutes defensively
        const activeExtra = activeSession && sessionStats?.readingTime
          ? Math.floor((sessionStats.readingTime || 0) / 60)
          : 0;

        const calculatedMinutes = (rs?.totalMinutes || 0) + activeExtra;

        // 🔧 CRITICAL FIX: Never regress from valid data to 0 or lower values
        setTotalMinutesRead(prev => {
          // If we have a valid calculated value, use the max
          if (calculatedMinutes > 0) {
            return Math.max(prev, calculatedMinutes);
          }
          // If calculated is 0, keep the previous value (don't regress)
          return prev;
        });

        console.warn('📊 [DASHBOARD] Local update:', {
          sessions: rs?.totalSessions,
          minutes: calculatedMinutes,
          activeExtra
        });
      } catch (error) {
        console.error('❌ [DASHBOARD] Error updating from local:', error);
      }
    };

    // Initialize from local on mount
    updateFromLocal();

    // Update when reading session history changes (cross-tab via storage)
    const onStorage = (e) => {
      if (!e || e.key === 'readingSessionHistory') {
        console.warn('💾 [DASHBOARD] Storage event detected, updating from local');
        updateFromLocal();
      }
    };

    // Also update when gamification events fire
    const onGamification = () => {
      console.warn('🎮 [DASHBOARD] Gamification event detected, updating from local');
      updateFromLocal();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('gamificationUpdate', onGamification);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('gamificationUpdate', onGamification);
    };
  }, [getReadingStats, activeSession, sessionStats?.readingTime]);

  // Fallback sync: ensure stats reflect GamificationContext when API is unavailable or delayed
  useEffect(() => {
    if (typeof stats?.notesCreated === 'number') {
      setNotesCount(prev => Math.max(prev, stats.notesCreated));
      setNotesPoints(prev => Math.max(prev, stats.notesCreated * NOTES_POINTS_PER));
    }

    // 🔧 FIX: Also sync total points from GamificationContext
    if (typeof stats?.totalPoints === 'number') {
      setTotalPointsFromServer(prev => Math.max(prev, stats.totalPoints));
      console.warn('📊 [DASHBOARD] Syncing total points from GamificationContext:', stats.totalPoints);
    }
  }, [stats?.notesCreated, stats?.totalPoints]);

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
  console.warn('📊 [DASHBOARD] Preparing stat cards with:', {
    booksRead: stats?.booksRead,
    totalPoints: stats?.totalPoints,
    totalPointsFromServer,
    notesPoints,
    notesCount,
    readingSessionsCount,
    totalMinutesRead,
    displayStreak,
    timestamp: new Date().toISOString()
  });

  // Prefer explicit props from Dashboard (books API), fallback to gamification stats
  const booksCount = (typeof totalBooks === 'number') ? totalBooks : (stats?.booksRead || 0);
  const booksCompleted = (typeof completedBooks === 'number') ? completedBooks : (stats?.booksCompleted || 0);
  const booksInProgress = (typeof inProgressBooks === 'number') ? inProgressBooks : 0;

  // 🎯 Total Points now displayed prominently in Welcome section (next to progress bar)
  const statCards = [
    {
      icon: '📚',
      value: booksCount,
      label: 'Books in Library',
      subtitle: `${booksCompleted} completed • ${booksInProgress} in progress`,
      growth: calculateGrowth(booksCount),
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
      label: 'Activity Streak',
      subtitle: 'consecutive days',
      growth: displayStreak > 0 ? `${displayStreak} days` : '0 days',
      trend: displayStreak > 0 ? 'up' : 'neutral'
    }
  ];

  console.warn('📊 [DASHBOARD] Final stat cards to render:', {
    timeRead: statCards[3]?.value,  // Index changed after removing Total Points
    notesPoints: statCards[1]?.value,
    sessions: statCards[2]?.value,
    dailyStreak: statCards[4]?.value,
    timestamp: new Date().toISOString()
  });

  if (loading) {
    return (
      <div className={`simple-scroll-container ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="stat-metric-card">
            <div className="loading-shimmer" style={{ width: '100%', height: '100px', borderRadius: '12px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`simple-scroll-container ${className}`} style={{ opacity: refreshing ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
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
          {/* Small badge when using server totals to reassure cross-device sync */}
          {stat.label === 'Total Points' && serverWins && (
            <div className="server-sync-badge" title="Using synced totals from server">
              <span className="server-sync-badge-icon">☁</span>
              <span>synced</span>
            </div>
          )}
          <div className="stat-metric-header">
            <span className="stat-metric-value">{stat.value}</span>
            <span className={`stat-metric-growth ${stat.trend}`}>
              {stat.trend === 'up' ? '↗' : stat.trend === 'down' ? '↘' : '→'}
            </span>
          </div>
          {/* Subtitle on its own line to avoid stretching width */}
          {stat.subtitle && (
            <div className="stat-metric-subtitle">{stat.subtitle}</div>
          )}
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
      color: '#24A8E0',
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
      color: '#24A8E0',
      actions: [
        { action: 'Upload Book', points: 25, icon: '📤' },
        { action: 'Daily Login', points: 10, icon: '🌅' },
        { action: 'Chat with AI Mentor', points: 5, icon: '🎓' },
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
    },
    {
      title: 'Activity Streak',
      icon: '🔥',
      color: '#f97316',
      isStreakCategory: true,
      description: 'Keep your streak alive! Any of these activities count toward your daily streak:',
      streakActions: [
        { action: 'Open/start reading a book', icon: '📖' },
        { action: 'Upload a new book', icon: '📤' },
        { action: 'Create a note', icon: '📝' },
        { action: 'Create a highlight', icon: '✏️' },
        { action: 'Chat with the AI mentor', icon: '🎓' },
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
          <div key={index} className={`point-category-card ${category.isStreakCategory ? 'streak-category' : ''}`}>
            <div className="point-category-header">
              <h3 className="point-category-title">
                <span className="point-category-icon">{category.icon}</span>
                {category.title}
              </h3>
            </div>

            {/* Regular point-earning categories */}
            {!category.isStreakCategory && (
              <>
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
              </>
            )}

            {/* Special Activity Streak category */}
            {category.isStreakCategory && (
              <>
                <p className="streak-category-description" style={{
                  fontSize: '13px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {category.description}
                </p>
                <div className="point-category-actions streak-actions">
                  {category.streakActions.map((action, actionIndex) => (
                    <div key={actionIndex} className="point-action-item streak-action-item">
                      <div className="point-action-info">
                        <span className="point-action-icon">{action.icon}</span>
                        <span className="point-action-name">{action.action}</span>
                      </div>
                      <div className="streak-check" style={{
                        color: category.color,
                        fontSize: '16px'
                      }}>
                        ✓
                      </div>
                    </div>
                  ))}
                </div>
                <div className="streak-tip" style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  backgroundColor: `${category.color}10`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: category.color,
                  fontWeight: 500
                }}>
                  💡 Do any one activity per day to maintain your streak!
                </div>
              </>
            )}
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
    console.warn('🔍 Recent Achievements Debug:', {
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

        console.warn(`Achievement ${achievement.id || achievement.title}: unlocked = ${isUnlocked}`);
        return isUnlocked;
      })
      .sort((a, b) => {
        // Sort by unlock date if available, otherwise by order in array
        if (a.unlockedAt && b.unlockedAt) {
          return new Date(b.unlockedAt) - new Date(a.unlockedAt);
        }
        return 0;
      });

    console.warn('🏆 Unlocked achievements found:', unlockedAchievementsList);

    // Return the 3 most recent unlocked achievements
    return unlockedAchievementsList.slice(0, 3);
  }, [achievements, unlockedAchievements]);

  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div id="dashboard-currently-reading" className="section-card" style={{ margin: "6px 0", padding: "10px 12px" }}>
      <h3 className="section-title" style={{ margin: "4px 0 8px" }}>
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
  const { activeSession, startReadingSession, stopReadingSession, isPaused } = useReadingSession(); // Listen to session changes + controls
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!activeSession) { setElapsedSec(0); return; }
    const compute = () => {
      const start = new Date(activeSession.startTime);
      const now = new Date();
      const current = Math.floor((now - start) / 1000);
      const total = (activeSession.accumulatedTime || 0) + (activeSession.isPaused ? 0 : current);
      setElapsedSec(Math.max(0, total));
    };
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [activeSession]);
  const navigate = useNavigate();
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentlyReading = async () => {
      try {
        // Use the API config for consistency (auth via cookies supported)
        const response = await API.get('/books', { params: { limit: 200, offset: 0 } });
        const { items = [] } = response.data || {};
        const booksArray = items;

        // Match Library Reading subpage logic for accuracy:
        // show items flagged by backend as reading
        const readingBooks = booksArray.filter(book => (
          book?.is_reading === true || book?.isReading === true || (book?.status || '').toLowerCase() === 'reading'
        ));

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
            console.warn('Session data parsing error:', sessionError);
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
      if (!e || e.key === 'active_reading_session' || e.key === 'books_updated') {
        // Re-fetch data when reading session or books update in another tab
        const fetchCurrentlyReading = async () => {
          try {
            const response = await API.get('/books', { params: { limit: 200, offset: 0 } });
            const { items = [] } = response.data || {};
            const booksArray = items;
            const readingBooks = booksArray.filter(book => (
              book?.is_reading === true || book?.isReading === true || (book?.status || '').toLowerCase() === 'reading'
            ));

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
                console.warn('Session data parsing error:', sessionError);
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
    // Also refresh when direct book updates happen within this tab
    const handleBookUpdated = () => handleStorageChange({ key: 'books_updated' });
    window.addEventListener('bookUpdated', handleBookUpdated);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookUpdated', handleBookUpdated);
    };
  }, []);
  
  if (loading) return <div className="section-card" style={{ margin: "6px 0", padding: "10px 12px" }}><h3>Loading currently reading...</h3></div>;

  // Debug: Always show the component with information
  console.warn('📖 CurrentlyReading render - books count:', currentlyReading.length);
  
  return (
    <div id="dashboard-currently-reading" className="section-card" style={{ margin: "6px 0", padding: "10px 12px" }}>
      <h3 className="section-title" style={{ margin: "4px 0 8px" }}>
        📖 Currently READING ({currentlyReading.length})
      </h3>
      <div className="simple-scroll-container covers-scroll">
        {currentlyReading.slice(0, 8).map((book) => (
          <div
            key={book.id}
            onClick={async () => {
              try {
                await startReadingSession(book);
              } catch {}
              navigate(`/read/${book.id}`);
            }}
            className="book-card cr-card"
            style={{
              position: 'relative',
              backgroundImage: (book.cover_url || book.coverUrl || book.cover) ? `url(${book.cover_url || book.coverUrl || book.cover})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              aspectRatio: '2 / 3',
              height: '220px',
              minWidth: '146px'
            }}
          >
            {/* Minimal status dot (icon-only) to avoid overlap with menus */}
            {(book.is_reading || book.status === 'reading' || book.status === 'paused') && (
              <div
                title={book.status === 'paused' ? 'Paused' : 'Reading'}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: book.status === 'paused' ? 'rgba(148,163,184,0.9)' : 'rgba(99,102,241,0.95)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                }}
              >
                {book.status === 'paused' ? '❚❚' : '▶'}
              </div>
            )}
            {/** Removed overlay title banner — cover already shows title */}

            {/* Per-card quick action overlay removed intentionally */}
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
      // Use the API config for consistency
      const response = await API.get('/books', { params: { limit: 200, offset: 0 } });
      const { items = [] } = response.data || {};
      const booksArray = items;

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
  console.warn('📚 RecentlyAdded render - books count:', recentBooks.length);
  
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

// Mobile Hero Reading Card Component
const MobileHeroReadingCard = ({ activeSession, navigate }) => {
  // If no active session, show Browse Library card
  if (!activeSession?.book) {
    return (
      <div className="dashboard-hero-reading-card dashboard-mobile-only">
        <div className="hero-reading-content">
          <div className="hero-reading-cover hero-reading-cover-empty">
            <span style={{ fontSize: '3rem' }}>📚</span>
          </div>
          <div className="hero-reading-info">
            <h2 className="hero-reading-title">Start Your Reading Journey</h2>
            <p className="hero-reading-author">Browse your library and pick a book</p>
            <button
              className="hero-reading-cta"
              onClick={() => navigate('/library')}
            >
              <span className="material-symbols-outlined" aria-hidden="true">library_books</span>
              Browse Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  const book = activeSession.book;
  const coverUrl = book.cover_url || book.coverUrl || book.cover;

  return (
    <div className="dashboard-hero-reading-card dashboard-mobile-only">
      <div className="hero-reading-content">
        {coverUrl && (
          <div
            className="hero-reading-cover"
            style={{ backgroundImage: `url(${coverUrl})` }}
            role="img"
            aria-label={`Cover of ${book.title}`}
          />
        )}
        <div className="hero-reading-info">
          <h2 className="hero-reading-title">{book.title}</h2>
          {book.author && <p className="hero-reading-author">by {book.author}</p>}
          <button
            className="hero-reading-cta"
            onClick={() => navigate(`/read/${book.id}`)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">play_arrow</span>
            Continue Reading
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Compact Stats Badge Component
const MobileCompactStatsBadge = ({ stats }) => {
  const activityStreak = stats?.readingStreak || 0;
  return (
    <div className="dashboard-compact-stats-badge dashboard-mobile-only">
      <div className="compact-stats-item">
        <span className="compact-stats-icon">🔥</span>
        <span>{activityStreak} day streak</span>
      </div>
      <div className="compact-stats-divider" />
      <div className="compact-stats-item">
        <span className="compact-stats-icon">⭐</span>
        <span>Level {stats?.level || 1}</span>
      </div>
      <div className="compact-stats-divider" />
      <div className="compact-stats-item">
        <span className="compact-stats-icon">📚</span>
        <span>{stats?.booksRead || 0} books</span>
      </div>
    </div>
  );
};

// Mobile Quick Actions Component
const MobileQuickActions = ({ navigate }) => {
  return (
    <div className="dashboard-mobile-quick-actions dashboard-mobile-only">
      <button className="mobile-quick-action-btn" onClick={() => navigate('/library')}>
        <span className="mobile-action-icon">📚</span>
        <span className="mobile-action-label">Library</span>
      </button>
      <button className="mobile-quick-action-btn" onClick={() => navigate('/upload')}>
        <span className="mobile-action-icon">📤</span>
        <span className="mobile-action-label">Upload</span>
      </button>
      <button className="mobile-quick-action-btn" onClick={() => navigate('/notes')}>
        <span className="mobile-action-icon">📝</span>
        <span className="mobile-action-label">Notes</span>
      </button>
    </div>
  );
};

// Mobile Expandable Stats Component
const MobileExpandableStats = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="dashboard-expandable-stats dashboard-mobile-only">
      <button
        className="expandable-stats-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="expandable-stats-label">View Detailed Stats</span>
        <span className={`expandable-stats-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </button>
      <div className={`expandable-stats-content ${isExpanded ? 'expanded' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Main Dashboard Component
const DashboardPage = () => {
  console.warn('🔄 DashboardPage: Rendering');
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { actualTheme } = useMaterial3Theme();
  const { stats } = useGamification();
  const navigate = useNavigate();
  // Needed for the global Resume banner and any resume/stop controls at this level
  const { activeSession } = useReadingSession();
  const [books, setBooks] = useState([]);

  // Driver.js tour for onboarding key actions
  const startDashboardTour = useCallback(() => {
    // Ensure nav links are in DOM (they live in AppLayout)
    const d = driver({
      showProgress: true,
      allowClose: true,
      stagePadding: 6,
      overlayColor: 'rgba(0,0,0,0.5)',
      steps: [
        {
          // Upload Book CTA: highlight inline button if present, otherwise the nav link
          element: '#tour-upload, nav .md3-rail-destinations a[href="/upload"]',
          popover: {
            title: 'Upload Book',
            description: 'This is your upload book feature. Click here to go to the Upload Page.',
            side: 'bottom',
            align: 'start',
            buttons: [
              {
                text: 'Open Upload',
                handler: () => { d.moveNext(); navigate('/upload'); }
              }
            ]
          },
        },
        {
          // Start Reading guidance: point to Library entry or inline CTA
          element: '#tour-start-reading, nav .md3-rail-destinations a[href="/library"]',
          popover: {
            title: 'Start Reading',
            description:
              'Start a reading session by starting a floatable reading timer and then click on your book to open it.',
            side: 'right',
            align: 'center',
            buttons: [
              {
                text: 'Open Library',
                handler: () => { d.moveNext(); navigate('/library'); }
              }
            ]
          },
        },
        {
          // Notes access: highlight Notes entry
          element: '#tour-notes, nav .md3-rail-destinations a[href="/notes"]',
          popover: {
            title: 'Notes Widget',
            description:
              "Navigate through your book and annotate on the notes widget. Save and head to the Notes page.",
            side: 'right',
            align: 'center',
            buttons: [
              {
                text: 'Open Notes',
                handler: () => { d.moveNext(); navigate('/notes'); }
              }
            ]
          },
        },
      ],
    });
    d.drive();
  }, [navigate]);

  // First-run auto-start of the tour (once per user/device)
  useEffect(() => {
    try {
      const KEY = 'sq_tour_seen_v1';
      const seen = localStorage.getItem(KEY) === '1';
      if (!seen) {
        setTimeout(() => {
          // Double-check we are still on dashboard
          if (window.location.pathname.includes('/dashboard')) {
            startDashboardTour();
            localStorage.setItem(KEY, '1');
          }
        }, 600);
      }
    } catch {}
  }, [startDashboardTour]);

  // Listen for manual restart requests from header/user menu
  useEffect(() => {
    const handler = () => startDashboardTour();
    window.addEventListener('restartGuidedTour', handler);
    return () => window.removeEventListener('restartGuidedTour', handler);
  }, [startDashboardTour]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    console.warn('🔄 Dashboard: Pull-to-refresh triggered');

    try {
      // Reload books
      const response = await API.get('/books', { params: { limit: 200, offset: 0 } });
      const { items = [] } = response.data || {};
      setBooks(items);

      showSnackbar('Dashboard refreshed successfully', 'success');
      console.warn('✅ Dashboard: Refresh completed');
    } catch (error) {
      console.error('❌ Dashboard: Refresh failed:', error);
      showSnackbar('Failed to refresh dashboard', 'error');
    }
  }, [showSnackbar]);

  // Pull-to-refresh hook (only active on mobile)
  const pullToRefresh = usePullToRefresh(handleRefresh, {
    threshold: 80,
    enabled: window.innerWidth <= 768, // Only on mobile
  });

  // Load books data for statistics
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await API.get('/books', { params: { limit: 200, offset: 0 } });
        const { items = [] } = response.data || {};
        setBooks(items);
      } catch (error) {
        console.error('Error loading books for dashboard:', error);
        setBooks([]); // Fallback to empty array
      }
    };

    loadBooks();
  }, []);

  return (
    <div className={`dashboard-container ${actualTheme === 'dark' ? 'dark' : ''}`}>
      {/* Pull-to-Refresh Indicator (Mobile Only) */}
      <PullToRefreshIndicator {...pullToRefresh} />

      <div className="dashboard-content">
        {/* Mobile-Only: Hero Reading Card */}
        <MobileHeroReadingCard activeSession={activeSession} navigate={navigate} />

        {/* Mobile-Only: Compact Stats Badge */}
        <MobileCompactStatsBadge stats={stats} />

        {/* Mobile-Only: Quick Actions */}
        <MobileQuickActions navigate={navigate} />

        <SmartResumeCard books={books} />

        {/* Global Resume banner (desktop only - mobile uses hero card) */}
        {activeSession?.book?.id && (activeSession?.isPaused) && (
          <div className="desktop-only" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            marginBottom: 12,
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: 10,
            background: 'var(--md-sys-color-surface-container)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" aria-hidden style={{ color: '#22c55e' }}>play_arrow</span>
              <div>
                <div style={{ fontWeight: 600 }}>Resume reading</div>
                <div style={{ opacity: 0.8, fontSize: 13 }}>{activeSession.book.title}</div>
              </div>
            </div>
            <button
              className="view-all-link"
              onClick={() => navigate(`/read/${activeSession.book.id}`)}
              style={{ fontWeight: 700 }}
            >
              Resume
            </button>
          </div>
        )}
        {/* Mobile: Expandable Stats - wraps the stat cards */}
        <MobileExpandableStats>
          <QuickStatsOverview
            totalBooks={Array.isArray(books) ? books.length : 0}
            completedBooks={(Array.isArray(books) ? books : []).filter(b => b.status === 'completed' || b.completed === true).length}
            inProgressBooks={(Array.isArray(books) ? books : []).filter(b => getBookStatus(b) === 'reading').length}
          />
        </MobileExpandableStats>

        {/* Desktop: Metric Cards - Horizontal Scroll (hidden on mobile) */}
        <QuickStatsOverview
          className="mobile-hide"
          totalBooks={Array.isArray(books) ? books.length : 0}
          completedBooks={(Array.isArray(books) ? books : []).filter(b => b.status === 'completed' || b.completed === true).length}
          inProgressBooks={(Array.isArray(books) ? books : []).filter(b => getBookStatus(b) === 'reading').length}
        />
        {/* Main Content Grid - 2 Column Layout (Welcome + Reading Sessions) */}
        <div className="dashboard-main-content-grid">

          {/* Left Column - Welcome Section (hidden on mobile) */}
          <div className="dashboard-content-left mobile-hide">
            <WelcomeSection user={user} activeSession={activeSession} onStartTour={startDashboardTour} />
            <GoalSelector />
            {/* Inline CTAs for the tour (stable anchors) */}
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                id="tour-upload"
                className="view-all-link"
                onClick={() => navigate('/upload')}
                title="Upload a new book"
              >
                Upload Book
              </button>
              <button
                id="tour-start-reading"
                className="view-all-link"
                onClick={() => navigate('/library')}
                title="Go to your Library to start a session"
              >
                Start Reading
              </button>
              <button
                id="tour-notes"
                className="view-all-link"
                onClick={() => navigate('/notes')}
                title="Open your Notes page"
              >
                Notes
              </button>
            </div>
          </div>

          {/* Right Column - Currently Reading Sessions */}
          <div className="dashboard-content-right">
            <CurrentlyReading />

            {/* Points History - Show recent point-earning actions (hidden on mobile) */}
            <div className="mobile-hide" style={{ marginTop: '20px' }}>
              <PointsHistory limit={10} />
            </div>
          </div>

        </div>

        {/* Bottom Row - Point Categories (hidden on mobile) */}
        <div className="dashboard-bottom-row mobile-hide">
          <PointCategoriesSection />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
