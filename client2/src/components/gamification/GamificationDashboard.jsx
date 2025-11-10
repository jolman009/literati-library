// src/components/gamification/GamificationDashboard.jsx
import React, { useState, useMemo } from 'react';
import { useGamification } from '../../contexts/GamificationContext';
import { MD3Card, MD3Button, CircularProgress } from '../Material3';
import PointsLegend from './PointsLegend';

// Achievement Notification Component
const AchievementNotification = ({ achievement, onDismiss }) => {
  if (!achievement) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, rgb(var(--md-sys-color-primary)) 0%, #24A8E0 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        zIndex: 1000,
        minWidth: '300px',
        animation: 'slideInRight 0.5s ease'
      }}
      data-testid="achievement-notification"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>🎉 Achievement Unlocked!</h3>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          data-testid="achievement-dismiss-button"
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontSize: '32px' }}>{achievement.icon}</div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>{achievement.title}</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>{achievement.description}</p>
          <div style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-block'
          }}>
            +{achievement.points} points
          </div>
        </div>
      </div>
    </div>
  );
};

// Level Progress Component
const LevelProgress = ({ stats, calculateLevel, LEVEL_THRESHOLDS }) => {
  const currentLevel = calculateLevel(stats.totalPoints);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  const progressPercentage = nextThreshold 
    ? ((stats.totalPoints - currentThreshold.points) / (nextThreshold.points - currentThreshold.points)) * 100
    : 100;

  return (
    <MD3Card className="level-progress-card" data-testid="level-progress-card">
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          background: 'linear-gradient(135deg, rgb(var(--md-sys-color-primary)) 0%, #24A8E0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          Level {currentLevel}
        </div>
        <div style={{ 
          color: 'rgb(var(--md-sys-color-on-surface-variant))', 
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {currentThreshold?.title || 'Reading Master'}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px',
          fontSize: '14px',
          color: 'rgb(var(--md-sys-color-on-surface-variant))'
        }}>
          <span>{stats.totalPoints} points</span>
          {nextThreshold && <span>{nextThreshold.points} points</span>}
        </div>
        
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgb(var(--md-sys-color-outline-variant))',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(progressPercentage, 100)}%`,
            height: '100%',
            background: 'linear-gradient(90deg, rgb(var(--md-sys-color-primary)) 0%, #24A8E0 100%)',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {nextThreshold && (
        <div style={{ 
          fontSize: '12px', 
          color: 'rgb(var(--md-sys-color-on-surface-variant))',
          textAlign: 'center'
        }}>
          {nextThreshold.points - stats.totalPoints} points to next level
        </div>
      )}
    </MD3Card>
  );
};

