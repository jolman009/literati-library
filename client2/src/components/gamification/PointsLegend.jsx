// src/components/gamification/PointsLegend.jsx
import React, { useState } from 'react';
import { MD3Card, MD3Button } from '../Material3';
import Icon from '../ui/Icon';

const PointsLegend = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pointCategories = [
    {
      title: 'Reading Activities',
      icon: 'book',
      color: 'rgb(var(--md-sys-color-primary))',
      actions: [
        { action: 'Start Reading Session', points: 5, icon: 'rocket', description: 'Begin a new reading session' },
        { action: 'Complete Reading Session', points: 10, icon: 'check_circle', description: 'Finish a reading session' },
        { action: 'Read Page', points: 1, icon: 'page', description: 'Each page you read' },
        { action: 'Reading Time', points: '1/min', icon: 'time', description: 'One point per minute of reading' },
        { action: 'Complete Book', points: 100, icon: 'celebrate', description: 'Finish reading an entire book' },
      ]
    },
    {
      title: 'Library Management',
      icon: 'books',
      color: 'rgb(var(--md-sys-color-secondary))',
      actions: [
        { action: 'Upload Book', points: 25, icon: 'upload', description: 'Add a new book to your library' },
        { action: 'Daily Login', points: 10, icon: 'login', description: 'Sign in to your account daily' },
        { action: 'Daily Check-in', points: 10, icon: 'check', description: 'Complete your daily reading check-in' },
      ]
    },
    {
      title: 'Note-Taking & Study',
      icon: 'note',
      color: 'rgb(var(--md-sys-color-tertiary))',
      actions: [
        { action: 'Create Note', points: 15, icon: 'note', description: 'Write a note about your reading' },
        { action: 'Create Highlight', points: 10, icon: 'highlight', description: 'Highlight important text passages' },
      ]
    }
  ];

  const levelThresholds = [
    { level: 1, points: 0, title: 'Beginner Reader', icon: 'book' },
    { level: 2, points: 100, title: 'Casual Reader', icon: 'books' },
    { level: 3, points: 300, title: 'Dedicated Reader', icon: 'star' },
    { level: 4, points: 600, title: 'Avid Reader', icon: 'book' },
    { level: 5, points: 1000, title: 'Bookworm', icon: 'bolt' },
    { level: 6, points: 1500, title: 'Book Enthusiast', icon: 'book' },
    { level: 7, points: 2500, title: 'Literary Scholar', icon: 'graduate' },
    { level: 8, points: 4000, title: 'Reading Master', icon: 'crown' },
    { level: 9, points: 6000, title: 'Bibliophile', icon: 'diamond' },
    { level: 10, points: 10000, title: 'Reading Legend', icon: 'trophy' },
  ];

  const achievementCategories = [
    {
      title: 'Library Building',
      achievements: [
        { name: 'First Steps', requirement: '1 book uploaded', points: 50 },
        { name: 'Bookworm', requirement: '10 books uploaded', points: 200 },
        { name: 'Collector', requirement: '25 books uploaded', points: 500 },
        { name: 'Librarian', requirement: '50 books uploaded', points: 1000 },
      ]
    },
    {
      title: 'Reading Habits',
      achievements: [
        { name: 'Early Bird', requirement: 'Read before 8 AM', points: 75 },
        { name: 'Night Owl', requirement: 'Read after 10 PM', points: 75 },
        { name: 'Speed Reader', requirement: '100 pages in one session', points: 150 },
        { name: 'Marathon Reader', requirement: '2+ hours straight reading', points: 200 },
      ]
    },
    {
      title: 'Consistency',
      achievements: [
        { name: '3-Day Streak', requirement: 'Read 3 consecutive days', points: 100 },
        { name: 'Week Warrior', requirement: 'Read 7 consecutive days', points: 250 },
        { name: 'Monthly Master', requirement: 'Read 30 consecutive days', points: 1000 },
      ]
    },
    {
      title: 'Study & Analysis',
      achievements: [
        { name: 'Note Taker', requirement: 'Create 10 notes', points: 150 },
        { name: 'Highlighter', requirement: 'Create 25 highlights', points: 200 },
      ]
    },
    {
      title: 'Completion',
      achievements: [
        { name: 'Finisher', requirement: 'Complete 1 book', points: 100 },
        { name: 'Completionist', requirement: 'Complete 10 books', points: 500 },
      ]
    }
  ];

  if (!isExpanded) {
    return (
      <MD3Card style={{
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(var(--md-sys-color-primary), 0.05) 0%, rgba(var(--md-sys-color-secondary), 0.05) 100%)',
        border: '1px solid rgba(var(--md-sys-color-primary), 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '24px' }}><Icon name="rocket" size={20} /></div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: 'rgb(var(--md-sys-color-on-surface))'
              }}>
                Points & Rewards Guide
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '14px',
                color: 'rgb(var(--md-sys-color-on-surface-variant))'
              }}>
                Learn how to earn points and unlock achievements
              </p>
            </div>
          </div>
          <MD3Button
            variant="outlined"
            onClick={() => setIsExpanded(true)}
            style={{ minWidth: '120px' }}
          >
            View Guide
          </MD3Button>
        </div>
      </MD3Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <MD3Card style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgb(var(--md-sys-color-primary)) 0%, rgb(var(--md-sys-color-secondary)) 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="rocket" size={24} /> Points & Rewards System
            </h2>
            <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
              Everything you need to know about earning points and unlocking achievements
            </p>
          </div>
          <MD3Button
            variant="text"
            onClick={() => setIsExpanded(false)}
            style={{
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              minWidth: '100px'
            }}
          >
            Collapse
          </MD3Button>
        </div>
      </MD3Card>

      {/* Point Categories */}
      <div>
        <h3 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          How to Earn Points
        </h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          {pointCategories.map((category, index) => (
            <MD3Card key={index} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: category.color
                }}>
                  <Icon name={category.icon} size={22} />
                  {category.title}
                </h4>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {category.actions.map((action, actionIndex) => (
                  <div
                    key={actionIndex}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgb(var(--md-sys-color-surface-container))',
                      borderRadius: '12px',
                      border: '1px solid rgb(var(--md-sys-color-outline-variant))'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon name={action.icon} size={20} />
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: 'rgb(var(--md-sys-color-on-surface))'
                        }}>
                          {action.action}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'rgb(var(--md-sys-color-on-surface-variant))'
                        }}>
                          {action.description}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: category.color,
                      background: `rgba(${category.color.slice(4, -1)}, 0.1)`,
                      padding: '6px 12px',
                      borderRadius: '20px'
                    }}>
                      +{action.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </MD3Card>
          ))}
        </div>
      </div>

      {/* Level System */}
      <div>
        <h3 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          Level System
        </h3>
        <MD3Card style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {levelThresholds.map((level, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: index === 0 ? 'rgb(var(--md-sys-color-primary-container))' :
                             index === levelThresholds.length - 1 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' :
                             'rgb(var(--md-sys-color-surface-container))',
                  borderRadius: '12px',
                  border: '1px solid rgb(var(--md-sys-color-outline-variant))'
                }}
              >
                <Icon name={level.icon} size={22} />
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'rgb(var(--md-sys-color-on-surface))'
                  }}>
                    Level {level.level}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'rgb(var(--md-sys-color-on-surface-variant))',
                    marginBottom: '2px'
                  }}>
                    {level.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'rgb(var(--md-sys-color-primary))'
                  }}>
                    {level.points.toLocaleString()} points
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MD3Card>
      </div>

      {/* Achievements */}
      <div>
        <h3 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          Achievement Rewards
        </h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          {achievementCategories.map((category, index) => (
            <MD3Card key={index} style={{ padding: '20px' }}>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'rgb(var(--md-sys-color-primary))'
              }}>
                {category.title}
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {category.achievements.map((achievement, achievementIndex) => (
                  <div
                    key={achievementIndex}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      background: 'rgb(var(--md-sys-color-surface-variant))',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '500',
                        color: 'rgb(var(--md-sys-color-on-surface))'
                      }}>
                        {achievement.title || achievement.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: 'rgb(var(--md-sys-color-on-surface-variant))'
                      }}>
                        {achievement.requirement}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgb(var(--md-sys-color-primary))'
                    }}>
                      +{achievement.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </MD3Card>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <MD3Card style={{
        padding: '24px',
        background: 'linear-gradient(135deg, rgba(var(--md-sys-color-tertiary), 0.1) 0%, rgba(var(--md-sys-color-primary), 0.1) 100%)'
      }}>
        <h4 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: 'rgb(var(--md-sys-color-on-surface))'
        }}>
          <Icon name="tips" size={22} />
          Pro Tips for Maximum Points
        </h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            • <strong>Daily consistency:</strong> Log in and check in daily for steady point accumulation
          </div>
          <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            • <strong>Active reading:</strong> Take notes and create highlights while reading for bonus points
          </div>
          <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            • <strong>Reading streaks:</strong> Read consecutive days to unlock high-value streak achievements
          </div>
          <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            • <strong>Complete books:</strong> Finishing books gives substantial point bonuses
          </div>
          <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            • <strong>Build your library:</strong> Upload books regularly to unlock collection achievements
          </div>
        </div>
      </MD3Card>
    </div>
  );
};

export default PointsLegend;
