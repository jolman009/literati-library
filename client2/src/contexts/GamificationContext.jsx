// src/contexts/GamificationContext.jsx - FIXED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import API from '../config/api';

// 🔧 ADDITIONAL IMPORT CHECK - Make sure React hooks are available
if (!useEffect) {
  console.error('❌ useEffect not available - check React imports');
}

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, points: 0 },
  { level: 2, points: 100 },
  { level: 3, points: 300 },
  { level: 4, points: 600 },
  { level: 5, points: 1000 },
  { level: 6, points: 1500 },
  { level: 7, points: 2500 },
  { level: 8, points: 4000 },
  { level: 9, points: 6000 },
  { level: 10, points: 10000 },
];

// Achievement definitions
const ACHIEVEMENTS = {
  FIRST_BOOK: { id: 'first_book', title: 'First Steps', description: 'Upload your first book', points: 50, icon: '📚' },
  BOOKWORM: { id: 'bookworm', title: 'Bookworm', description: 'Upload 10 books', points: 200, icon: '🐛' },
  COLLECTOR: { id: 'collector', title: 'Collector', description: 'Upload 25 books', points: 500, icon: '📖' },
  LIBRARIAN: { id: 'librarian', title: 'Librarian', description: 'Upload 50 books', points: 1000, icon: '📚' },
  
  EARLY_BIRD: { id: 'early_bird', title: 'Early Bird', description: 'Read before 8 AM', points: 75, icon: '🌅' },
  NIGHT_OWL: { id: 'night_owl', title: 'Night Owl', description: 'Read after 10 PM', points: 75, icon: '🦉' },
  SPEED_READER: { id: 'speed_reader', title: 'Speed Reader', description: 'Read 100 pages in one session', points: 150, icon: '⚡' },
  MARATHON_READER: { id: 'marathon_reader', title: 'Marathon Reader', description: 'Read for 2+ hours straight', points: 200, icon: '🏃' },
  
  STREAK_3: { id: 'streak_3', title: '3-Day Streak', description: 'Read for 3 consecutive days', points: 100, icon: '🔥' },
  STREAK_7: { id: 'streak_7', title: 'Week Warrior', description: 'Read for 7 consecutive days', points: 250, icon: '🔥' },
  STREAK_30: { id: 'streak_30', title: 'Monthly Master', description: 'Read for 30 consecutive days', points: 1000, icon: '🔥' },
  
  NOTE_TAKER: { id: 'note_taker', title: 'Note Taker', description: 'Create 10 notes', points: 150, icon: '📝' },
  HIGHLIGHTER: { id: 'highlighter', title: 'Highlighter', description: 'Create 25 highlights', points: 200, icon: '✏️' },
  
  FINISHER: { id: 'finisher', title: 'Finisher', description: 'Complete your first book', points: 100, icon: '✅' },
  COMPLETIONIST: { id: 'completionist', title: 'Completionist', description: 'Complete 10 books', points: 500, icon: '🏆' },
};

// Calculate user level based on points
const calculateLevel = (points) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].points) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
};

export const GamificationProvider = ({ children }) => {
  // State
  const [stats, setStats] = useState({
    totalPoints: 0,
    level: 1,
    booksRead: 0,
    pagesRead: 0,
    totalReadingTime: 0,
    readingStreak: 0,
    notesCreated: 0,
    highlightsCreated: 0,
    booksCompleted: 0,
    todayReadingTime: 0,
    weeklyReadingTime: 0,
    monthlyReadingTime: 0,
    averageSessionDuration: 0
  });

  const [achievements, setAchievements] = useState([]);
  const [goals, setGoals] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [recentAchievement, setRecentAchievement] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [rewardFeedback, setRewardFeedback] = useState(null);
  const [goalPreference, setGoalPreference] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gamification_goal_preference')) || {
        type: 'time',
        targetMinutesPerWeek: 120,
        targetBooksPerMonth: 2
      };
    } catch {
      return { type: 'time', targetMinutesPerWeek: 120, targetBooksPerMonth: 2 };
    }
  });
  const [weeklyQuestChoice, setWeeklyQuestChoice] = useState(() => {
    try {
      return localStorage.getItem('gamification_weekly_quest') || 'balanced';
    } catch {
      return 'balanced';
    }
  });

  // Get auth context (AuthContext uses HttpOnly cookies; no token needed here)
  const { user, makeApiCall, loading: authLoading, isAuthenticated } = useAuth();

  // Reset offline mode when we have an authenticated user
  useEffect(() => {
    if (user && offlineMode) {
      console.warn('✅ GamificationContext: User detected, resetting offline mode to false');
      setOfflineMode(false);
    }
  }, [user, offlineMode]);

  // 🔧 FIXED: Safe API helper that handles 401s gracefully
  const makeSafeApiCall = useCallback(async (endpoint, options = {}) => {
    try {
      if (!user) {
        console.warn('🔒 No authenticated user - working offline');
        setOfflineMode(true);
        return null;
      }

      const response = await makeApiCall(endpoint, options);
      return response;
    } catch (error) {
      console.warn(`🎯 GamificationContext API error for ${endpoint}:`, error.message || error);

      // If it's a 401, don't propagate it up - just go offline
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.warn('🔄 Switching to offline mode due to auth issues');
        setOfflineMode(true);
        return null;
      }

      // For 429 (rate limit), don't go offline - just skip this request
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        console.warn('⏸️ Rate limited - skipping this request but staying online');
        return null;
      }

      // For 500 errors, backend might not be ready yet
      if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
        console.warn('⚠️ Backend error - continuing in offline mode');
        setOfflineMode(true);
        return null;
      }

      // For other errors, still go offline but log differently
      console.warn('🔄 Switching to offline mode due to API issues');
      setOfflineMode(true);
      return null;
    }
  }, [user, makeApiCall]);

  // Persist goal preferences
  useEffect(() => {
    try {
      localStorage.setItem('gamification_goal_preference', JSON.stringify(goalPreference));
    } catch {}
  }, [goalPreference]);

  useEffect(() => {
    try {
      localStorage.setItem('gamification_weekly_quest', weeklyQuestChoice);
    } catch {}
  }, [weeklyQuestChoice]);

  // Calculate reading streak from session history
  const calculateReadingStreak = useCallback(() => {
    try {
      // Get reading sessions from localStorage
      const sessionHistory = JSON.parse(localStorage.getItem('readingSessionHistory') || '[]');
      
      if (!sessionHistory || sessionHistory.length === 0) {
        return 0;
      }

      // Group sessions by date
      const sessionsByDate = {};
      sessionHistory.forEach(session => {
        if (session.startTime) {
          const date = new Date(session.startTime).toDateString();
          sessionsByDate[date] = true;
        }
      });

      // Get sorted dates
      const readingDates = Object.keys(sessionsByDate)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => b - a); // Sort descending (most recent first)

      if (readingDates.length === 0) return 0;

      // Check for current streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if we have a session today or yesterday
      const mostRecent = readingDates[0];
      mostRecent.setHours(0, 0, 0, 0);
      
      const daysSinceLastRead = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));
      
      // If last read was more than 1 day ago, streak is broken
      if (daysSinceLastRead > 1) {
        return 0;
      }
      
      // Count consecutive days backwards from most recent
      let currentStreak = 1;
      for (let i = 1; i < readingDates.length; i++) {
        const prevDate = new Date(readingDates[i - 1]);
        const currentDate = new Date(readingDates[i]);
        prevDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      console.warn(`📊 Calculated reading streak: ${currentStreak} days`);
      return currentStreak;
    } catch (error) {
      console.error('Error calculating reading streak:', error);
      return 0;
    }
  }, []);

  // Fetch all gamification data
  const fetchData = useCallback(async () => {
    // Defer until auth provider has finished verifying cookies and user is authenticated
    if (authLoading || !user || !isAuthenticated) {
      setLoading(false);
      return;
    }

    console.warn('🎯 Loading gamification data...');
    
    try {
      // Try API calls first if not in offline mode
      if (!offlineMode) {
        console.warn('🌐 Attempting API fetch...');
        
        // Fetch stats - if this fails, we'll go offline
        const statsData = await makeSafeApiCall('/api/gamification/stats');
        if (statsData) {
          const enhancedStats = {
            ...statsData,
            level: calculateLevel(statsData.totalPoints || 0)
          };
          setStats(enhancedStats);
          localStorage.setItem(`gamification_stats_${user.id}`, JSON.stringify(enhancedStats));
          console.warn('✅ Stats loaded from API:', enhancedStats);
        }

        // Fetch achievements
        const achievementsData = await makeSafeApiCall('/api/gamification/achievements');
        if (achievementsData) {
          setAchievements(achievementsData);
          setUnlockedAchievements(new Set(achievementsData.map(a => a.id)));
          localStorage.setItem(`gamification_achievements_${user.id}`, JSON.stringify(achievementsData.map(a => a.id)));
          console.warn('✅ Achievements loaded from API');
        }

        // Fetch goals
        const goalsData = await makeSafeApiCall('/api/gamification/goals');
        if (goalsData) {
          setGoals(goalsData);
          console.warn('✅ Goals loaded from API');
        }
      }

      // Always try localStorage as backup/fallback
      console.warn('💾 Loading from localStorage...');
      
      const savedStats = localStorage.getItem(`gamification_stats_${user.id}`);
      if (savedStats) {
        try {
          const parsedStats = JSON.parse(savedStats);
          // Calculate current reading streak from sessions
          const currentReadingStreak = calculateReadingStreak();
          
          setStats(prevStats => {
            // Only update if we didn't get API data or if API data is empty
            if (offlineMode || prevStats.totalPoints === 0) {
              return {
                ...parsedStats,
                level: calculateLevel(parsedStats.totalPoints || 0),
                readingStreak: currentReadingStreak // Always use calculated streak
              };
            }
            return {
              ...prevStats,
              readingStreak: currentReadingStreak // Always update reading streak
            };
          });
          console.warn('💾 Stats loaded from localStorage with reading streak:', currentReadingStreak);
        } catch (error) {
          console.error('Error parsing saved stats:', error);
        }
      } else {
        // No saved stats, but still calculate reading streak
        const currentReadingStreak = calculateReadingStreak();
        setStats(prevStats => ({
          ...prevStats,
          readingStreak: currentReadingStreak
        }));
        console.warn('📊 No saved stats, but calculated reading streak:', currentReadingStreak);
      }

      const savedAchievements = localStorage.getItem(`gamification_achievements_${user.id}`);
      if (savedAchievements && (offlineMode || achievements.length === 0)) {
        try {
          const parsedAchievements = JSON.parse(savedAchievements);
          setUnlockedAchievements(new Set(parsedAchievements));
          setAchievements(parsedAchievements.map(id => ({ id, ...ACHIEVEMENTS[id] })).filter(Boolean));
          console.warn('💾 Achievements loaded from localStorage');
        } catch (error) {
          console.error('Error parsing saved achievements:', error);
        }
      }

      // Initialize with some default goals if none exist
      if (goals.length === 0) {
        const defaultGoals = [
          {
            id: 'daily_reading',
            title: 'Daily Reading',
            description: 'Read for 30 minutes today',
            type: 'daily',
            target: 30,
            current: 0,
            reward: 50,
            deadline: new Date().toISOString()
          }
        ];
        setGoals(defaultGoals);
      }

    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading, offlineMode, calculateReadingStreak, makeSafeApiCall, achievements.length, goals.length]);

  // Add debouncing and caching for fetchData
  const lastFetchTime = useRef(0);
  const fetchDataDebounced = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;

    // Prevent fetching more than once every 5 seconds
    if (timeSinceLastFetch < 5000) {
      console.warn(`⏱️ Skipping fetchData - last fetch was ${timeSinceLastFetch}ms ago`);
      return;
    }

    lastFetchTime.current = now;
    fetchData();
  }, [fetchData]);

  // Load data when user or token changes
  useEffect(() => {
    if (!user || authLoading || !isAuthenticated) return;
    fetchDataDebounced();
  }, [user?.id, authLoading, isAuthenticated, fetchDataDebounced, user]);

  // Check if user has unlocked any achievements
  const checkAchievements = useCallback((actionType) => {
    if (!user) return;

    const currentStats = stats;
    const newUnlocks = [];

    // Check each achievement
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (unlockedAchievements.has(achievement.id)) return;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first_book':
          shouldUnlock = actionType === 'book_uploaded' && currentStats.booksRead >= 1;
          break;
        case 'bookworm':
          shouldUnlock = actionType === 'book_uploaded' && currentStats.booksRead >= 10;
          break;
        case 'collector':
          shouldUnlock = actionType === 'book_uploaded' && currentStats.booksRead >= 25;
          break;
        case 'librarian':
          shouldUnlock = actionType === 'book_uploaded' && currentStats.booksRead >= 50;
          break;
        case 'finisher':
          shouldUnlock = actionType === 'book_completed' && currentStats.booksCompleted >= 1;
          break;
        case 'completionist':
          shouldUnlock = actionType === 'book_completed' && currentStats.booksCompleted >= 10;
          break;
        case 'note_taker':
          shouldUnlock = actionType === 'note_created' && currentStats.notesCreated >= 10;
          break;
        case 'highlighter':
          shouldUnlock = actionType === 'highlight_created' && currentStats.highlightsCreated >= 25;
          break;
        case 'streak_3':
          shouldUnlock = currentStats.readingStreak >= 3;
          break;
        case 'streak_7':
          shouldUnlock = currentStats.readingStreak >= 7;
          break;
        case 'streak_30':
          shouldUnlock = currentStats.readingStreak >= 30;
          break;
      }

      if (shouldUnlock) {
        newUnlocks.push(achievement);
      }
    });

    // Process new unlocks
    newUnlocks.forEach(achievement => {
      setUnlockedAchievements(prev => new Set([...prev, achievement.id]));
      setAchievements(prev => [...prev, { ...achievement, unlockedAt: new Date().toISOString() }]);
      setRecentAchievement(achievement);

      // Award achievement points
      setStats(prevStats => ({
        ...prevStats,
        totalPoints: prevStats.totalPoints + achievement.points,
        level: calculateLevel(prevStats.totalPoints + achievement.points)
      }));

      console.warn(`🏆 Achievement unlocked: ${achievement.title}`);

      // Save to localStorage
      const savedAchievements = localStorage.getItem(`gamification_achievements_${user.id}`);
      const currentAchievements = savedAchievements ? JSON.parse(savedAchievements) : [];
      const updatedAchievements = [...currentAchievements, achievement.id];
      localStorage.setItem(`gamification_achievements_${user.id}`, JSON.stringify(updatedAchievements));
    });
  }, [stats, unlockedAchievements, user]);

  // Track user action and award points
  const trackAction = useCallback(async (actionType, data = {}, options = {}) => {
    if (!user) {
      console.warn('⚠️ GamificationContext: trackAction called but no user found');
      return;
    }

    // Ensure we're not stuck in offline mode if user exists
    if (user && offlineMode) setOfflineMode(false);

    console.warn(`🎯 GamificationContext: Tracking action: ${actionType}`, data);
    console.warn(`🎯 GamificationContext: User ID: ${user.id}`);

    // Point values for different actions
    const pointValues = {
      book_uploaded: 25,
      reading_session_started: 5,
      reading_session_completed: 10,
      page_read: 1,
      // pages_read is dynamic based on data.pages
      pages_read: 0,
      note_created: 15,
      highlight_created: 10,
      book_completed: 100,
      daily_login: 10,
      daily_checkin: 10, // Handle daily check-in locally
      library_visited: 5,
      mentor_interaction: 5, // AI mentor interaction for activity streak
      achievement_unlocked: 0 // Points come from the achievement itself
    };

    const points = actionType === 'pages_read'
      ? (Number(data?.pages) || 0)
      : (pointValues[actionType] || 0);
    const serverSnapshot = options?.serverSnapshot;

    // Calculate new stats first
    let newTotalPoints = 0;

    // Update local stats immediately for responsive UI
    setStats(prevStats => {
      const snapshotPoints = typeof serverSnapshot?.totalPoints === 'number'
        ? serverSnapshot.totalPoints
        : prevStats.totalPoints + points;

      const snapshotLevel = typeof serverSnapshot?.level === 'number'
        ? serverSnapshot.level
        : calculateLevel(snapshotPoints);

      const newStats = {
        ...prevStats,
        totalPoints: snapshotPoints,
        level: snapshotLevel,
      };

      const snapshotNotes = typeof serverSnapshot?.notesCreated === 'number' ? serverSnapshot.notesCreated : null;

      // Update specific stats based on action type
      switch (actionType) {
        case 'book_uploaded':
          newStats.booksRead += 1;
          break;
        case 'page_read':
          newStats.pagesRead += (data.pages || 1);
          break;
        case 'pages_read':
          newStats.pagesRead += (Number(data.pages) || 0);
          break;
        case 'note_created':
          newStats.notesCreated = snapshotNotes ?? (newStats.notesCreated + 1);
          break;
        case 'highlight_created':
          newStats.highlightsCreated += 1;
          break;
        case 'book_completed':
          newStats.booksCompleted += 1;
          break;
        case 'reading_session_completed':
          { const sessionTime = data.duration || 0;
          newStats.totalReadingTime += sessionTime;
          newStats.todayReadingTime += sessionTime;
          break; }
      }

      // If snapshot provided but didn't include notesCreated, ensure we persist derived total
      if (snapshotNotes !== null) {
        newStats.notesCreated = snapshotNotes;
      }

      // Save to localStorage
      localStorage.setItem(`gamification_stats_${user.id}`, JSON.stringify(newStats));

      // Store for event dispatch
      newTotalPoints = newStats.totalPoints;

      return newStats;
    });

    // Record a local history entry so PointsHistory can render immediately/offline
    try {
      if (user?.id) {
        const key = `gamification_actions_${user.id}`;
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        const nowIso = new Date().toISOString();
        const entry = { id: `local_${Date.now()}`, action: actionType, points, data: data || {}, created_at: nowIso, pending: true };
        localStorage.setItem(key, JSON.stringify([entry, ...prev].slice(0, 100)));
      }
    } catch { /* empty */ }

    // 🔔 Dispatch event AFTER state update (outside setStats callback)
    // This ensures the event fires after React has committed the state
    console.warn(`🔔 GamificationContext: Broadcasting gamificationUpdate event for action: ${actionType}`);
    console.warn(`🔔 GamificationContext: Event detail:`, {
      action: actionType,
      points,
      totalPoints: newTotalPoints,
      timestamp: new Date().toISOString()
    });

    const event = new CustomEvent('gamificationUpdate', {
      detail: {
        action: actionType,
        points,
        totalPoints: newTotalPoints,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
    console.warn(`✅ GamificationContext: Event dispatched successfully`);

    if (['reading_session_completed', 'note_created'].includes(actionType) && points > 0) {
      setRewardFeedback({
        id: `${actionType}-${Date.now()}`,
        action: actionType,
        points,
        meta: data
      });
    }

    // Try to sync with API if not in offline mode (skip actions without server endpoints)
    // Note: daily_login is now synced with server to prevent duplicate points across devices
    const localOnlyActions = ['daily_checkin', 'library_visited', 'quick_add_book', 'quick_start_reading', 'quick_add_note', 'quick_set_goal'];

    // 🔧 FIX: Use a variable to track if we should sync, don't rely on state
    const shouldSyncToServer = !!user && !offlineMode && !localOnlyActions.includes(actionType);

    console.warn(`🔍 GamificationContext: Sync check - offlineMode: ${offlineMode}, isLocalOnly: ${localOnlyActions.includes(actionType)}, willSync: ${shouldSyncToServer}`);

    if (shouldSyncToServer) {
      console.warn(`🌐 GamificationContext: Starting server sync for ${actionType}...`);
      // ✅ Wrap in Promise to ensure async errors don't bubble up
      Promise.resolve().then(async () => {
        try {
          console.warn(`📤 GamificationContext: Calling /gamification/actions API...`);
          // ✅ Post using axios instance to ensure credentials + interceptors
          const response = await API.post('/api/gamification/actions', {
            action: actionType,
            data,
            timestamp: new Date().toISOString()
          });

          if (response?.data) {
            if (response.data.warning) {
              console.error(`⚠️ DATABASE INSERT FAILED: ${actionType}`, response.warning);
              console.error('👉 This action will NOT appear after refresh!');
            } else {
              console.warn(`✅ Action synced to server: ${actionType} (+${points} points)`, response);

              // ✅ Update readingStreak immediately from server response
              if (typeof response.data.streak === 'number') {
                setStats(prevStats => ({
                  ...prevStats,
                  readingStreak: response.data.streak
                }));
                console.warn(`🔥 Streak updated from server: ${response.data.streak} days`);
              }
            }
          } else {
            console.warn(`⚠️ Action tracking returned no response: ${actionType}`);
          }
          // Refresh stats from server after a successful sync
          try { fetchDataDebounced(); } catch { /* empty */ }
        } catch (error) {
          // ✅ Triple-layer error handling: catch ANY error
          console.error(`❌ Failed to sync action with server:`, error);
        }
      }).catch(err => {
        // ✅ Catch promise rejections that escape the try-catch
        console.error(`❌ Unhandled promise rejection in trackAction:`, err);
      });
    } else {
      console.warn(`⏭️ GamificationContext: Skipping server sync for ${actionType} (localOnly: ${localOnlyActions.includes(actionType)}, offlineMode: ${offlineMode})`);
    }

    // Check for achievement unlocks
    checkAchievements(actionType, data);
  }, [user, offlineMode, checkAchievements, fetchDataDebounced]);

  // Listen for daily login events from AuthContext
  useEffect(() => {
    const handleDailyLogin = (event) => {
      if (!user) return;

      console.warn('🎯 Daily login event received', event.detail);

      // Track the daily login action
      trackAction('daily_login', {
        userId: event.detail.userId,
        timestamp: event.detail.timestamp,
        date: event.detail.date
      });
    };

    window.addEventListener('dailyLoginTracked', handleDailyLogin);

    return () => {
      window.removeEventListener('dailyLoginTracked', handleDailyLogin);
    };
  }, [user, trackAction]);

  // Create a new goal
  const createGoal = useCallback(async (goalData) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    const newGoal = {
      id: Date.now().toString(),
      ...goalData,
      createdAt: new Date().toISOString(),
      current: 0
    };

    setGoals(prev => [...prev, newGoal]);

    // Try to sync with API
    if (!offlineMode && user) {
      try {
        await makeSafeApiCall('/api/gamification/goals', {
          method: 'POST',
          body: JSON.stringify(newGoal)
        });
      } catch (error) {
        console.warn('Failed to sync goal with server:', error);
      }
    }

    return { success: true, goal: newGoal };
  }, [user, offlineMode, makeSafeApiCall]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (goalId, progress) => {
    setGoals(prev => 
      prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, current: Math.min(goal.target, goal.current + progress) }
          : goal
      )
    );

    // Try to sync with API
    if (!offlineMode && user) {
      try {
        await makeSafeApiCall(`/api/gamification/goals/${goalId}`, {
          method: 'PUT',
          body: JSON.stringify({ progress })
        });
      } catch (error) {
        console.warn('Failed to sync goal progress with server:', error);
      }
    }
  }, [user, offlineMode, makeSafeApiCall]);

  // Manual sync function - fetch latest data from server and reconcile with local
  const syncWithServer = useCallback(async () => {
    if (!user || offlineMode) {
      console.warn('⚠️ Cannot sync: user not authenticated or in offline mode');
      return { success: false, error: 'Not authenticated or offline' };
    }

    console.warn('🔄 Starting manual sync with server...');
    setLoading(true);

    try {
      // Fetch fresh data from server
      const statsData = await makeSafeApiCall('/api/gamification/stats');
      const achievementsData = await makeSafeApiCall('/api/gamification/achievements');
      const goalsData = await makeSafeApiCall('/api/gamification/goals');

      if (statsData) {
        const enhancedStats = {
          ...statsData,
          level: calculateLevel(statsData.totalPoints || 0),
          readingStreak: calculateReadingStreak() // Always recalculate from local sessions
        };

        // Update state with server data (server is source of truth)
        setStats(enhancedStats);
        localStorage.setItem(`gamification_stats_${user.id}`, JSON.stringify(enhancedStats));
        console.warn('✅ Stats synced from server:', enhancedStats);
      }

      if (achievementsData) {
        setAchievements(achievementsData);
        setUnlockedAchievements(new Set(achievementsData.map(a => a.id)));
        localStorage.setItem(`gamification_achievements_${user.id}`, JSON.stringify(achievementsData.map(a => a.id)));
        console.warn('✅ Achievements synced from server');
      }

      if (goalsData) {
        setGoals(goalsData);
        console.warn('✅ Goals synced from server');
      }

      console.warn('✅ Sync complete - all data updated from server');
      return {
        success: true,
        message: 'Data synced successfully',
        stats: statsData,
        achievements: achievementsData?.length || 0
      };

    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        error: error.message || 'Sync failed'
      };
    } finally {
      setLoading(false);
    }
  }, [user, offlineMode, makeSafeApiCall, calculateReadingStreak]);

  // Manual refresh function - useful for forcing UI updates after mutations
  const refreshStats = useCallback(async () => {
    if (!user) {
      console.warn('⚠️ Cannot refresh stats: user not authenticated');
      return { success: false, error: 'Not authenticated' };
    }

    console.warn('🔄 GamificationContext: Manual stats refresh requested');

    try {
      // Fetch fresh stats from server
      const statsData = await makeSafeApiCall('/api/gamification/stats');

      if (statsData) {
        const enhancedStats = {
          ...statsData,
          level: calculateLevel(statsData.totalPoints || 0),
          readingStreak: calculateReadingStreak() // Always recalculate from local sessions
        };

        setStats(enhancedStats);
        localStorage.setItem(`gamification_stats_${user.id}`, JSON.stringify(enhancedStats));
        console.warn('✅ GamificationContext: Stats refreshed successfully', enhancedStats);

        return { success: true, stats: enhancedStats };
      } else {
        console.warn('⚠️ GamificationContext: Stats refresh returned no data');
        return { success: false, error: 'No data returned' };
      }
    } catch (error) {
      console.error('❌ GamificationContext: Stats refresh failed', error);
      return { success: false, error: error.message };
    }
  }, [user, makeSafeApiCall, calculateReadingStreak]);

  const value = {
    // State
    stats,
    achievements,
    goals,
    unlockedAchievements,
    recentAchievement,
    loading,
    offlineMode,
    rewardFeedback,
    goalPreference,
    weeklyQuestChoice,

    // Actions
    trackAction,
    createGoal,
    updateGoalProgress,
    syncWithServer,
    refreshStats,
    clearRecentAchievement: () => setRecentAchievement(null),
    clearRewardFeedback: () => setRewardFeedback(null),
    setGoalPreference: (preference) => setGoalPreference(preference),
    setWeeklyQuestChoice,

    // Utilities
    calculateLevel,
    ACHIEVEMENTS,
    LEVEL_THRESHOLDS
  };

  // 🔍 DEBUG: Log context value on every render
  console.warn('🎮 GamificationContext: Providing value:', {
    stats,
    loading,
    offlineMode,
    hasUser: !!user
  });

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export default GamificationContext;
