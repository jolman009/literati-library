
// src/components/dashboard/ReadingStatsOverview.jsx - Full Premium Version
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MD3Progress, MD3Button, MD3Chip } from '../Material3';
import './ReadingStatsOverview.css';

const ReadingStatsOverview = ({ books = [] }) => {
  const navigate = useNavigate();
  
  // Safely access reading sessions from localStorage
  const [readingSessions, setReadingSessions] = useState([]);

  useEffect(() => {
    try {
      const sessions = JSON.parse(localStorage.getItem('readingSessionHistory') || '[]');
      setReadingSessions(Array.isArray(sessions) ? sessions : []);
    } catch (error) {
      console.warn('Could not load reading sessions:', error);
      setReadingSessions([]);
    }
  }, []);

  // Calculate premium statistics with gamification
  const premiumStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    // Weekly sessions
    const weeklySessions = readingSessions.filter(session => 
      session.startTime && new Date(session.startTime) >= startOfWeek
    );

    // Basic book stats
    const totalBooks = books.length;
    const completedBooks = books.filter(b => b.completed || b.status === 'completed').length;
    const inProgressBooks = books.filter(b => b.is_reading || b.status === 'reading').length;

    // Reading time this week
    const weeklyMinutes = weeklySessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    );

    // Pages read this week
    const weeklyPages = weeklySessions.reduce((total, session) => 
      total + (session.pagesRead || 0), 0
    );

    // Total reading statistics
    const totalMinutes = readingSessions.reduce((total, session) => 
      total + (session.duration || 0), 0
    );

    const totalPages = readingSessions.reduce((total, session) => 
      total + (session.pagesRead || 0), 0
    );

    // Advanced metrics
    const avgReadingSpeed = totalMinutes > 60 ? Math.round(totalPages / (totalMinutes / 60)) : 0;

    // Current streak calculation
    const sessionDates = [...new Set(readingSessions
      .filter(s => s.startTime)
      .map(s => new Date(s.startTime).toDateString())
    )]
    .sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (sessionDates.length > 0) {
      if (sessionDates[0] === today || sessionDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sessionDates.length; i++) {
          const prevDate = new Date(sessionDates[i - 1]);
          const currDate = new Date(sessionDates[i]);
          const dayDiff = Math.floor((prevDate - currDate) / 86400000);
          if (dayDiff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Monthly goal progress
    const monthlyGoalProgress = Math.min(100, (completedBooks / 4) * 100);

    // Genre diversity
    const genreCount = new Set(books.map(b => b.genre || 'Unknown')).size;

    return {
      totalBooks,
      completedBooks,
      inProgressBooks,
      weeklyMinutes,
      weeklyPages,
      totalMinutes,
      totalPages,
      avgReadingSpeed,
      currentStreak,
      monthlyGoalProgress,
      genreCount
    };
  }, [books, readingSessions]);

  // Premium achievement progress tracking
  const achievementProgress = [
    {
      id: 'first_book',
      title: 'First Steps',
      icon: '📖',
      progress: Math.min(100, (premiumStats.completedBooks / 1) * 100),
      target: 1,
      current: premiumStats.completedBooks,
      points: 100,
      category: 'reading'
    },
    {
      id: 'bookworm',
      title: 'Bookworm',
      icon: '🐛',
      progress: Math.min(100, (premiumStats.completedBooks / 10) * 100),
      target: 10,
      current: premiumStats.completedBooks,
      points: 500,
      category: 'reading'
    },
    {
      id: 'speed_reader',
      title: 'Speed Reader',
      icon: '⚡',
      progress: Math.min(100, (premiumStats.avgReadingSpeed / 50) * 100),
      target: 50,
      current: premiumStats.avgReadingSpeed,
      points: 300,
      category: 'performance'
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      icon: '🔥',
      progress: Math.min(100, (premiumStats.currentStreak / 7) * 100),
      target: 7,
      current: premiumStats.currentStreak,
      points: 250,
      category: 'consistency'
    },
    {
      id: 'page_turner',
      title: 'Page Turner',
      icon: '📄',
      progress: Math.min(100, (premiumStats.weeklyPages / 100) * 100),
      target: 100,
      current: premiumStats.weeklyPages,
      points: 200,
      category: 'weekly'
    },
    {
      id: 'genre_explorer',
      title: 'Genre Explorer',
      icon: '🗺️',
      progress: Math.min(100, (premiumStats.genreCount / 5) * 100),
      target: 5,
      current: premiumStats.genreCount,
      points: 400,
      category: 'diversity'
    }
  ];

  // Near-completion achievements (50-95% complete)
  const nearCompletionAchievements = achievementProgress
    .filter(a => a.progress >= 50 && a.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  // Motivational achievements (25-50% complete)
  const motivationalAchievements = achievementProgress
    .filter(a => a.progress >= 25 && a.progress < 50)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Only show if user has meaningful activity
  if (premiumStats.totalBooks === 0 && premiumStats.weeklyMinutes === 0) {
    return null;
  }

  return (
    <div className="reading-stats-overview">
      <div className="stats-header">
        <h2 className="stats-title">
          <span className="stats-icon">📊</span>
          Your Reading Progress
        </h2>
        <MD3Button
          variant="text"
          onClick={() => navigate('/library?tab=statistics')}
          size="small"
        >
          View Full Analytics
        </MD3Button>
      </div>

      <div className="stats-content">
        {/* Premium Quick Stats Row */}
        <div className="quick-stats-row">
          <div className="quick-stat-item">
            <div className="stat-value">{premiumStats.totalBooks}</div>
            <div className="stat-label">Books</div>
            <div className="stat-detail">{premiumStats.inProgressBooks} reading</div>
          </div>
          
          <div className="quick-stat-item highlight">
            <div className="stat-value">{formatTime(premiumStats.weeklyMinutes)}</div>
            <div className="stat-label">This Week</div>
            <div className="stat-detail">{premiumStats.weeklyPages} pages</div>
          </div>
          
          <div className="quick-stat-item streak">
            <div className="stat-value">{premiumStats.currentStreak}</div>
            <div className="stat-label">Day Streak</div>
            <div className="stat-detail">
              {premiumStats.currentStreak > 0 ? '🔥 On fire!' : 'Start today!'}
            </div>
          </div>
        </div>

        {/* Monthly Goal Progress - Premium */}
        {premiumStats.monthlyGoalProgress > 0 && (
          <div className="compact-goal premium">
            <div className="goal-header-compact">
              <span>📅 Monthly Reading Goal</span>
              <span className="goal-progress-text">
                {premiumStats.completedBooks}/4 books ({Math.round(premiumStats.monthlyGoalProgress)}%)
              </span>
            </div>
            <MD3Progress 
              value={premiumStats.monthlyGoalProgress}
              className="goal-progress-compact"
            />
            {premiumStats.monthlyGoalProgress >= 75 && (
              <div className="goal-almost-complete">
                🎯 So close! Only {4 - premiumStats.completedBooks} books to go!
              </div>
            )}
          </div>
        )}

        {/* Premium Near-Completion Achievements */}
        {nearCompletionAchievements.length > 0 && (
          <div className="achievement-preview premium">
            <h4>🔥 Almost There! So Close to Victory!</h4>
            <div className="achievement-preview-list">
              {nearCompletionAchievements.map(achievement => (
                <div key={achievement.id} className="achievement-preview-item premium">
                  <span className="achievement-preview-icon">{achievement.icon}</span>
                  <div className="achievement-preview-content">
                    <div className="achievement-preview-title">{achievement.title}</div>
                    <div className="achievement-preview-progress">
                      <MD3Progress 
                        value={achievement.progress}
                        className="achievement-progress-mini"
                      />
                      <span className="achievement-preview-percent">
                        {Math.round(achievement.progress)}%
                      </span>
                    </div>
                    <div className="achievement-preview-details">
                      <span className="achievement-current">{achievement.current}</span>
                      <span className="achievement-separator">/</span>
                      <span className="achievement-target">{achievement.target}</span>
                      <MD3Chip 
                        icon="⭐" 
                        label={`${achievement.points}pts`} 
                        size="small"
                        variant="outlined"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Achievements */}
        {motivationalAchievements.length > 0 && (
          <div className="motivational-preview">
            <h4>💪 Keep Going! You're Making Progress!</h4>
            <div className="motivational-list">
              {motivationalAchievements.map(achievement => (
                <div key={achievement.id} className="motivational-item">
                  <span className="motivational-icon">{achievement.icon}</span>
                  <div className="motivational-content">
                    <span className="motivational-title">{achievement.title}</span>
                    <div className="motivational-progress">
                      <MD3Progress value={achievement.progress} className="motivational-progress-bar" />
                      <span className="motivational-percent">{Math.round(achievement.progress)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Smart Insights */}
        <div className="reading-insights-premium">
          {premiumStats.currentStreak >= 3 && (
            <div className="insight-premium success">
              🔥 Incredible! {premiumStats.currentStreak}-day reading streak - you're unstoppable!
            </div>
          )}
          
          {premiumStats.avgReadingSpeed > 40 && (
            <div className="insight-premium info">
              ⚡ Speed demon! Reading {premiumStats.avgReadingSpeed} pages/hour - that's above average!
            </div>
          )}
          
          {premiumStats.weeklyMinutes > 180 && (
            <div className="insight-premium warning">
              🏆 Amazing week! {formatTime(premiumStats.weeklyMinutes)} of pure reading focus!
            </div>
          )}

          {premiumStats.monthlyGoalProgress >= 75 && premiumStats.monthlyGoalProgress < 100 && (
            <div className="insight-premium primary">
              🎯 Victory is within reach! Just {4 - premiumStats.completedBooks} more books for your monthly goal!
            </div>
          )}
          
          {premiumStats.genreCount >= 3 && (
            <div className="insight-premium diversity">
              🗺️ Genre explorer! You've read {premiumStats.genreCount} different genres - expanding your horizons!
            </div>
          )}
          
          {nearCompletionAchievements.length === 0 && motivationalAchievements.length === 0 && premiumStats.totalBooks > 0 && (
            <div className="insight-premium default">
              📚 Ready for your next reading adventure? New achievements await!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadingStatsOverview;