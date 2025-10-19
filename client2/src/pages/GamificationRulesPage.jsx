// src/pages/GamificationRulesPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MD3Card, MD3Button } from '../components/Material3';
import { useGamification } from '../contexts/GamificationContext';
import '../styles/gamification-enhanced.css';

const GamificationRulesPage = () => {
  const navigate = useNavigate();
  const { stats, LEVEL_THRESHOLDS } = useGamification();
  const [activeSection, setActiveSection] = useState('overview');

  const pointCategories = [
    {
      title: 'Reading Activities',
      icon: '📖',
      color: 'rgb(var(--md-sys-color-primary))',
      actions: [
        { action: 'Start Reading Session', points: 5, icon: '🚀', description: 'Begin a new reading session' },
        { action: 'Complete Reading Session', points: 10, icon: '✅', description: 'Finish a reading session' },
        { action: 'Read Page', points: 1, icon: '📄', description: 'Each page you read' },
        { action: 'Reading Time', points: '1/min', icon: '⏱️', description: 'One point per minute of reading' },
        { action: 'Complete Book', points: 100, icon: '🎉', description: 'Finish reading an entire book' },
      ]
    },
    {
      title: 'Library Management',
      icon: '📚',
      color: 'rgb(var(--md-sys-color-secondary))',
      actions: [
        { action: 'Upload Book', points: 25, icon: '📤', description: 'Add a new book to your library' },
        { action: 'Daily Login', points: 10, icon: '🌅', description: 'Sign in to your account daily' },
        { action: 'Daily Check-in', points: 10, icon: '✔️', description: 'Complete your daily reading check-in' },
      ]
    },
    {
      title: 'Note-Taking & Study',
      icon: '📝',
      color: 'rgb(var(--md-sys-color-tertiary))',
      actions: [
        { action: 'Create Note', points: 15, icon: '📋', description: 'Write a note about your reading' },
        { action: 'Create Highlight', points: 10, icon: '✏️', description: 'Highlight important text passages' },
      ]
    }
  ];

  const achievementCategories = [
    {
      title: 'Library Building',
      achievements: [
        { name: 'First Steps', requirement: '1 book uploaded', points: 50, icon: '📚' },
        { name: 'Bookworm', requirement: '10 books uploaded', points: 200, icon: '🐛' },
        { name: 'Collector', requirement: '25 books uploaded', points: 500, icon: '📖' },
        { name: 'Librarian', requirement: '50 books uploaded', points: 1000, icon: '📚' },
      ]
    },
    {
      title: 'Reading Habits',
      achievements: [
        { name: 'Early Bird', requirement: 'Read before 8 AM', points: 75, icon: '🌅' },
        { name: 'Night Owl', requirement: 'Read after 10 PM', points: 75, icon: '🦉' },
        { name: 'Speed Reader', requirement: '100 pages in one session', points: 150, icon: '⚡' },
        { name: 'Marathon Reader', requirement: '2+ hours straight reading', points: 200, icon: '🏃' },
      ]
    },
    {
      title: 'Consistency',
      achievements: [
        { name: '3-Day Streak', requirement: 'Read 3 consecutive days', points: 100, icon: '🔥' },
        { name: 'Week Warrior', requirement: 'Read 7 consecutive days', points: 250, icon: '🔥' },
        { name: 'Monthly Master', requirement: 'Read 30 consecutive days', points: 1000, icon: '🔥' },
      ]
    },
    {
      title: 'Study & Analysis',
      achievements: [
        { name: 'Note Taker', requirement: 'Create 10 notes', points: 150, icon: '📝' },
        { name: 'Highlighter', requirement: 'Create 25 highlights', points: 200, icon: '✏️' },
      ]
    },
    {
      title: 'Completion',
      achievements: [
        { name: 'Finisher', requirement: 'Complete 1 book', points: 100, icon: '✅' },
        { name: 'Completionist', requirement: 'Complete 10 books', points: 500, icon: '🏆' },
      ]
    }
  ];

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '🎯' },
    { id: 'points', label: 'Earning Points', icon: '💎' },
    { id: 'levels', label: 'Level System', icon: '⭐' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'tips', label: 'Pro Tips', icon: '💡' },
  ];

  const getCurrentLevel = () => {
    const currentPoints = stats?.totalPoints || 0;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (currentPoints >= LEVEL_THRESHOLDS[i].points) {
        return LEVEL_THRESHOLDS[i];
      }
    }
    return LEVEL_THRESHOLDS[0];
  };

  const renderOverview = () => (
    <div className="gamification-overview-section">
      <MD3Card className="gamification-hero-card">
        <h1 className="gamification-hero-title">
          🎮 Gamification System
        </h1>
        <p className="gamification-hero-subtitle">
          Turn your reading journey into an engaging adventure with points, levels, and achievements!
        </p>
        <div className="gamification-overview-stats">
          <div className="gamification-stat-item">
            <div className="gamification-stat-value">{stats?.totalPoints || 0}</div>
            <div className="gamification-stat-label">Total Points</div>
          </div>
          <div className="gamification-stat-item">
            <div className="gamification-stat-value">{stats?.level || 1}</div>
            <div className="gamification-stat-label">Current Level</div>
          </div>
          <div className="gamification-stat-item">
            <div className="gamification-stat-value">{stats?.booksRead || 0}</div>
            <div className="gamification-stat-label">Books Read</div>
          </div>
        </div>
      </MD3Card>

      <div className="gamification-overview-grid">
        <MD3Card className="gamification-feature-card">
          <h3 className="gamification-feature-title">
            💎 <span>Earn Points</span>
          </h3>
          <p className="gamification-feature-description">
            Complete reading activities to earn points. Every page read, note created, and book finished contributes to your total.
          </p>
          <MD3Button variant="outlined" onClick={() => setActiveSection('points')}>
            View Point System
          </MD3Button>
        </MD3Card>

        <MD3Card className="gamification-feature-card">
          <h3 className="gamification-feature-title">
            ⭐ <span>Level Up</span>
          </h3>
          <p className="gamification-feature-description">
            Progress through 10 reading levels, from Beginner Reader to Reading Legend. Each level unlocks new achievements.
          </p>
          <MD3Button variant="outlined" onClick={() => setActiveSection('levels')}>
            View Levels
          </MD3Button>
        </MD3Card>

        <MD3Card className="gamification-feature-card">
          <h3 className="gamification-feature-title">
            🏆 <span>Unlock Achievements</span>
          </h3>
          <p className="gamification-feature-description">
            Complete specific reading challenges to unlock badges and earn bonus points. From first steps to reading mastery.
          </p>
          <MD3Button variant="outlined" onClick={() => setActiveSection('achievements')}>
            View Achievements
          </MD3Button>
        </MD3Card>
      </div>
    </div>
  );

  const renderPoints = () => (
    <div className="gamification-points-section">
      <div className="gamification-section-header-container">
        <h2 className="gamification-section-header">💎 How to Earn Points</h2>
        <p className="gamification-section-subtitle">
          Every reading activity you complete earns you points toward your next level
        </p>
      </div>

      {pointCategories.map((category, index) => (
        <MD3Card key={index} className={`gamification-category-card gamification-category-${category.title.toLowerCase().replace(/[^a-z]/g, '')}`}>
          <h3 className="gamification-category-title" style={{ color: category.color }}>
            <span style={{ fontSize: '24px' }}>{category.icon}</span>
            {category.title}
          </h3>
          <div className="gamification-actions-grid">
            {category.actions.map((action, actionIndex) => (
              <div key={actionIndex} className="gamification-action-item">
                <div className="gamification-action-info">
                  <span className="gamification-action-icon">{action.icon}</span>
                  <div>
                    <div className="gamification-action-name">
                      {action.action}
                    </div>
                    <div className="gamification-action-description">
                      {action.description}
                    </div>
                  </div>
                </div>
                <div className="gamification-point-badge" style={{
                  color: category.color,
                  background: `rgba(${category.color.slice(4, -1)}, 0.1)`
                }}>
                  +{action.points} pts
                </div>
              </div>
            ))}
          </div>
        </MD3Card>
      ))}
    </div>
  );

  const renderLevels = () => (
    <div className="gamification-levels-section">
      <div className="gamification-section-header-container">
        <h2 className="gamification-section-header">⭐ Level System</h2>
        <p className="gamification-section-subtitle">
          Progress through 10 levels by earning points. Each level represents your reading mastery.
        </p>
      </div>

      <div className="gamification-levels-grid">
        {LEVEL_THRESHOLDS.map((level, index) => {
          const isCurrentLevel = getCurrentLevel().level === level.level;
          const isCompleted = (stats?.totalPoints || 0) >= level.points;

          return (
            <MD3Card
              key={index}
              style={{
                padding: '20px',
                background: isCurrentLevel
                  ? 'linear-gradient(135deg, rgb(var(--md-sys-color-primary)) 0%, rgb(var(--md-sys-color-secondary)) 100%)'
                  : isCompleted
                  ? 'rgb(var(--md-sys-color-primary-container))'
                  : 'rgb(var(--md-sys-color-surface-container))',
                color: isCurrentLevel ? 'white' : 'rgb(var(--md-sys-color-on-surface))',
                border: isCurrentLevel ? '2px solid transparent' : '1px solid rgb(var(--md-sys-color-outline-variant))',
                position: 'relative'
              }}
            >
              {isCurrentLevel && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#ffd700',
                  color: '#000',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ★
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {level.level === 1 ? '📖' :
                   level.level === 10 ? '👑' :
                   level.level >= 8 ? '💎' :
                   level.level >= 5 ? '🏆' : '⭐'}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}>
                  Level {level.level}
                </div>
                <div style={{
                  fontSize: '14px',
                  marginBottom: '8px',
                  opacity: isCurrentLevel ? 0.9 : 0.7
                }}>
                  {level.level === 1 ? 'Beginner Reader' :
                   level.level === 2 ? 'Casual Reader' :
                   level.level === 3 ? 'Dedicated Reader' :
                   level.level === 4 ? 'Avid Reader' :
                   level.level === 5 ? 'Bookworm' :
                   level.level === 6 ? 'Book Enthusiast' :
                   level.level === 7 ? 'Literary Scholar' :
                   level.level === 8 ? 'Reading Master' :
                   level.level === 9 ? 'Bibliophile' :
                   'Reading Legend'}
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: isCurrentLevel ? 0.9 : 0.6
                }}>
                  {level.points.toLocaleString()} points
                </div>
              </div>
            </MD3Card>
          );
        })}
      </div>
    </div>
  );

  const renderBehavior = () => (
    <div className="gamification-behavior-section">
      <div className="gamification-section-header-container">
        <h2 className="gamification-section-header">⏱️ Reading Session Behavior</h2>
        <p className="gamification-section-subtitle">
          How starting, stopping, and resuming sessions affect points and your Currently Reading list
        </p>
      </div>

      <MD3Card className="gamification-feature-card">
        <h3 className="gamification-feature-title">▶️ Start Reading</h3>
        <p className="gamification-feature-description">
          Starting a session marks the book as <strong>currently reading</strong> and begins tracking time. You earn +5 points on start, and you’ll keep earning points as you read (1 point per minute, 1 per page if tracked).
        </p>
      </MD3Card>

      <MD3Card className="gamification-feature-card">
        <h3 className="gamification-feature-title">⏸️ Stop (Pause) Reading</h3>
        <p className="gamification-feature-description">
          Stopping a session ends the timer but keeps the book marked as <strong>currently reading</strong> (status: paused). This way it remains in your Dashboard’s <em>Currently Reading</em> list until you resume or mark it completed.
        </p>
        <p className="gamification-feature-description">
          You earn +10 points for completing a session plus time read points. No points accrue while paused.
        </p>
      </MD3Card>

      <MD3Card className="gamification-feature-card">
        <h3 className="gamification-feature-title">🔁 Resume Reading</h3>
        <p className="gamification-feature-description">
          Resuming starts a new session and continues awarding time/page points. The book stays in <em>Currently Reading</em> the entire time.
        </p>
      </MD3Card>

      <MD3Card className="gamification-feature-card">
        <h3 className="gamification-feature-title">🏁 Complete Book</h3>
        <p className="gamification-feature-description">
          Marking a book as completed removes it from <em>Currently Reading</em> and awards +100 points.
        </p>
      </MD3Card>
    </div>
  );

  const renderAchievements = () => (
    <div className="gamification-achievements-section">
      <div className="gamification-section-header-container">
        <h2 className="gamification-section-header">🏆 Achievement System</h2>
        <p className="gamification-section-subtitle">
          Complete specific challenges to unlock achievements and earn bonus points
        </p>
      </div>

      {achievementCategories.map((category, index) => (
        <MD3Card key={index} className="gamification-achievement-category-card">
          <h3 className="gamification-achievement-category-title">
            {category.title}
          </h3>
          <div className="gamification-achievements-grid">
            {category.achievements.map((achievement, achievementIndex) => (
              <div key={achievementIndex} className="gamification-achievement-item">
                <div className="gamification-achievement-header">
                  <span className="gamification-achievement-icon">{achievement.icon}</span>
                  <div>
                    <div className="gamification-achievement-name">
                      {achievement.title || achievement.name}
                    </div>
                    <div className="gamification-achievement-requirement">
                      {achievement.requirement}
                    </div>
                  </div>
                </div>
                <div className="gamification-achievement-points">
                  +{achievement.points} points
                </div>
              </div>
            ))}
          </div>
        </MD3Card>
      ))}
    </div>
  );

  const renderTips = () => (
    <div className="gamification-tips-section">
      <div className="gamification-section-header-container">
        <h2 className="gamification-section-header">💡 Pro Tips</h2>
        <p className="gamification-section-subtitle">
          Maximize your points and level up faster with these expert strategies
        </p>
      </div>

      <div className="gamification-tips-grid">
        {[
          {
            title: 'Daily Consistency',
            tip: 'Log in and check in daily for steady point accumulation',
            icon: '📅',
            points: '20+ points daily'
          },
          {
            title: 'Active Reading',
            tip: 'Take notes and create highlights while reading for bonus points',
            icon: '✏️',
            points: '25+ points per session'
          },
          {
            title: 'Reading Streaks',
            tip: 'Read consecutive days to unlock high-value streak achievements',
            icon: '🔥',
            points: '100-1000 bonus points'
          },
          {
            title: 'Complete Books',
            tip: 'Finishing books gives substantial point bonuses',
            icon: '📚',
            points: '100 points per book'
          },
          {
            title: 'Build Your Library',
            tip: 'Upload books regularly to unlock collection achievements',
            icon: '📤',
            points: '25+ points per upload'
          },
          {
            title: 'Time-Based Bonuses',
            tip: 'Read during off-peak hours (early morning/late night) for achievement bonuses',
            icon: '⏰',
            points: '75 bonus points'
          }
        ].map((tip, index) => (
          <MD3Card key={index} className="gamification-tip-card">
            <div className="gamification-tip-content">
              <span className="gamification-tip-icon">{tip.icon}</span>
              <div className="gamification-tip-details">
                <h4 className="gamification-tip-title">
                  {tip.title}
                </h4>
                <p className="gamification-tip-description">
                  {tip.tip}
                </p>
                <div className="gamification-tip-points">
                  {tip.points}
                </div>
              </div>
            </div>
          </MD3Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'points': return renderPoints();
      case 'levels': return renderLevels();
      case 'achievements': return renderAchievements();
      case 'behavior': return renderBehavior();
      case 'tips': return renderTips();
      default: return renderOverview();
    }
  };

  return (
    <div className="gamification-page">
      {/* Header with Navigation */}
      <div className="gamification-page-header">
        <div>
          <h1 className="gamification-page-title">
            🎮 Gamification Rules
          </h1>
          <p className="gamification-page-subtitle">
            Everything you need to know about earning points and leveling up
          </p>
        </div>
        <MD3Button
          className="gamification-back-button"
          variant="outlined"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </MD3Button>
      </div>

      {/* Section Navigation */}
      <div className="gamification-nav-container">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`gamification-nav-button ${activeSection === item.id ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default GamificationRulesPage;
