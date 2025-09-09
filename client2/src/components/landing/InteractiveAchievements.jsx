import React, { useState, useEffect } from 'react';

const InteractiveAchievements = () => {
  const celebrateAchievement = (e) => {
    const badge = e.currentTarget;
    badge.classList.add('celebrating');
    
    // Create floating +XP animation
    const xpElement = document.createElement('div');
    xpElement.textContent = '+' + (Math.floor(Math.random() * 100) + 50) + ' XP';
    xpElement.className = 'floating-xp';
    
    badge.style.position = 'relative';
    badge.appendChild(xpElement);
    
    // Remove elements after animation
    setTimeout(() => {
      badge.classList.remove('celebrating');
      if (xpElement.parentNode) {
        xpElement.remove();
      }
    }, 2000);
  };

  const showLockedAchievement = (e) => {
    const badge = e.currentTarget;
    badge.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
      badge.style.animation = '';
    }, 500);
  };

  // Animate progress bar on mount
  useEffect(() => {
    setTimeout(() => {
      const progressBar = document.querySelector('.progress-fill');
      if (progressBar) {
        progressBar.style.width = '82%';
      }
    }, 1000);
  }, []);

  return (
    <section className="gamification-section" style={{
      padding: '5rem 2rem',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      position: 'relative'
    }}>
      <div className="section-container">
        <div className="gamification-content" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h2 className="section-title">Level Up Your Reading</h2>
            <p className="section-subtitle">
              Experience the motivation of game-like progression as you advance through 10 reader levels and unlock exclusive achievements.
            </p>
            
            <div className="features-grid" style={{gridTemplateColumns: '1fr', gap: '1.5rem'}}>
              <div className="feature-card" style={{
                background: 'var(--md-sys-color-surface-container)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                cursor: 'default'
              }}>
                <h4 style={{marginBottom: '1rem', color: '#2563eb', fontSize: '1.125rem', fontWeight: '600'}}>
                  🏆 Achievement System
                </h4>
                <p style={{margin: 0, color: 'var(--md-sys-color-on-surface)', opacity: 0.8}}>
                  From "First Steps" to "Reading Legend" - unlock meaningful badges that celebrate your reading milestones and motivate continuous progress.
                </p>
              </div>
              <div className="feature-card" style={{
                background: 'var(--md-sys-color-surface-container)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                cursor: 'default'
              }}>
                <h4 style={{marginBottom: '1rem', color: '#2563eb', fontSize: '1.125rem', fontWeight: '600'}}>
                  📈 Smart Streaks
                </h4>
                <p style={{margin: 0, color: 'var(--md-sys-color-on-surface)', opacity: 0.8}}>
                  Build powerful reading habits with streak tracking, bonus points for consistency, and personalized challenges that adapt to your schedule.
                </p>
              </div>
              <div className="feature-card" style={{
                background: 'var(--md-sys-color-surface-container)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                cursor: 'default'
              }}>
                <h4 style={{marginBottom: '1rem', color: '#2563eb', fontSize: '1.125rem', fontWeight: '600'}}>
                  🎯 Dynamic Goals
                </h4>
                <p style={{margin: 0, color: 'var(--md-sys-color-on-surface)', opacity: 0.8}}>
                  Auto-generated reading goals based on your progress, plus custom challenges that push you to explore new genres and reading depths.
                </p>
              </div>
            </div>
          </div>

          <div className="gamification-visual" style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
          }}>
            <div className="level-progress" style={{marginBottom: '2rem'}}>
              <div className="level-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span className="level-title" style={{
                  fontWeight: '600',
                  color: '#2563eb',
                  fontSize: '1.125rem'
                }}>
                  Level 7: Dedicated Reader
                </span>
                <span className="level-points" style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  color: 'var(--md-sys-color-on-surface)'
                }}>
                  2,450 / 3,000 XP
                </span>
              </div>
              <div className="progress-bar" style={{
                height: '8px',
                background: '#d4d4d8',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div className="progress-fill" style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563eb, #059669)',
                  width: '65%',
                  transition: 'width 1s ease',
                  borderRadius: '4px',
                  position: 'relative'
                }}></div>
              </div>
            </div>

            <h4 style={{marginBottom: '1rem', color: 'var(--md-sys-color-on-surface)', fontWeight: '600'}}>
              Recent Achievements 
              <span style={{fontSize: '0.75rem', opacity: '0.6', fontWeight: 'normal'}}>
                (click to interact)
              </span>
            </h4>
            <div className="achievements-preview" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              <div 
                className="achievement-badge unlocked" 
                onClick={celebrateAchievement}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                Speed Reader
                <div className="achievement-tooltip" style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease',
                  zIndex: 20,
                  fontWeight: 'normal',
                  lineHeight: 1.4,
                  maxWidth: '200px',
                  whiteSpace: 'normal',
                  textAlign: 'center'
                }}>
                  Read 50 pages in one session<br />+100 XP
                </div>
              </div>
              
              <div 
                className="achievement-badge unlocked" 
                onClick={celebrateAchievement}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                Note Master
                <div className="achievement-tooltip" style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease',
                  zIndex: 20,
                  fontWeight: 'normal',
                  lineHeight: 1.4,
                  maxWidth: '200px',
                  whiteSpace: 'normal',
                  textAlign: 'center'
                }}>
                  Create 25 annotations<br />+75 XP
                </div>
              </div>
              
              <div 
                className="achievement-badge unlocked" 
                onClick={celebrateAchievement}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                Week Warrior
                <div className="achievement-tooltip" style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease',
                  zIndex: 20,
                  fontWeight: 'normal',
                  lineHeight: 1.4,
                  maxWidth: '200px',
                  whiteSpace: 'normal',
                  textAlign: 'center'
                }}>
                  Read 7 days in a row<br />+150 XP
                </div>
              </div>
              
              <div 
                className="achievement-badge locked" 
                onClick={showLockedAchievement}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                Genre Explorer
                <div className="achievement-tooltip" style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease',
                  zIndex: 20,
                  fontWeight: 'normal',
                  lineHeight: 1.4,
                  maxWidth: '200px',
                  whiteSpace: 'normal',
                  textAlign: 'center'
                }}>
                  Read 5 different genres<br />Progress: 3/5 genres
                </div>
              </div>
              
              <div 
                className="achievement-badge unlocked" 
                onClick={celebrateAchievement}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                Page Turner
                <div className="achievement-tooltip" style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease',
                  zIndex: 20,
                  fontWeight: 'normal',
                  lineHeight: 1.4,
                  maxWidth: '200px',
                  whiteSpace: 'normal',
                  textAlign: 'center'
                }}>
                  Read 100 total pages<br />+50 XP
                </div>
              </div>
              
              <div 
                className="achievement-badge locked" 
                onClick={showLockedAchievement}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  userSelect: 'none'
                }}
              >
                Book Finisher
                <div className="achievement-tooltip" style={{
                  position: 'absolute',
                  bottom: '120%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease',
                  zIndex: 20,
                  fontWeight: 'normal',
                  lineHeight: 1.4,
                  maxWidth: '200px',
                  whiteSpace: 'normal',
                  textAlign: 'center'
                }}>
                  Complete your first book<br />Progress: 87% of current book
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveAchievements;