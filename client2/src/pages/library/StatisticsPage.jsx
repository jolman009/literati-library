// src/pages/subpages/StatisticsPage.jsx
import React, { useState, useEffect } from 'react';
import { MD3Card, MD3Progress } from '../../components/Material3';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';

const StatisticsPage = ({ books = [], readingSessions = [], user: _user }) => {
  const { actualTheme } = useMaterial3Theme();
  const [stats, setStats] = useState({
    totalBooks: 0,
    completedBooks: 0,
    currentlyReading: 0,
    totalReadingTime: 0,
    averageReadingSpeed: 0,
    booksThisMonth: 0,
    booksThisYear: 0,
    favoriteGenre: '',
    longestReadingStreak: 0,
    currentStreak: 0
  });

  useEffect(() => {
    calculateStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, readingSessions]);

  const calculateStats = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Calculate book statistics
    const totalBooks = books.length;
    const completedBooks = books.filter(b => b.completed || b.status === 'completed').length;
    const currentlyReading = books.filter(b => b.isReading || b.status === 'reading').length;

    // Calculate books completed this month/year
    const booksThisMonth = books.filter(b => {
      if (!b.completed_date) return false;
      const completedDate = new Date(b.completed_date);
      return completedDate.getMonth() === thisMonth && completedDate.getFullYear() === thisYear;
    }).length;

    const booksThisYear = books.filter(b => {
      if (!b.completed_date) return false;
      const completedDate = new Date(b.completed_date);
      return completedDate.getFullYear() === thisYear;
    }).length;

    // Calculate genre statistics
    const genreCounts = books.reduce((acc, book) => {
      const genre = book.genre || 'Unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});
    const favoriteGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Calculate reading time statistics
    const totalReadingTime = readingSessions?.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0) || 0;

    const totalPages = books.reduce((total, book) => {
      return total + ((book.progress || 0) * (book.total_pages || 0) / 100);
    }, 0);

    const averageReadingSpeed = totalReadingTime > 0 
      ? Math.round(totalPages / (totalReadingTime / 60)) 
      : 0;

    // Calculate reading streaks from reading sessions
    const calculateReadingStreaks = (sessions) => {
      if (!sessions || sessions.length === 0) {
        return { longestStreak: 0, currentStreak: 0 };
      }

      // Group sessions by date (only consider dates with actual reading)
      const sessionsByDate = sessions.reduce((acc, session) => {
        if (!session.startTime) return acc;
        
        const sessionDate = new Date(session.startTime).toDateString();
        if (!acc[sessionDate]) {
          acc[sessionDate] = [];
        }
        acc[sessionDate].push(session);
        return acc;
      }, {});

      // Get sorted unique reading dates
      const readingDates = Object.keys(sessionsByDate)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b);

      if (readingDates.length === 0) {
        return { longestStreak: 0, currentStreak: 0 };
      }

      let longestStreak = 1;
      let _currentStreak = 1;
      let tempStreak = 1;

      // Calculate streaks by checking consecutive days
      for (let i = 1; i < readingDates.length; i++) {
        const prevDate = readingDates[i - 1];
        const currentDate = readingDates[i];
        const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          tempStreak++;
        } else {
          // Streak broken
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      // Update longest streak with final temp streak
      longestStreak = Math.max(longestStreak, tempStreak);

      // Calculate current streak (from today backwards)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentStreakCount = 0;
      let checkDate = new Date(today);

      // Check if we read today or yesterday (to account for current day)
      for (let i = 0; i < 2; i++) {
        const checkDateStr = checkDate.toDateString();
        if (sessionsByDate[checkDateStr]) {
          currentStreakCount = i === 0 ? 1 : currentStreakCount + 1;
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // If we found a starting point, continue counting backwards
      if (currentStreakCount > 0) {
        checkDate = new Date(today);
        if (currentStreakCount === 1 && !sessionsByDate[today.toDateString()]) {
          // Started from yesterday
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // Count consecutive days backwards
        for (let i = 1; i < readingDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const checkDateStr = checkDate.toDateString();
          
          if (sessionsByDate[checkDateStr]) {
            currentStreakCount++;
          } else {
            break;
          }
        }
      }

      return { 
        longestStreak: Math.max(longestStreak, currentStreakCount), 
        currentStreak: currentStreakCount 
      };
    };

    // Get reading sessions from localStorage (fallback) and props
    const allSessions = [
      ...(readingSessions || []),
      ...(JSON.parse(localStorage.getItem('readingSessionHistory') || '[]'))
    ];

    // Remove duplicates based on startTime and sessionId
    const uniqueSessions = allSessions.filter((session, index, arr) => 
      index === arr.findIndex(s => 
        s.startTime === session.startTime && 
        (s.sessionId === session.sessionId || s.id === session.id)
      )
    );

    const { longestStreak, currentStreak } = calculateReadingStreaks(uniqueSessions);

    setStats({
      totalBooks,
      completedBooks,
      currentlyReading,
      totalReadingTime,
      averageReadingSpeed,
      booksThisMonth,
      booksThisYear,
      favoriteGenre,
      longestReadingStreak: longestStreak,
      currentStreak: currentStreak
    });
  };

  const formatReadingTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const StatCard = ({ icon, label, value, subValue, color }) => (
    <MD3Card style={{
      padding: '20px',
      background: actualTheme === 'dark' 
        ? 'linear-gradient(135deg, #1e293b, #334155)'
        : 'linear-gradient(135deg, #ffffff, #f8fafc)',
      border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
      height: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          fontSize: '32px',
          background: color || '#24A8E0',
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
            marginBottom: '4px'
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
          }}>
            {value}
          </div>
          {subValue && (
            <div style={{
              fontSize: '12px',
              color: actualTheme === 'dark' ? '#64748b' : '#94a3b8',
              marginTop: '4px'
            }}>
              {subValue}
            </div>
          )}
        </div>
      </div>
    </MD3Card>
  );

  const completionRate = stats.totalBooks > 0 
    ? Math.round((stats.completedBooks / stats.totalBooks) * 100)
    : 0;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
        marginBottom: '24px'
      }}>
        📊 Reading Statistics
      </h2>

      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <StatCard
          icon="📚"
          label="Total Books"
          value={stats.totalBooks}
          subValue={`${stats.currentlyReading} currently reading`}
          color="#24A8E0"
        />
        
        <StatCard
          icon="✅"
          label="Completed Books"
          value={stats.completedBooks}
          subValue={`${completionRate}% completion rate`}
          color="#4caf50"
        />
        
        <StatCard
          icon="⏱️"
          label="Total Reading Time"
          value={formatReadingTime(stats.totalReadingTime)}
          subValue={`${stats.averageReadingSpeed} pages/hour`}
          color="#2196f3"
        />
        
        <StatCard
          icon="🏆"
          label="This Year"
          value={stats.booksThisYear}
          subValue={`${stats.booksThisMonth} this month`}
          color="#ff9800"
        />
      </div>

      {/* Progress Overview */}
      <MD3Card style={{
        padding: '24px',
        marginBottom: '32px',
        background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
        }}>
          Reading Progress Overview
        </h3>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: actualTheme === 'dark' ? '#94a3b8' : '#64748b' }}>
                Completion Rate
              </span>
              <span style={{ fontWeight: '600', color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937' }}>
                {completionRate}%
              </span>
            </div>
            <MD3Progress value={completionRate} />
          </div>
          
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ color: actualTheme === 'dark' ? '#94a3b8' : '#64748b' }}>
                Yearly Goal Progress
              </span>
              <span style={{ fontWeight: '600', color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937' }}>
                {stats.booksThisYear}/50 books
              </span>
            </div>
            <MD3Progress value={(stats.booksThisYear / 50) * 100} />
          </div>
        </div>
      </MD3Card>

      {/* Genre Distribution */}
      <MD3Card style={{
        padding: '24px',
        background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
        }}>
          Genre Distribution
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          {Object.entries(
            books.reduce((acc, book) => {
              const genre = book.genre || 'Unknown';
              acc[genre] = (acc[genre] || 0) + 1;
              return acc;
            }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([genre, count]) => (
              <div
                key={genre}
                style={{
                  padding: '12px',
                  background: actualTheme === 'dark' ? '#334155' : '#f8fafc',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#24A8E0'
                }}>
                  {count}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: actualTheme === 'dark' ? '#94a3b8' : '#64748b',
                  marginTop: '4px'
                }}>
                  {genre}
                </div>
              </div>
            ))}
        </div>
      </MD3Card>
    </div>
  );
};

export default StatisticsPage;
