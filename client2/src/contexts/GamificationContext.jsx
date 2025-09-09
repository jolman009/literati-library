// src/contexts/GamificationContext.jsx - FIXED VERSION
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

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

  // Get auth context
  const { user, token, makeApiCall } = useAuth();

  // 🔧 FIXED: Safe API helper that handles 401s gracefully
  const makeSafeApiCall = async (endpoint, options = {}) => {
    try {
      if (!token) {
        throw new Error('No authentication token available');
      }

      return await makeApiCall(endpoint, options);
    } catch (error) {
      console.warn(`🎯 GamificationContext API error:`, error);
      
      // If it's a 401, don't propagate it up - just go offline
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔄 Switching to offline mode due to auth issues');
        setOfflineMode(true);
        return null;
      }
      
      // For other errors, still go offline but log differently
      console.log('🔄 Switching to offline mode due to API issues');
      setOfflineMode(true);
      return null;
    }
  };

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
      
      console.log(`📊 Calculated reading streak: ${currentStreak} days`);
      return currentStreak;
    } catch (error) {
      console.error('Error calculating reading streak:', error);
      return 0;
    }
  }, []);

  // Fetch all gamification data
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('🎯 Loading gamification data...');
    
    try {
      // Try API calls first if we have a token and not in offline mode
      if (token && !offlineMode) {
        console.log('🌐 Attempting API fetch...');
        
        // Fetch stats - if this fails, we'll go offline
        const statsData = await makeSafeApiCall('/gamification/stats');
        if (statsData) {
          const enhancedStats = {
            ...statsData,
            level: calculateLevel(statsData.totalPoints || 0)
          };
          setStats(enhancedStats);
          localStorage.setItem(`gamification_stats_${user.id}`, JSON.stringify(enhancedStats));
          console.log('✅ Stats loaded from API:', enhancedStats);
        }

        // Fetch achievements
        const achievementsData = await makeSafeApiCall('/gamification/achievements');
        if (achievementsData) {
          setAchievements(achievementsData);
          setUnlockedAchievements(new Set(achievementsData.map(a => a.id)));
          localStorage.setItem(`gamification_achievements_${user.id}`, JSON.stringify(achievementsData.map(a => a.id)));
          console.log('✅ Achievements loaded from API');
        }

        // Fetch goals
        const goalsData = await makeSafeApiCall('/gamification/goals');
        if (goalsData) {
          setGoals(goalsData);
          console.log('✅ Goals loaded from API');
        }
      }

      // Always try localStorage as backup/fallback
      console.log('💾 Loading from localStorage...');
      
      const savedStats = localStorage.getItem(`gamification_stats_${user.id}`);
      if (savedStats) {
        try {
          const parsedStats = JSON.parse(savedStats);
          // Calculate current reading streak from sessions
          const currentReadingStreak = calculateReadingStreak();
          
          setStats(prevStats => {
            // Only update if we didn't get API data or if API data is empty
            if (!token || offlineMode || prevStats.totalPoints === 0) {
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
          console.log('💾 Stats loaded from localStorage with reading streak:', currentReadingStreak);
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
        console.log('📊 No saved stats, but calculated reading streak:', currentReadingStreak);
      }

      const savedAchievements = localStorage.getItem(`gamification_achievements_${user.id}`);
      if (savedAchievements && (offlineMode || achievements.length === 0)) {
        try {
          const parsedAchievements = JSON.parse(savedAchievements);
          setUnlockedAchievements(new Set(parsedAchievements));
          setAchievements(parsedAchievements.map(id => ({ id, ...ACHIEVEMENTS[id] })).filter(Boolean));
          console.log('💾 Achievements loaded from localStorage');
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
  }, [user, token, offlineMode, calculateReadingStreak]);

  // Load data when user or token changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Track user action and award points
  const trackAction = useCallback(async (actionType, data = {}) => {
    if (!user) return;

    console.log(`🎯 Tracking action: ${actionType}`, data);

    // Point values for different actions
    const pointValues = {
      book_uploaded: 25,
      reading_session_started: 5,
      reading_session_completed: 10,
      page_read: 1,
      note_created: 15,
      highlight_created: 10,
      book_completed: 100,
      daily_login: 10,
      daily_checkin: 10, // Handle daily check-in locally
      library_visited: 5,
      achievement_unlocked: 0 // Points come from the achievement itself
    };

    const points = pointValues[actionType] || 0;

    // Update local stats immediately for responsive UI
    setStats(prevStats => {
      const newStats = {
        ...prevStats,
        totalPoints: prevStats.totalPoints + points,
        level: calculateLevel(prevStats.totalPoints + points)
      };

      // Update specific stats based on action type
      switch (actionType) {
        case 'book_uploaded':
          newStats.booksRead += 1;
          break;
        case 'page_read':
          newStats.pagesRead += (data.pages || 1);
          break;
        case 'note_created':
          newStats.notesCreated += 1;
          break;
        case 'highlight_created':
          newStats.highlightsCreated += 1;
          break;
        case 'book_completed':
          newStats.booksCompleted += 1;
          break;
        case 'reading_session_completed':
          const sessionTime = data.duration || 0;
          newStats.totalReadingTime += sessionTime;
          newStats.todayReadingTime += sessionTime;
          break;
      }

      // Save to localStorage
      localStorage.setItem(`gamification_stats_${user.id}`, JSON.stringify(newStats));
      
      return newStats;
    });

    // Try to sync with API if not in offline mode (skip actions without server endpoints)
    const localOnlyActions = ['daily_checkin', 'daily_login', 'library_visited', 'quick_add_book', 'quick_start_reading', 'quick_add_note', 'quick_set_goal'];
    if (!offlineMode && token && !localOnlyActions.includes(actionType)) {
      try {
        await makeSafeApiCall('/gamification/actions', {
          method: 'POST',
          body: JSON.stringify({
            actionType,
            points,
            data
          })
        });
      } catch (error) {
        console.warn('Failed to sync action with server:', error);
      }
    }

    // Check for achievement unlocks
    checkAchievements(actionType, data);
  }, [user, token, offlineMode]);

  // Check if user has unlocked any achievements
  const checkAchievements = useCallback((actionType, data = {}) => {
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

      console.log(`🏆 Achievement unlocked: ${achievement.title}`);

      // Save to localStorage
      const savedAchievements = localStorage.getItem(`gamification_achievements_${user.id}`);
      const currentAchievements = savedAchievements ? JSON.parse(savedAchievements) : [];
      const updatedAchievements = [...currentAchievements, achievement.id];
      localStorage.setItem(`gamification_achievements_${user.id}`, JSON.stringify(updatedAchievements));
    });
  }, [stats, unlockedAchievements, user]);

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
    if (!offlineMode && token) {
      try {
        await makeSafeApiCall('/gamification/goals', {
          method: 'POST',
          body: JSON.stringify(newGoal)
        });
      } catch (error) {
        console.warn('Failed to sync goal with server:', error);
      }
    }

    return { success: true, goal: newGoal };
  }, [user, token, offlineMode]);

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
    if (!offlineMode && token) {
      try {
        await makeSafeApiCall(`/gamification/goals/${goalId}`, {
          method: 'PUT',
          body: JSON.stringify({ progress })
        });
      } catch (error) {
        console.warn('Failed to sync goal progress with server:', error);
      }
    }
  }, [token, offlineMode]);

  const value = {
    // State
    stats,
    achievements,
    goals,
    unlockedAchievements,
    recentAchievement,
    loading,
    offlineMode,

    // Actions
    trackAction,
    createGoal,
    updateGoalProgress,
    clearRecentAchievement: () => setRecentAchievement(null),

    // Utilities
    calculateLevel,
    ACHIEVEMENTS,
    LEVEL_THRESHOLDS
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

export default GamificationContext;