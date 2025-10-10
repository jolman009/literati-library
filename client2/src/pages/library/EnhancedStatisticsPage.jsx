// src/pages/library/EnhancedStatisticsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MD3Card, MD3Progress, MD3Chip, MD3Button } from '../../components/Material3';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useReadingSession } from '../../contexts/ReadingSessionContext';
import AchievementSystem from '../../components/gamification/AchievementSystem';
import GoalSystem from '../../components/gamification/GoalSystem';
import './EnhancedStatisticsPage.css';

const EnhancedStatisticsPage = ({ books = [], user }) => {
  const { actualTheme } = useMaterial3Theme();
  const navigate = useNavigate();
  
  // Safely access context with error handling
  let gamificationStats = {};
  let trackAction = () => {};
  let getSessionHistory = () => [];
  
  try {
    const gamificationContext = useGamification();
    if (gamificationContext) {
      gamificationStats = gamificationContext.stats || {};
      trackAction = gamificationContext.trackAction || (() => {});
    }
  } catch (error) {
    console.warn('Gamification context not available:', error);
  }
  
  try {
    const sessionContext = useReadingSession();
    if (sessionContext && sessionContext.getSessionHistory) {
      getSessionHistory = sessionContext.getSessionHistory;
    }
  } catch (error) {
    console.warn('Reading session context not available:', error);
  }
  
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month'); // week, month, year, all
  const [readingSessions, setReadingSessions] = useState([]);

  useEffect(() => {
    // Load reading sessions from localStorage
    const sessions = getSessionHistory();
    setReadingSessions(sessions);
  }, [getSessionHistory]);

  // Calculate comprehensive statistics
  const statistics = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Filter sessions by time range
    const filteredSessions = readingSessions.filter(session => {
      if (!session.startTime) return false;
      const sessionDate = new Date(session.startTime);
      
      switch (timeRange) {
        case 'week':
          return sessionDate >= startOfWeek;
        case 'month':
          return sessionDate >= startOfMonth;
        case 'year':
          return sessionDate >= startOfYear;
        default:
          return true;
      }
    });

    // Book statistics
    const totalBooks = books.length;
    const completedBooks = books.filter(b => b.completed || b.status === 'completed').length;
    const inProgressBooks = books.filter(b => b.is_reading || b.status === 'reading').length;
    const wishlistBooks = books.filter(b => b.status === 'wishlist').length;

    // Reading time statistics
    const totalMinutes = filteredSessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);

    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // Pages read
    const totalPages = filteredSessions.reduce((total, session) => {
      return total + (session.pagesRead || 0);
    }, 0);

    // Average reading speed (pages per hour)
    const avgReadingSpeed = totalHours > 0 ? Math.round(totalPages / totalHours) : 0;

    // Daily reading average (minutes)
    const daysInRange = timeRange === 'week' ? 7 : 
                       timeRange === 'month' ? 30 : 
                       timeRange === 'year' ? 365 : 
                       Math.ceil((now - new Date(books[0]?.created_at || now)) / (1000 * 60 * 60 * 24));
    const dailyAverage = Math.round(totalMinutes / daysInRange);

    // Genre distribution
    const genreDistribution = books.reduce((acc, book) => {
      const genre = book.genre || 'Unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    // Reading streak calculation
    const calculateStreak = () => {
      const sessionDates = [...new Set(filteredSessions.map(s => 
        new Date(s.startTime).toDateString()
      ))].sort((a, b) => new Date(b) - new Date(a));

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      // Check if we have a session today or yesterday to start streak
      if (sessionDates[0] === today || sessionDates[0] === yesterday) {
        currentStreak = 1;
        tempStreak = 1;

        for (let i = 1; i < sessionDates.length; i++) {
          const prevDate = new Date(sessionDates[i - 1]);
          const currDate = new Date(sessionDates[i]);
          const dayDiff = Math.floor((prevDate - currDate) / 86400000);

          if (dayDiff === 1) {
            tempStreak++;
            currentStreak = tempStreak;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      return { currentStreak, longestStreak };
    };

    const { currentStreak, longestStreak } = calculateStreak();

    // Reading patterns (by hour of day)
    const readingByHour = new Array(24).fill(0);
    filteredSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      readingByHour[hour] += session.duration || 0;
    });

    const peakReadingHour = readingByHour.indexOf(Math.max(...readingByHour));

    // Books by month (for chart)
    const booksByMonth = {};
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(2024, i, 1).toLocaleDateString('en', { month: 'short' });
      booksByMonth[monthName] = 0;
    }
    
    books.forEach(book => {
      if (book.completed_date) {
        const month = new Date(book.completed_date).toLocaleDateString('en', { month: 'short' });
        if (booksByMonth[month] !== undefined) {
          booksByMonth[month]++;
        }
      }
    });

    return {
      totalBooks,
      completedBooks,
      inProgressBooks,
      wishlistBooks,
      totalMinutes,
      totalHours,
      totalDays,
      totalPages,
      avgReadingSpeed,
      dailyAverage,
      genreDistribution,
      currentStreak,
      longestStreak,
      peakReadingHour,
      booksByMonth,
      readingByHour,
      completionRate: totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0
    };
  }, [books, readingSessions, timeRange]);

  // Enhanced Achievement definitions with near-completion tracking
  const ENHANCED_ACHIEVEMENTS = {
    FIRST_BOOK: {
      id: 'first_book',
      title: 'First Steps',
      description: 'Complete your first book',
      icon: '📖',
      points: 100,
      target: 1,
      current: statistics.completedBooks,
      condition: () => statistics.completedBooks >= 1,
      category: 'reading'
    },
    BOOK_WORM: {
      id: 'book_worm',
      title: 'Bookworm',
      description: 'Complete 10 books',
      icon: '🐛',
      points: 500,
      target: 10,
      current: statistics.completedBooks,
      condition: () => statistics.completedBooks >= 10,
      category: 'reading'
    },
    SPEED_READER: {
      id: 'speed_reader',
      title: 'Speed Reader',
      description: 'Read 50+ pages per hour',
      icon: '⚡',
      points: 300,
      target: 50,
      current: statistics.avgReadingSpeed,
      condition: () => statistics.avgReadingSpeed >= 50,
      category: 'performance'
    },
    MARATHON_READER: {
      id: 'marathon_reader',
      title: 'Marathon Reader',
      description: 'Read for 100+ hours total',
      icon: '🏃',
      points: 1000,
      target: 100,
      current: statistics.totalHours,
      condition: () => statistics.totalHours >= 100,
      category: 'time'
    },
    STREAK_MASTER: {
      id: 'streak_master',
      title: 'Consistency King',
      description: 'Maintain a 30-day reading streak',
      icon: '🔥',
      points: 750,
      target: 30,
      current: statistics.longestStreak,
      condition: () => statistics.longestStreak >= 30,
      category: 'consistency'
    },
    GENRE_EXPLORER: {
      id: 'genre_explorer',
      title: 'Genre Explorer',
      description: 'Read books from 5+ different genres',
      icon: '🗺️',
      points: 400,
      target: 5,
      current: Object.keys(statistics.genreDistribution).length,
      condition: () => Object.keys(statistics.genreDistribution).length >= 5,
      category: 'diversity'
    },
    NIGHT_OWL: {
      id: 'night_owl',
      title: 'Night Owl',
      description: 'Most reading done after 9 PM',
      icon: '🦉',
      points: 200,
      target: 21,
      current: statistics.peakReadingHour,
      condition: () => statistics.peakReadingHour >= 21,
      category: 'habits'
    },
    EARLY_BIRD: {
      id: 'early_bird',
      title: 'Early Bird',
      description: 'Most reading done before 9 AM',
      icon: '🐦',
      points: 200,
      target: 9,
      current: statistics.peakReadingHour,
      condition: () => statistics.peakReadingHour < 9,
      category: 'habits'
    },
    PAGE_TURNER: {
      id: 'page_turner',
      title: 'Page Turner',
      description: 'Read 1000+ pages total',
      icon: '📄',
      points: 300,
      target: 1000,
      current: statistics.totalPages,
      condition: () => statistics.totalPages >= 1000,
      category: 'reading'
    },
    DEDICATION: {
      id: 'dedication',
      title: 'Dedication',
      description: 'Read for 7+ days this week',
      icon: '💪',
      points: 150,
      target: 7,
      current: statistics.currentStreak,
      condition: () => statistics.currentStreak >= 7,
      category: 'consistency'
    }
  };

  // Calculate unlocked and near-completion achievements
  const unlockedAchievements = Object.values(ENHANCED_ACHIEVEMENTS).filter(a => a.condition());
  
  // Near-completion achievements (50-90% progress)
  const nearCompletionAchievements = Object.values(ENHANCED_ACHIEVEMENTS)
    .map(achievement => ({
      ...achievement,
      progress: Math.min(100, (achievement.current / achievement.target) * 100)
    }))
    .filter(a => a.progress >= 50 && a.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);

  // Motivational achievements (20-50% progress)  
  const motivationalAchievements = Object.values(ENHANCED_ACHIEVEMENTS)
    .map(achievement => ({
      ...achievement,
      progress: Math.min(100, (achievement.current / achievement.target) * 100)
    }))
    .filter(a => a.progress >= 20 && a.progress < 50)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);

  // Goals definitions
  const GOALS = [
    {
      id: 'monthly_books',
      title: 'Monthly Reading Goal',
      description: 'Read 4 books this month',
      type: 'books',
      currentValue: statistics.completedBooks,
      targetValue: 4,
      progress: Math.min(100, (statistics.completedBooks / 4) * 100),
      reward: 250,
      deadline: 'End of month'
    },
    {
      id: 'daily_reading',
      title: 'Daily Reading Habit',
      description: 'Read at least 30 minutes every day',
      type: 'time',
      currentValue: statistics.dailyAverage,
      targetValue: 30,
      progress: Math.min(100, (statistics.dailyAverage / 30) * 100),
      reward: 150,
      deadline: 'Daily'
    },
    {
      id: 'pages_goal',
      title: 'Page Turner',
      description: 'Read 500 pages this month',
      type: 'pages',
      currentValue: statistics.totalPages,
      targetValue: 500,
      progress: Math.min(100, (statistics.totalPages / 500) * 100),
      reward: 300,
      deadline: 'End of month'
    },
    {
      id: 'streak_goal',
      title: 'Streak Builder',
      description: 'Build a 7-day reading streak',
      type: 'streak',
      currentValue: statistics.currentStreak,
      targetValue: 7,
      progress: Math.min(100, (statistics.currentStreak / 7) * 100),
      reward: 200,
      deadline: 'Continuous'
    }
  ];

  // Chart data for reading activity
  const readingActivityData = {
    labels: Object.keys(statistics.booksByMonth),
    datasets: [{
      label: 'Books Completed',
      data: Object.values(statistics.booksByMonth),
      backgroundColor: 'rgba(103, 80, 164, 0.5)',
      borderColor: 'rgb(103, 80, 164)',
      borderWidth: 2
    }]
  };

  // Mini chart component (simplified visualization)
  const MiniChart = ({ data, label, color = '#6750a4' }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="mini-chart">
        <div className="chart-bars">
          {data.map((value, index) => (
            <div key={index} className="chart-bar-container">
              <div 
                className="chart-bar"
                style={{
                  height: `${(value / max) * 100}%`,
                  backgroundColor: color
                }}
              />
            </div>
          ))}
        </div>
        <div className="chart-label">{label}</div>
      </div>
    );
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <div className="enhanced-statistics-page">
      {/* Header */}
      <div className="statistics-header">
        <div className="header-main">
          <h1 className="page-title">
            <span className="title-icon">📊</span>
            Statistics
          </h1>

          {/* Time Range Selector */}
          <div className="time-range-selector">
            {['week', 'month', 'year', 'all'].map(range => (
              <MD3Button
                key={range}
                variant={timeRange === range ? 'filled' : 'outlined'}
                onClick={() => setTimeRange(range)}
                size="small"
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </MD3Button>
            ))}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="header-nav">
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'library' } })}
            className="nav-button"
          >
            📚 Library
          </MD3Button>
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'reading' } })}
            className="nav-button"
          >
            📖 Reading
          </MD3Button>
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'collections' } })}
            className="nav-button"
          >
            📁 Collections
          </MD3Button>
          <MD3Button
            variant="text"
            onClick={() => navigate('/library', { state: { page: 'notes' } })}
            className="nav-button"
          >
            📝 Notes
          </MD3Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {['overview', 'achievements', 'goals', 'insights'].map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && '📈'}
            {tab === 'achievements' && '🏆'}
            {tab === 'goals' && '🎯'}
            {tab === 'insights' && '💡'}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="statistics-content">
          {/* Key Metrics Grid */}
          <div className="metrics-grid">
            <MD3Card className="metric-card metric-card-1 primary">
              <div className="metric-icon">📚</div>
              <div className="metric-content">
                <div className="metric-value">{statistics.totalBooks}</div>
                <div className="metric-label">Total Books</div>
                <div className="metric-sublabel">
                  {statistics.inProgressBooks} reading • {statistics.completedBooks} completed
                </div>
              </div>
            </MD3Card>

            <MD3Card className="metric-card metric-card-2 success">
              <div className="metric-icon">⏱️</div>
              <div className="metric-content">
                <div className="metric-value">{formatTime(statistics.totalMinutes)}</div>
                <div className="metric-label">Reading Time</div>
                <div className="metric-sublabel">
                  {statistics.dailyAverage}m daily average
                </div>
              </div>
            </MD3Card>

            <MD3Card className="metric-card metric-card-3 warning">
              <div className="metric-icon">🔥</div>
              <div className="metric-content">
                <div className="metric-value">{statistics.currentStreak}</div>
                <div className="metric-label">Current Streak</div>
                <div className="metric-sublabel">
                  Best: {statistics.longestStreak} days
                </div>
              </div>
            </MD3Card>

            <MD3Card className="metric-card metric-card-4 info">
              <div className="metric-icon">📖</div>
              <div className="metric-content">
                <div className="metric-value">{statistics.totalPages}</div>
                <div className="metric-label">Pages Read</div>
                <div className="metric-sublabel">
                  {statistics.avgReadingSpeed} pages/hour
                </div>
              </div>
            </MD3Card>
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            <MD3Card className="chart-card chart-card-1">
              <h3>Reading Activity</h3>
              <MiniChart
                data={Object.values(statistics.booksByMonth)}
                label="Books per Month"
                color="var(--md3-primary)"
              />
            </MD3Card>

            <MD3Card className="chart-card chart-card-2">
              <h3>Genre Distribution</h3>
              <div className="genre-list">
                {Object.entries(statistics.genreDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([genre, count]) => (
                    <div key={genre} className="genre-item">
                      <span className="genre-name">{genre}</span>
                      <div className="genre-bar">
                        <div
                          className="genre-fill"
                          style={{
                            width: `${(count / statistics.totalBooks) * 100}%`
                          }}
                        />
                      </div>
                      <span className="genre-count">{count}</span>
                    </div>
                  ))}
              </div>
            </MD3Card>

            <MD3Card className="chart-card chart-card-3">
              <h3>Reading Patterns</h3>
              <div className="pattern-info">
                <div className="pattern-item">
                  <span className="pattern-label">Peak Hour</span>
                  <span className="pattern-value">
                    {statistics.peakReadingHour}:00 - {statistics.peakReadingHour + 1}:00
                  </span>
                </div>
                <div className="pattern-item">
                  <span className="pattern-label">Completion Rate</span>
                  <span className="pattern-value">{statistics.completionRate}%</span>
                </div>
                <div className="progress-bar">
                  <MD3Progress value={statistics.completionRate} />
                </div>
              </div>
            </MD3Card>
          </div>

          {/* Year Progress */}
          <MD3Card className="year-progress-card year-progress-card-1">
            <h3>Yearly Reading Goal</h3>
            <div className="goal-progress">
              <div className="goal-info">
                <span className="goal-current">{statistics.completedBooks}</span>
                <span className="goal-separator">/</span>
                <span className="goal-target">50 books</span>
              </div>
              <MD3Progress 
                value={(statistics.completedBooks / 50) * 100}
                className="goal-progress-bar"
              />
              <div className="goal-status">
                {statistics.completedBooks >= 50 ? '🎉 Goal achieved!' : 
                 `${50 - statistics.completedBooks} books to go`}
              </div>
            </div>
          </MD3Card>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="achievements-content">
          <div className="achievements-header">
            <h2>Your Achievements</h2>
            <div className="achievement-stats">
              <span className="unlocked-count">
                🏆 {unlockedAchievements.length} / {Object.keys(ENHANCED_ACHIEVEMENTS).length} Unlocked
              </span>
              <span className="total-points">
                ⭐ {unlockedAchievements.reduce((sum, a) => sum + a.points, 0)} Points
              </span>
            </div>
          </div>

          {/* Near Completion Achievements - Premium Section */}
          {nearCompletionAchievements.length > 0 && (
            <MD3Card className="near-completion-card">
              <h3>🔥 Almost There! So Close to Victory!</h3>
              <p className="motivation-text">You're incredibly close to these achievements. Just a little more effort!</p>
              <div className="near-completion-grid">
                {nearCompletionAchievements.map(achievement => (
                  <div key={achievement.id} className="near-completion-item">
                    <div className="achievement-visual">
                      <div className="achievement-icon-large">{achievement.icon}</div>
                      <div className="progress-ring">
                        <svg width="60" height="60" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="25" fill="none" stroke="var(--md3-outline-variant)" strokeWidth="4"/>
                          <circle 
                            cx="30" 
                            cy="30" 
                            r="25" 
                            fill="none" 
                            stroke="var(--md3-primary)" 
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${achievement.progress * 1.57} 157`}
                            transform="rotate(-90 30 30)"
                            className="progress-circle"
                          />
                        </svg>
                        <span className="progress-percentage">{Math.round(achievement.progress)}%</span>
                      </div>
                    </div>
                    <div className="achievement-details">
                      <h4>{achievement.title}</h4>
                      <p>{achievement.description}</p>
                      <div className="achievement-progress-text">
                        <span className="progress-current">{achievement.current}</span>
                        <span className="progress-separator">/</span>
                        <span className="progress-target">{achievement.target}</span>
                        <span className="progress-unit">
                          {achievement.category === 'reading' ? 'books' : 
                           achievement.category === 'time' ? 'hours' :
                           achievement.category === 'performance' ? 'pages/hr' :
                           achievement.category === 'consistency' ? 'days' : 'items'}
                        </span>
                      </div>
                      <MD3Chip 
                        icon="⭐" 
                        label={`${achievement.points} points`} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </MD3Card>
          )}

          {/* Motivational Achievements */}
          {motivationalAchievements.length > 0 && (
            <MD3Card className="motivational-card">
              <h3>💪 Keep Going! You've Got This!</h3>
              <p className="motivation-text">Great progress! These achievements are waiting for you.</p>
              <div className="motivational-grid">
                {motivationalAchievements.map(achievement => (
                  <div key={achievement.id} className="motivational-item">
                    <div className="motivational-icon">{achievement.icon}</div>
                    <div className="motivational-content">
                      <h5>{achievement.title}</h5>
                      <div className="motivational-progress">
                        <MD3Progress value={achievement.progress} className="small-progress" />
                        <span className="motivational-percentage">{Math.round(achievement.progress)}%</span>
                      </div>
                      <span className="motivational-remaining">
                        {achievement.target - achievement.current} more to go!
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </MD3Card>
          )}
          
          <AchievementSystem 
            achievements={unlockedAchievements.map(a => a.id)}
            ACHIEVEMENTS={Object.fromEntries(
              Object.entries(ENHANCED_ACHIEVEMENTS).map(([key, value]) => [
                key.toUpperCase(), 
                {
                  id: value.id,
                  title: value.title,
                  description: value.description,
                  icon: value.icon,
                  points: value.points
                }
              ])
            )}
            showAll={true}
          />
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="goals-content">
          <div className="goals-header">
            <h2>Reading Goals</h2>
            <div className="goals-stats">
              <span className="active-goals">
                🎯 {GOALS.filter(g => g.progress < 100).length} Active Goals
              </span>
              <span className="completed-goals">
                ✅ {GOALS.filter(g => g.progress >= 100).length} Completed
              </span>
            </div>
          </div>
          
          <GoalSystem 
            goals={GOALS}
            onComplete={(goal) => {
              console.log('Goal completed:', goal);
              trackAction('goal_completed', { goalId: goal.id, reward: goal.reward });
            }}
          />
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="insights-content">
          <h2>Reading Insights</h2>
          
          <div className="insights-grid">
            <MD3Card className="insight-card insight-card-1">
              <h3>📚 Reading Velocity</h3>
              <p>You're reading {statistics.avgReadingSpeed} pages per hour, which is {
                statistics.avgReadingSpeed > 40 ? 'above' : 'below'
              } average!</p>
              {statistics.avgReadingSpeed > 40 &&
                <MD3Chip icon="⚡" label="Speed Reader" color="success" />
              }
            </MD3Card>

            <MD3Card className="insight-card insight-card-2">
              <h3>🎯 Goal Progress</h3>
              <p>At your current pace of {statistics.dailyAverage} minutes per day, you'll complete your yearly goal in {
                Math.ceil((50 - statistics.completedBooks) * 300 / statistics.dailyAverage)
              } days.</p>
            </MD3Card>

            <MD3Card className="insight-card insight-card-3">
              <h3>📖 Favorite Genre</h3>
              <p>Your most read genre is <strong>{
                Object.entries(statistics.genreDistribution)
                  .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
              }</strong> with {
                Object.entries(statistics.genreDistribution)
                  .sort((a, b) => b[1] - a[1])[0]?.[1] || 0
              } books.</p>
            </MD3Card>

            <MD3Card className="insight-card insight-card-4">
              <h3>⏰ Best Reading Time</h3>
              <p>You're most productive reading at <strong>{statistics.peakReadingHour}:00</strong>.
              {statistics.peakReadingHour >= 21 ? ' A true night owl!' :
               statistics.peakReadingHour < 9 ? ' Early bird catches the worm!' :
               ' Perfect for a midday break!'}</p>
            </MD3Card>

            <MD3Card className="insight-card insight-card-5">
              <h3>🔥 Streak Analysis</h3>
              <p>Your current streak is {statistics.currentStreak} days.
              {statistics.currentStreak > 0 ? ' Keep it up!' : ' Start reading today to begin a new streak!'}</p>
              {statistics.currentStreak >= 7 &&
                <MD3Chip icon="🔥" label="On Fire!" color="warning" />
              }
            </MD3Card>

            <MD3Card className="insight-card insight-card-6">
              <h3>📈 Monthly Trend</h3>
              <p>You've read {statistics.completedBooks} books this {timeRange},
              {statistics.completedBooks > 3 ? ' exceeding' : ' working towards'} your monthly goal!</p>
            </MD3Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStatisticsPage;