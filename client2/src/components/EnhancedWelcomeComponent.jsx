// src/components/EnhancedWelcomeComponent.jsx
import React, { useMemo, useState } from 'react';
import { MD3Card, MD3Button } from './Material3';
import { useGamification } from '../contexts/GamificationContext';

const EnhancedWelcomeComponent = ({ 
  books = [], 
  onNavigate, 
  analytics = {},
  className = ''
}) => {
  const [currentHour] = useState(new Date().getHours());

  // Always call the hook, but handle the case where the context might not be available
  const gamification = useGamification();
  const gamificationStats = gamification?.stats || {};
  const gamificationAvailable = !!gamification;

  // Enhanced analytics combining gamification and regular analytics
  const enhancedAnalytics = useMemo(() => {
    const totalBooks = books.length;
    const readingBooks = books.filter(book => book.isReading).length;
    const completedBooks = books.filter(book => book.status === 'completed').length;
    
    return {
      totalBooks,
      readingBooks,
      completedBooks,
      readingLevel: gamificationStats.level || analytics.level || 1,
      currentStreak: gamificationStats.readingStreak || analytics.currentStreak || 0,
      totalPoints: gamificationStats.totalPoints || 0,
      totalReadingTime: gamificationStats.totalReadingTime || analytics.totalReadingTime || 0,
      booksThisMonth: books.filter(book => {
        const bookDate = new Date(book.dateAdded || book.createdAt);
        const now = new Date();
        return bookDate.getMonth() === now.getMonth() && bookDate.getFullYear() === now.getFullYear();
      }).length
    };
  }, [books, gamificationStats, analytics]);

  // Calculate completion rate
  const completionRate = enhancedAnalytics.totalBooks > 0 
    ? Math.round((enhancedAnalytics.completedBooks / enhancedAnalytics.totalBooks) * 100) 
    : 0;

  // Get last opened book
  const lastOpenedBook = useMemo(() => {
    const readingBooks = books.filter(book => book.isReading);
    if (readingBooks.length > 0) {
      return readingBooks.sort((a, b) => 
        new Date(b.lastOpened || b.dateAdded || 0) - new Date(a.lastOpened || a.dateAdded || 0)
      )[0];
    }
    return null;
  }, [books]);

  // Get personalized greeting
  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get motivational message based on stats
  const getMotivationalMessage = () => {
    const { readingLevel, currentStreak, totalBooks, booksThisMonth } = enhancedAnalytics;
    
    if (currentStreak >= 7) {
      return `Amazing! You're on a ${currentStreak}-day reading streak! 🔥`;
    }
    if (readingLevel >= 5) {
      return `Incredible progress! You've reached level ${readingLevel}! ⭐`;
    }
    if (booksThisMonth >= 3) {
      return `You've read ${booksThisMonth} books this month! Keep it up! 📚`;
    }
    if (totalBooks >= 50) {
      return `Wow! Your library has grown to ${totalBooks} books! 📖`;
    }
    if (totalBooks >= 10) {
      return `Great collection! You have ${totalBooks} books to explore! 🎉`;
    }
    if (totalBooks > 0) {
      return `Welcome back! Ready to dive into your next great read? 📚`;
    }
    return `Welcome to ShelfQuest! Start building your personal digital library today! 🌟`;
  };

  // Quick action cards data
  const quickActions = [
    {
      icon: '📚',
      title: 'Add Book',
      description: 'Expand your library',
      action: () => onNavigate?.('add-book'),
      primary: true
    },
    {
      icon: '📊',
      title: 'View Stats',
      description: 'Track your progress',
      action: () => onNavigate?.('stats'),
      count: gamificationAvailable ? enhancedAnalytics.totalPoints : null
    },
    {
      icon: '📖',
      title: 'Continue Reading',
      description: lastOpenedBook ? lastOpenedBook.title : 'Start a book',
      action: () => onNavigate?.('reading'),
      count: enhancedAnalytics.readingBooks,
      disabled: !lastOpenedBook
    },
    {
      icon: '📁',
      title: 'Collections',
      description: 'Organize your books',
      action: () => onNavigate?.('collections')
    }
  ];

  return (
    <div className={`enhanced-welcome-component ${className}`}>
      {/* Hero Section */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgb(var(--md-sys-color-primary)) 0%, #24A8E0 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Pattern */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'9\' cy=\'9\' r=\'9\'/%3E%3Ccircle cx=\'49\' cy=\'49\' r=\'9\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Greeting */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 
              style={{
                fontSize: '32px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {getGreeting()} Reader! 👋
            </h1>
            <p 
              style={{
                fontSize: '18px',
                margin: '0',
                opacity: 0.9,
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.5
              }}
            >
              {getMotivationalMessage()}
            </p>
          </div>

          {/* Stats Row */}
          <div 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '24px', 
              justifyContent: 'center',
              marginBottom: '32px'
            }}
          >
            <div className="welcome-stat-item" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                Level {enhancedAnalytics.readingLevel}
              </p>
              <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.8 }}>Reading Level</p>
            </div>
            
            <div style={{ width: '1px', height: '64px', background: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}></div>
            
            <div className="welcome-stat-item" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {enhancedAnalytics.totalBooks}
              </p>
              <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.8 }}>Books in Library</p>
            </div>
            
            <div style={{ width: '1px', height: '64px', background: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}></div>
            
            <div className="welcome-stat-item" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {enhancedAnalytics.currentStreak} 🔥
              </p>
              <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.8 }}>Day Streak</p>
            </div>
            
            <div style={{ width: '1px', height: '64px', background: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}></div>
            
            <div className="welcome-stat-item" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {completionRate}%
              </p>
              <p style={{ fontSize: '14px', margin: '4px 0 0 0', opacity: 0.8 }}>Completion Rate</p>
            </div>
          </div>

          {/* Continue Reading Section */}
          {lastOpenedBook && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '20px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>
                📖 Continue Reading
              </h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {lastOpenedBook.cover && (
                  <img 
                    src={lastOpenedBook.cover} 
                    alt={lastOpenedBook.title}
                    style={{
                      width: '48px',
                      height: '64px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                    {lastOpenedBook.title}
                  </h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>
                    by {lastOpenedBook.author}
                  </p>
                  {lastOpenedBook.progress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        flex: 1,
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${lastOpenedBook.progress}%`,
                          height: '100%',
                          background: 'white',
                          borderRadius: '2px'
                        }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>
                        {Math.round(lastOpenedBook.progress)}%
                      </span>
                    </div>
                  )}
                </div>
                <MD3Button
                  variant="outlined"
                  onClick={() => onNavigate?.('reading')}
                  style={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Continue
                </MD3Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '20px',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          Quick Actions
        </h2>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}
        >
          {quickActions.map((action, index) => (
            <MD3Card
              key={index}
              interactive
              onClick={action.disabled ? undefined : action.action}
              style={{
                padding: '24px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.6 : 1,
                background: action.primary 
                  ? 'linear-gradient(135deg, rgba(var(--md-sys-color-primary), 0.1) 0%, rgba(var(--md-sys-color-secondary), 0.1) 100%)'
                  : 'rgb(var(--md-sys-color-surface-container))',
                border: action.primary ? '2px solid rgba(var(--md-sys-color-primary), 0.3)' : undefined
              }}
              className="quick-action-card"
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                {action.icon}
              </div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: '0 0 8px 0',
                color: 'rgb(var(--md-sys-color-on-surface))'
              }}>
                {action.title}
                {action.count !== null && action.count !== undefined && (
                  <span style={{
                    marginLeft: '8px',
                    background: 'rgb(var(--md-sys-color-primary))',
                    color: 'rgb(var(--md-sys-color-on-primary))',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {action.count}
                  </span>
                )}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                margin: '0',
                color: 'rgb(var(--md-sys-color-on-surface-variant))'
              }}>
                {action.description}
              </p>
            </MD3Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {enhancedAnalytics.booksThisMonth > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '20px',
            color: 'rgb(var(--md-sys-color-on-surface))'
          }}>
            This Month's Progress
          </h2>
          <MD3Card style={{ padding: '24px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '24px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'rgb(var(--md-sys-color-primary))' }}>
                  {enhancedAnalytics.booksThisMonth}
                </div>
                <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
                  Books Added
                </div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'rgb(var(--md-sys-color-success))' }}>
                  {enhancedAnalytics.readingBooks}
                </div>
                <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
                  Currently Reading
                </div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'rgb(var(--md-sys-color-warning))' }}>
                  {Math.floor((enhancedAnalytics.totalReadingTime || 0) / 60)}h
                </div>
                <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
                  Reading Time
                </div>
              </div>
              {gamificationAvailable && (
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#fdcb6e' }}>
                    {enhancedAnalytics.totalPoints}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
                    Points Earned
                  </div>
                </div>
              )}
            </div>
          </MD3Card>
        </div>
      )}

      {/* Reading Inspiration */}
      <div>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '20px',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          Reading Inspiration
        </h2>
        <MD3Card style={{ 
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(var(--md-sys-color-tertiary), 0.1) 0%, rgba(var(--md-sys-color-primary), 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ fontSize: '48px' }}>📚</div>
            <div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '20px', 
                fontWeight: '600',
                color: 'rgb(var(--md-sys-color-on-surface))'
              }}>
                "A reader lives a thousand lives before he dies."
              </h3>
              <p style={{ 
                margin: '0', 
                fontSize: '14px',
                color: 'rgb(var(--md-sys-color-on-surface-variant))',
                fontStyle: 'italic'
              }}>
                — George R.R. Martin
              </p>
            </div>
          </div>
        </MD3Card>
      </div>

      <style>
        {`
          .quick-action-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
          
          .welcome-stat-item {
            transition: transform 0.2s ease;
          }
          
          .welcome-stat-item:hover {
            transform: scale(1.05);
          }
          
          @media (max-width: 768px) {
            .enhanced-welcome-component .stats-row {
              flex-direction: column;
              align-items: center;
            }
            
            .enhanced-welcome-component .stats-row > div[style*="width: 1px"] {
              display: none;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EnhancedWelcomeComponent;
