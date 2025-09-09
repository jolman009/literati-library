// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';
import { useSnackbar } from '@/components/Material3';
import { useMaterial3Theme } from '@/contexts/Material3ThemeContext';
import API from '@/config/api';
import MD3Card from '@/components/Material3/MD3Card';
import LiteraryMentorUI from '@/components/LiteraryMentorUI';

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
    <div style={{ 
      marginBottom: '24px',
      position: 'relative'
    }}>
      {/* Theme Toggle Button - Top Right */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: actualTheme === 'dark' ? '#fbbf24' : '#1e3a8a',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          transition: 'all 0.3s ease',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}
        title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {actualTheme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div style={{
        background: actualTheme === 'dark' 
          ? 'linear-gradient(135deg, #1e3a8a, #312e81)' 
          : 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '16px',
        padding: '24px 32px', // Reduced from 32px/40px
        color: 'white',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
      }}>
        <h1 style={{ 
          fontSize: '28px', // Reduced from 32px
          fontWeight: 'bold', 
          marginBottom: '8px'
        }}>
          {getMotivationalMessage()}
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.9, 
          marginBottom: '16px' // Reduced from 24px
        }}>
          Welcome back, {user?.name || 'Reader'}! You're currently Level {stats?.level || 1}
          {checkInStreak > 0 && ` with a ${checkInStreak}-day check-in streak`}.
        </p>

        {/* Level Progress Bar */}
        <div style={{ marginBottom: '20px' }}> {/* Reduced from 24px */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            fontSize: '14px',
            opacity: 0.9
          }}>
            <span>Level {stats?.level || 1}</span>
            <span>{Math.round(levelProgress)}% to Level {(stats?.level || 1) + 1}</span>
          </div>
          <div style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${levelProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              borderRadius: '4px',
              transition: 'width 0.8s ease'
            }}/>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => navigate('/library')}
            style={{
              padding: '10px 20px', // Reduced from 12px 24px
              background: 'rgba(255, 255, 255, 0.25)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
          >
            📚 Continue Reading
          </button>
          
          <button 
            onClick={() => navigate('/upload')}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ⬆️ Add Books
          </button>

          <button 
            onClick={handleDailyCheckIn}
            disabled={hasCheckedInToday}
            style={{
              padding: '10px 20px',
              background: hasCheckedInToday 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(16, 185, 129, 0.2)',
              color: hasCheckedInToday ? 'rgba(255, 255, 255, 0.6)' : 'white',
              border: `1px solid ${hasCheckedInToday ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 185, 129, 0.5)'}`,
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: hasCheckedInToday ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              textDecoration: hasCheckedInToday ? 'line-through' : 'none',
              position: 'relative'
            }}
          >
            {hasCheckedInToday ? '✓ Checked In' : '✅ Daily Check-in'}
            {checkInStreak > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                🔥 {checkInStreak}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// Quick Stats Overview Component
const QuickStatsOverview = ({ checkInStreak = 0 }) => {
  const { stats } = useGamification();
  const { actualTheme } = useMaterial3Theme();
  const [loading, setLoading] = useState(!stats);
  
  // Use prop or fallback to localStorage
  const displayStreak = checkInStreak || parseInt(localStorage.getItem('checkInStreak') || '0');

  useEffect(() => {
    if (stats) setLoading(false);
  }, [stats]);

  const statItems = [
    { 
      icon: '📚', 
      value: stats?.booksRead || 0, 
      label: 'Books Read',
      color: actualTheme === 'dark' 
        ? 'linear-gradient(135deg, #1e40af, #3730a3)'
        : 'linear-gradient(135deg, #3b82f6, #6366f1)'
    },
    { 
      icon: '📖', 
      value: stats?.pagesRead || 0, 
      label: 'Pages Read',
      color: actualTheme === 'dark'
        ? 'linear-gradient(135deg, #7c3aed, #a21caf)'
        : 'linear-gradient(135deg, #8b5cf6, #d946ef)'
    },
    { 
      icon: '✅', 
      value: displayStreak, 
      label: 'Check-in Streak',
      color: actualTheme === 'dark'
        ? 'linear-gradient(135deg, #059669, #10b981)'
        : 'linear-gradient(135deg, #10b981, #059669)'
    },
    { 
      icon: '🔥', 
      value: stats?.readingStreak || 0, 
      label: 'Reading Streak',
      color: actualTheme === 'dark'
        ? 'linear-gradient(135deg, #dc2626, #ea580c)'
        : 'linear-gradient(135deg, #ef4444, #f97316)'
    },
    { 
      icon: '⭐', 
      value: stats?.totalPoints || 0, 
      label: 'Total Points',
      color: actualTheme === 'dark'
        ? 'linear-gradient(135deg, #ca8a04, #a16207)'
        : 'linear-gradient(135deg, #eab308, #f59e0b)'
    },
    { 
      icon: '📝', 
      value: stats?.notesCreated || 0, 
      label: 'Notes Created',
      color: actualTheme === 'dark'
        ? 'linear-gradient(135deg, #059669, #0d9488)'
        : 'linear-gradient(135deg, #10b981, #14b8a6)'
    }
  ];

 if (loading) {
  return (
    <div className="stats-grid">
      {[...Array(6)].map((_, i) => (
        <MD3Card key={i} variant="elevated" className="stat-card">
          <div className="loading-shimmer" style={{ height: '24px', marginBottom: '8px' }}></div>
          <div className="loading-shimmer" style={{ height: '32px', marginBottom: '4px' }}></div>
          <div className="loading-shimmer" style={{ height: '16px' }}></div>
        </MD3Card>
      ))}
    </div>
  );
}

  return (
  <div className="stats-grid">
    {statItems.map((stat, index) => (
      <MD3Card 
        key={index} 
        variant="elevated" 
        className={`stat-card ${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="stat-icon">{stat.icon}</div>
        <div className="stat-value">{stat.value}</div>
        <div className="stat-label">{stat.label}</div>
      </MD3Card>
    ))}
  </div>
);
};

// Recent Achievements Component (kept but can be removed if needed)
const RecentAchievements = () => {
  const { achievements } = useGamification();
  const { actualTheme } = useMaterial3Theme();
  
  const recentAchievements = useMemo(() => {
    if (!achievements || achievements.length === 0) return [];
    return achievements.slice(-3).reverse();
  }, [achievements]);

  if (!achievements || achievements.length === 0) {
    return null;
  }

  return (
    <div style={{ 
      background: actualTheme === 'dark' ? '#1e293b' : 'white', 
      borderRadius: '12px', 
      padding: '24px', 
      border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
      marginBottom: '32px'
    }}>
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '16px', 
        color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
      }}>
        🏆 Recent Achievements
      </h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {recentAchievements.map((achievement, index) => (
          <div 
            key={index}
            style={{
              padding: '8px 16px',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, #312e81, #1e3a8a)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600',
              color: actualTheme === 'dark' ? 'white' : '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{achievement.icon || '🏅'}</span>
            <span>{achievement.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Currently Reading Section Component
const CurrentlyReading = () => {
  const { actualTheme } = useMaterial3Theme();
  const navigate = useNavigate();
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchCurrentlyReading = async () => {
      try {
        const token = localStorage.getItem('literati_token');
        if (!token) return;
        
        const response = await fetch('http://localhost:5000/books', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Extract books array from response object (API returns {books: Array})
          const booksArray = Array.isArray(data.books) ? data.books : [];
          const readingBooks = booksArray.filter(book => book.is_reading);
          setCurrentlyReading(readingBooks);
        }
      } catch (error) {
        console.error('Failed to fetch currently reading books:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurrentlyReading();
  }, []);
  
  if (loading) return null;
  if (currentlyReading.length === 0) return null;
  
  return (
    <div style={{ 
      background: actualTheme === 'dark' ? '#1e293b' : 'white', 
      borderRadius: '12px', 
      padding: '24px', 
      border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
      marginBottom: '32px'
    }}>
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '16px', 
        color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
      }}>
        📖 Currently Reading ({currentlyReading.length})
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px' 
      }}>
        {currentlyReading.slice(0, 4).map((book) => (
          <div 
            key={book.id}
            onClick={() => navigate(`/read/${book.id}`)}
            style={{
              padding: '12px',
              background: actualTheme === 'dark' ? '#0f172a' : '#f8fafc',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: actualTheme === 'dark' ? '#e2e8f0' : '#0f172a',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {book.title}
            </div>
            <div style={{ 
              fontSize: '12px',
              color: actualTheme === 'dark' ? '#cbd5e1' : '#334155',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              by {book.author}
            </div>
            {book.progress !== undefined && (
              <div>
                <div style={{
                  height: '4px',
                  background: actualTheme === 'dark' ? '#334155' : '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: `${book.progress || 0}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease'
                  }}/>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: actualTheme === 'dark' ? '#64748b' : '#9ca3af'
                }}>
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
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'transparent',
            color: '#3b82f6',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          View all {currentlyReading.length} books →
        </button>
      )}
    </div>
  );
};

// Recently Added Books Component for Dashboard
const RecentlyAdded = () => {
  const { actualTheme } = useMaterial3Theme();
  const navigate = useNavigate();
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentBooks = async () => {
      try {
        const token = localStorage.getItem('literati_token');
        if (!token) return;
        
        const response = await fetch('http://localhost:5000/books', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Extract books array from response object (API returns {books: Array})
          const booksArray = Array.isArray(data.books) ? data.books : [];
          // Get recently added books (filter by created_at or dateAdded)
          const recentlyAdded = booksArray
            .filter(book => book.created_at || book.dateAdded)
            .sort((a, b) => {
              const dateA = new Date(a.created_at || a.dateAdded || 0);
              const dateB = new Date(b.created_at || b.dateAdded || 0);
              return dateB - dateA;
            })
            .slice(0, 3); // Show only 3 books for dashboard
          setRecentBooks(recentlyAdded);
        }
      } catch (error) {
        console.error('Failed to fetch recent books:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentBooks();
  }, []);
  
  if (loading) return null;
  if (recentBooks.length === 0) return null;
  
  return (
    <div style={{ 
      background: actualTheme === 'dark' ? '#1e293b' : 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
      marginBottom: '32px'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        marginBottom: '16px', 
        color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
      }}>
        ✨ Recently Added ({recentBooks.length})
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '12px' 
      }}>
        {recentBooks.map((book) => (
          <div 
            key={book.id}
            onClick={() => navigate('/library')}
            style={{
              padding: '10px',
              background: actualTheme === 'dark' ? '#0f172a' : '#f8fafc',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              fontSize: '13px', 
              fontWeight: '600',
              color: actualTheme === 'dark' ? '#e2e8f0' : '#0f172a',
              marginBottom: '6px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {book.title}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: actualTheme === 'dark' ? '#cbd5e1' : '#334155',
              fontWeight: '500',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              by {book.author}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: actualTheme === 'dark' ? '#64748b' : '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📅 {new Date(book.created_at || book.dateAdded).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
      
      {/* View All Link */}
      <div style={{ 
        marginTop: '16px', 
        textAlign: 'center' 
      }}>
        <button 
          onClick={() => navigate('/library')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#3b82f6',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
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
  const { actualTheme } = useMaterial3Theme();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [checkInStreak, setCheckInStreak] = useState(0);
  
  // Load check-in streak on mount
  useEffect(() => {
    console.log(' DashboardPage: useEffect for check-in streak');
    const streak = parseInt(localStorage.getItem('checkInStreak') || '0');
    setCheckInStreak(streak);
  }, []);

  return (
    <div style={{ 
      background: actualTheme === 'dark' ? '#0f172a' : '#f8fafc',
      minHeight: '100vh',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Welcome Section with Theme Toggle */}
        <WelcomeSection user={user} onCheckInUpdate={setCheckInStreak} />

      {/* Your Progress Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '16px', 
          color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
        }}>
          📊 Your Progress
        </h2>
        <QuickStatsOverview checkInStreak={checkInStreak} />
      </div>

      {/* Literary Mentor Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '16px', 
          color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
        }}>
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
      <div style={{
        background: actualTheme === 'dark'
          ? 'linear-gradient(135deg, #1e293b, #334155)'
          : 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        border: `1px solid ${actualTheme === 'dark' ? '#0ea5e9' : '#0ea5e9'}`,
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          color: actualTheme === 'dark' ? '#f1f5f9' : '#0f172a'
        }}>
          🚀 Ready to Level Up?
        </h3>
        <p style={{ 
          fontSize: '16px', 
          color: actualTheme === 'dark' ? '#94a3b8' : '#475569', 
          marginBottom: '24px' 
        }}>
          Continue your reading journey and unlock amazing achievements!
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/library')}
            style={{
              padding: '12px 32px',
              background: actualTheme === 'dark'
                ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.3)';
            }}
          >
            📚 Open Library
          </button>
          
          <button 
            onClick={() => navigate('/upload')}
            style={{
              padding: '12px 32px',
              background: 'transparent',
              color: actualTheme === 'dark' ? '#0ea5e9' : '#0ea5e9',
              border: '2px solid #0ea5e9',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(14, 165, 233, 0.1)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.transform = 'translateY(0)';
            }}
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