// src/components/MD3StatisticsPage.jsx
import React, { useState, useEffect } from 'react';

const MD3StatisticsPage = ({ 
  books = [],
  analytics = {},
  user = {},
  className = ''
}) => {
  const [gamificationAvailable, setGamificationAvailable] = useState(false);

  useEffect(() => {
    try {
      // Check for gamification availability
      setGamificationAvailable(true);
    } catch (error) {
      console.warn('Gamification not available:', error);
      setGamificationAvailable(false);
    }
  }, []);

  // Calculate stats
  const stats = {
    totalBooks: books.length,
    readingBooks: books.filter(book => book.isReading).length,
    completedBooks: books.filter(book => book.status === 'completed').length,
    unreadBooks: books.filter(book => !book.isReading && book.status !== 'completed').length,
    readingStreak: analytics.currentStreak || 0,
    avgReadingTime: analytics.averageSessionDuration || '0 min',
    totalReadingMinutes: analytics.totalReadingTime || 0,
    totalReadingHours: Math.floor((analytics.totalReadingTime || 0) / 60),
    remainingMinutes: (analytics.totalReadingTime || 0) % 60,
    favoriteGenre: analytics.favoriteGenre || 'None',
    level: analytics.level || 1,
    totalPoints: analytics.totalPoints || 0,
    notesCreated: analytics.notesCreated || 0,
    highlightsCreated: analytics.highlightsCreated || 0
  };

  // Premium Header Component
  const PremiumStatsHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      borderRadius: '20px',
      boxShadow: '0 10px 25px rgba(102, 126, 234, 0.1)',
      padding: '2rem',
      marginBottom: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradient overlays */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <h1 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '2.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, var(--brand-gradient-start), var(--brand-gradient-end))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.2
        }}>
          📊 Reading Statistics
        </h1>
        <p style={{
          margin: 0,
          fontSize: '1.1rem',
          color: 'rgb(var(--md-sys-color-on-surface-variant, 100 116 139))',
          fontWeight: '500'
        }}>
          Track your progress, monitor reading time, and unlock achievements
        </p>
        
        {/* Quick stats in header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {[
            { label: 'Books', value: stats.totalBooks, icon: '📚' },
            { label: 'Reading', value: stats.readingBooks, icon: '📖' },
            { label: 'Completed', value: stats.completedBooks, icon: '✅' },
            { label: 'Level', value: stats.level, icon: '🏆' }
          ].map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '20px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(10px)',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span style={{ color: 'rgb(var(--md-sys-color-primary, 103 80 164))' }}>
                {item.value}
              </span>
              <span style={{ color: 'rgb(var(--md-sys-color-on-surface-variant, 100 116 139))' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Stats Grid Component
  const MD3StatsGrid = () => (
    <div style={{
      background: 'rgb(var(--md-sys-color-surface-container-low, 245 244 248))',
      borderRadius: 'var(--md-sys-shape-corner-large, 16px)',
      border: '1px solid rgb(var(--md-sys-color-outline-variant, 194 193 201))',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: 'var(--md-sys-elevation-level1, 0 1px 3px rgba(0,0,0,0.12))'
    }}>
      <h2 style={{
        margin: '0 0 1.5rem 0',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'rgb(var(--md-sys-color-on-surface, 26 26 28))',
        textAlign: 'center'
      }}>
        📈 Reading Analytics
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem'
      }}>
        {[
          { 
            title: 'Library Size', 
            value: stats.totalBooks, 
            subtitle: 'Total books',
            gradient: 'linear-gradient(135deg, var(--brand-gradient-start) 0%, var(--brand-gradient-end) 100%)',
            color: 'white'
          },
          { 
            title: 'Currently Reading', 
            value: stats.readingBooks, 
            subtitle: 'Active books',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          },
          { 
            title: 'Completed', 
            value: stats.completedBooks, 
            subtitle: `${stats.totalBooks > 0 ? Math.round((stats.completedBooks / stats.totalBooks) * 100) : 0}% of library`,
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          },
          { 
            title: 'Reading Streak', 
            value: `${stats.readingStreak} days`, 
            subtitle: 'Current streak',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          },
          { 
            title: 'Average Session', 
            value: stats.avgReadingTime, 
            subtitle: 'Per reading session',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          },
          { 
            title: 'Total Reading Time', 
            value: stats.totalReadingHours > 0 ? `${stats.totalReadingHours}h ${stats.remainingMinutes}m` : '0 hours', 
            subtitle: 'All time',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: '#333'
          },
          { 
            title: 'Favorite Genre', 
            value: stats.favoriteGenre, 
            subtitle: 'Most read category',
            gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
            color: '#333'
          },
          { 
            title: 'Completion Rate', 
            value: `${stats.totalBooks > 0 ? Math.round((stats.completedBooks / stats.totalBooks) * 100) : 0}%`, 
            subtitle: 'Books finished',
            gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
            color: 'white'
          }
        ].map((stat, index) => (
          <div key={index} style={{
            background: stat.gradient,
            color: stat.color,
            borderRadius: 'var(--md-sys-shape-corner-medium, 12px)',
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
          >
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '0.9rem', 
              opacity: 0.9,
              fontWeight: '500'
            }}>
              {stat.title}
            </h3>
            <p style={{ 
              margin: '0 0 0.25rem 0', 
              fontSize: '1.8rem', 
              fontWeight: 'bold',
              lineHeight: 1
            }}>
              {stat.value}
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '0.75rem', 
              opacity: 0.8,
              fontWeight: '400'
            }}>
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  // Goals and Badges Component
  const ReadingGoalsAndBadges = () => (
    <div style={{
      background: 'rgb(var(--md-sys-color-surface-container, 239 239 239))',
      borderRadius: 'var(--md-sys-shape-corner-large, 16px)',
      border: '1px solid rgb(var(--md-sys-color-outline-variant, 194 193 201))',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: 'var(--md-sys-elevation-level2, 0 3px 6px rgba(0,0,0,0.12))'
    }}>
      <h2 style={{
        margin: '0 0 2rem 0',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: 'rgb(var(--md-sys-color-on-surface, 26 26 28))',
        textAlign: 'center'
      }}>
        🎯 Reading Goals & Achievements
      </h2>

      {/* Goals Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Short-term Goals */}
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-gradient-start) 0%, var(--brand-gradient-end) 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 'bold' }}>
            🎯 Short-term Goals
          </h3>
          <div>
            {[
              { label: 'Daily Reading (30 min)', progress: 75 },
              { label: 'Weekly Pages (100)', progress: 60 }
            ].map((goal, index) => (
              <div key={index} style={{ marginBottom: index === 0 ? '1rem' : '0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <span>{goal.label}</span>
                  <span>{goal.progress}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${goal.progress}%`,
                    height: '100%',
                    backgroundColor: '#4CAF50',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Long-term Goals */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 'bold' }}>
            🏆 Long-term Goals
          </h3>
          <div>
            {[
              { label: 'Annual Books (50)', progress: Math.round((stats.completedBooks / 50) * 100) },
              { label: 'Reading Streak (30 days)', progress: Math.round((stats.readingStreak / 30) * 100) }
            ].map((goal, index) => (
              <div key={index} style={{ marginBottom: index === 0 ? '1rem' : '0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <span>{goal.label}</span>
                  <span>{Math.min(goal.progress, 100)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(goal.progress, 100)}%`,
                    height: '100%',
                    backgroundColor: goal.label.includes('Annual') ? '#4CAF50' : '#2196F3',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reading Badges */}
      <div>
        <h3 style={{ 
          margin: '0 0 1.5rem 0', 
          fontSize: '1.3rem', 
          fontWeight: 'bold',
          color: 'rgb(var(--md-sys-color-on-surface, 26 26 28))',
          textAlign: 'center'
        }}>
          🏅 Achievement Badges
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem'
        }}>
          {[
            { name: 'First Book', icon: '📖', earned: stats.completedBooks >= 1, description: 'Complete your first book' },
            { name: 'Speed Reader', icon: '⚡', earned: stats.avgReadingTime !== '0 min', description: 'Maintain good reading speed' },
            { name: 'Bookworm', icon: '🐛', earned: stats.completedBooks >= 5, description: 'Complete 5 books' },
            { name: 'Library Builder', icon: '🏗️', earned: stats.totalBooks >= 10, description: 'Add 10 books to library' },
            { name: 'Streak Master', icon: '🔥', earned: stats.readingStreak >= 7, description: 'Read for 7 days straight' },
            { name: 'Note Taker', icon: '📝', earned: stats.notesCreated >= 5, description: 'Create 5 reading notes' },
            { name: 'Highlighter', icon: '🖍️', earned: stats.highlightsCreated >= 10, description: 'Make 10 highlights' },
            { name: 'Dedicated Reader', icon: '🎯', earned: stats.totalReadingHours >= 10, description: 'Read for 10+ hours' }
          ].map((badge, index) => (
            <div key={index} style={{
              background: badge.earned 
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : 'rgb(var(--md-sys-color-surface-container-highest, 227 226 230))',
              color: badge.earned ? 'white' : 'rgb(var(--md-sys-color-on-surface-variant, 100 116 139))',
              borderRadius: 'var(--md-sys-shape-corner-medium, 12px)',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: badge.earned 
                ? '0 4px 12px rgba(255, 215, 0, 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.1)',
              opacity: badge.earned ? 1 : 0.7,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{badge.icon}</div>
              <h4 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.9rem', 
                fontWeight: 'bold'
              }}>
                {badge.name}
              </h4>
              <p style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '0.7rem', 
                opacity: 0.8
              }}>
                {badge.description}
              </p>
              {badge.earned && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  display: 'inline-block'
                }}>
                  ✓ Earned
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      fontFamily: 'var(--md-sys-typescale-body-large-font, "Roboto", system-ui, sans-serif)',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Background decorative gradients */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <PremiumStatsHeader />
        <MD3StatsGrid />
        {gamificationAvailable && <ReadingGoalsAndBadges />}
      </div>
    </div>
  );
};

export default MD3StatisticsPage;