// Stats Grid Component
const StatsGrid = ({ stats }) => {
  const statItems = [
    { 
      label: 'Books Read', 
      value: stats.booksRead || 0, 
      icon: '📚',
      color: 'rgb(var(--md-sys-color-primary))'
    },
    { 
      label: 'Pages Read', 
      value: stats.pagesRead || 0, 
      icon: '📄',
      color: 'rgb(var(--md-sys-color-success))'
    },
    { 
      label: 'Reading Time', 
      value: `${Math.floor((stats.totalReadingTime || 0) / 60)}h`, 
      icon: '⏱️',
      color: 'rgb(var(--md-sys-color-warning))'
    },
    { 
      label: 'Reading Streak', 
      value: `${stats.readingStreak || 0} days`, 
      icon: '🔥',
      color: '#ff6b35'
    },
    { 
      label: 'Notes Created', 
      value: stats.notesCreated || 0, 
      icon: '📝',
      color: '#6c5ce7'
    },
    { 
      label: 'Highlights', 
      value: stats.highlightsCreated || 0, 
      icon: '✏️',
      color: '#fd79a8'
    },
    { 
      label: 'Books Completed', 
      value: stats.booksCompleted || 0, 
      icon: '✅',
      color: 'rgb(var(--md-sys-color-success))'
    },
    { 
      label: 'Current Level', 
      value: stats.level || 1, 
      icon: '⭐',
      color: '#fdcb6e'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '16px'
    }}>
      {statItems.map((item, index) => (
        <MD3Card key={index} className="stat-item-card" data-testid={`stat-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '4px',
              color: item.color
            }}>
              {item.value}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgb(var(--md-sys-color-on-surface-variant))',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}>
              {item.label}
            </div>
          </div>
        </MD3Card>
      ))}
    </div>
  );
};

// Goals Section Component
const GoalsSection = ({ goals }) => {
  if (!goals || goals.length === 0) {
    return (
      <MD3Card>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>🎯</div>
          <h3 style={{ margin: '0 0 8px 0', color: 'rgb(var(--md-sys-color-on-surface))' }}>No Goals Set</h3>
          <p style={{ margin: '0', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            Goals will be automatically created based on your reading progress
          </p>
        </div>
      </MD3Card>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px'
    }}>
      {goals.map((goal, index) => {
        const progress = Math.min((goal.current / goal.target) * 100, 100);
        const isCompleted = goal.current >= goal.target;
        
        return (
          <MD3Card key={index} className="goal-card" data-testid="goal-card">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: 'rgb(var(--md-sys-color-on-surface))'
                }}>
                  {goal.title}
                </h4>
                {isCompleted && <span style={{ fontSize: '20px' }}>🎉</span>}
              </div>
              <p style={{ 
                margin: '0 0 12px 0', 
                fontSize: '14px',
                color: 'rgb(var(--md-sys-color-on-surface-variant))'
              }}>
                {goal.description}
              </p>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <span style={{ color: 'rgb(var(--md-sys-color-on-surface))' }}>
                  {goal.current} / {goal.target}
                </span>
                <span style={{ color: isCompleted ? 'rgb(var(--md-sys-color-success))' : 'rgb(var(--md-sys-color-primary))' }}>
                  {Math.round(progress)}%
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgb(var(--md-sys-color-outline-variant))',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: isCompleted 
                    ? 'rgb(var(--md-sys-color-success))' 
                    : 'linear-gradient(90deg, rgb(var(--md-sys-color-primary)) 0%, #24A8E0 100%)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {goal.deadline && (
              <div style={{ 
                fontSize: '12px', 
                color: 'rgb(var(--md-sys-color-on-surface-variant))'
              }}>
                Due: {new Date(goal.deadline).toLocaleDateString()}
              </div>
            )}

            {goal.points && (
              <div style={{ 
                marginTop: '12px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgb(var(--md-sys-color-primary))'
              }}>
                Reward: {goal.points} points
              </div>
            )}
          </MD3Card>
        );
      })}
    </div>
  );
};

// Achievements Section Component
const AchievementsSection = ({ achievements, ACHIEVEMENTS }) => {
  const [showAll, setShowAll] = useState(false);
  
  const allAchievements = Object.values(ACHIEVEMENTS);
  const unlockedIds = new Set(achievements.map(a => a.id));
  
  const displayAchievements = showAll ? allAchievements : allAchievements.slice(0, 6);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          margin: 0,
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          Achievements ({achievements.length}/{allAchievements.length})
        </h2>
        <MD3Button 
          variant="outlined" 
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : 'Show All'}
        </MD3Button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        {displayAchievements.map((achievement) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          
          return (
            <MD3Card 
              key={achievement.id} 
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              style={{
                opacity: isUnlocked ? 1 : 0.6,
                background: isUnlocked 
                  ? 'linear-gradient(135deg, rgba(var(--md-sys-color-primary), 0.1) 0%, rgba(var(--md-sys-color-secondary), 0.1) 100%)'
                  : 'rgb(var(--md-sys-color-surface-container))',
                border: isUnlocked ? '2px solid rgb(var(--md-sys-color-primary))' : '1px solid rgb(var(--md-sys-color-outline-variant))'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ 
                  fontSize: '32px', 
                  filter: isUnlocked ? 'none' : 'grayscale(1)' 
                }}>
                  {achievement.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: 'rgb(var(--md-sys-color-on-surface))'
                    }}>
                      {achievement.title}
                    </h4>
                    {isUnlocked && <span style={{ fontSize: '16px' }}>✅</span>}
                  </div>
                  <p style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '14px',
                    color: 'rgb(var(--md-sys-color-on-surface-variant))'
                  }}>
                    {achievement.description}
                  </p>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: isUnlocked ? 'rgb(var(--md-sys-color-primary))' : 'rgb(var(--md-sys-color-on-surface-variant))'
                  }}>
                    {achievement.points} points
                  </div>
                </div>
              </div>
            </MD3Card>
          );
        })}
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = ({ trackAction }) => {
  const actions = [
    {
      icon: '📚',
      label: 'Add Book',
      action: () => trackAction('quick_add_book'),
      type: 'primary'
    },
    {
      icon: '📖',
      label: 'Start Reading',
      action: () => trackAction('quick_start_reading'),
      type: 'secondary'
    },
    {
      icon: '📝',
      label: 'Add Note',
      action: () => trackAction('quick_add_note'),
      type: 'tertiary'
    },
    {
      icon: '🎯',
      label: 'Set Goal',
      action: () => trackAction('quick_set_goal'),
      type: 'outlined'
    }
  ];

  return (
    <MD3Card style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Quick Actions</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px'
      }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            style={{
              padding: '16px 12px',
              border: action.type === 'outlined' ? '1px solid rgb(var(--md-sys-color-outline))' : 'none',
              borderRadius: '12px',
              background: action.type === 'primary' ? 'rgb(var(--md-sys-color-primary))' :
                         action.type === 'secondary' ? 'rgb(var(--md-sys-color-secondary))' :
                         action.type === 'tertiary' ? 'rgb(var(--md-sys-color-tertiary))' :
                         'transparent',
              color: action.type === 'outlined' ? 'rgb(var(--md-sys-color-on-surface))' :
                     'rgb(var(--md-sys-color-on-primary))',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <span style={{ fontSize: '24px' }}>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </MD3Card>
  );
};

// Reading Tips Component
const ReadingTips = () => {
  const tips = [
    "Set aside 20 minutes each day for reading to build a consistent habit.",
    "Try the Pomodoro technique: read for 25 minutes, then take a 5-minute break.",
    "Keep a reading journal to track your thoughts and favorite quotes.",
    "Join online book communities to discover new titles and discuss your reads.",
    "Set reading goals that challenge but don't overwhelm you.",
    "Create a dedicated reading space free from distractions."
  ];

  const [currentTip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  return (
    <MD3Card style={{ 
      padding: '24px',
      background: 'linear-gradient(135deg, rgba(var(--md-sys-color-primary), 0.05) 0%, rgba(var(--md-sys-color-secondary), 0.05) 100%)'
    }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '32px' }}>💡</div>
        <div>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: 'rgb(var(--md-sys-color-primary))'
          }}>
            Reading Tip
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '14px',
            color: 'rgb(var(--md-sys-color-on-surface))',
            lineHeight: 1.5
          }}>
            {currentTip}
          </p>
        </div>
      </div>
    </MD3Card>
  );
};

// Main Gamification Dashboard Component
const GamificationDashboard = () => {
  const { 
    stats, 
    goals, 
    achievements, 
    loading, 
    recentAchievement,
    dismissRecentAchievement,
    trackAction,
    ACHIEVEMENTS,
    LEVEL_THRESHOLDS,
    calculateLevel
  } = useGamification();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        gap: '16px'
      }}>
        <CircularProgress size="large" />
        <p style={{ 
          color: 'rgb(var(--md-sys-color-on-surface-variant))',
          fontSize: '16px'
        }}>
          Loading your reading progress...
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Achievement Notification */}
      <AchievementNotification 
        achievement={recentAchievement}
        onDismiss={dismissRecentAchievement}
      />

      {/* Level Progress */}
      <div style={{ marginBottom: '32px' }}>
        <LevelProgress 
          stats={stats}
          calculateLevel={calculateLevel}
          LEVEL_THRESHOLDS={LEVEL_THRESHOLDS}
        />
      </div>

      {/* Stats Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          Your Reading Stats
        </h2>
        <StatsGrid stats={stats} />
      </div>

      {/* Goals Section */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          Active Goals
        </h2>
        <GoalsSection goals={goals} />
      </div>

      {/* Achievements Section */}
      <div style={{ marginBottom: '32px' }}>
        <AchievementsSection 
          achievements={achievements}
          ACHIEVEMENTS={ACHIEVEMENTS}
        />
      </div>

      {/* Points Legend */}
      <div style={{ marginBottom: '32px' }}>
        <PointsLegend />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <QuickActions trackAction={trackAction} />
      </div>

      {/* Reading Tips */}
      <ReadingTips />

      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .achievement-card {
            transition: all 0.3s ease;
          }
          
          .achievement-card:hover {
            transform: translateY(-2px);
          }
          
          .goal-card {
            transition: all 0.3s ease;
          }
          
          .goal-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
          
          .stat-item-card {
            transition: all 0.3s ease;
          }
          
          .stat-item-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
          
          .level-progress-card {
            background: linear-gradient(135deg, rgba(var(--md-sys-color-primary), 0.05) 0%, rgba(var(--md-sys-color-secondary), 0.05) 100%);
            border: 2px solid rgba(var(--md-sys-color-primary), 0.2);
          }
        `}
      </style>
    </div>
  );
};

export default GamificationDashboard;
