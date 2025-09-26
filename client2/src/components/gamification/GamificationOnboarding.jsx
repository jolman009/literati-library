// src/components/gamification/GamificationOnboarding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MD3Card, MD3Button } from '../Material3';
import { useGamification } from '../../contexts/GamificationContext';

const GamificationOnboarding = ({ onComplete, canSkip = true }) => {
  const navigate = useNavigate();
  const { stats } = useGamification();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already seen onboarding
    const hasSeenOnboarding = localStorage.getItem('literati-onboarding-completed');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  // Listen for custom events to show tutorial
  useEffect(() => {
    const handleShowTutorial = () => {
      setCurrentStep(0);
      setIsVisible(true);
    };

    window.addEventListener('showTutorial', handleShowTutorial);
    return () => window.removeEventListener('showTutorial', handleShowTutorial);
  }, []);

  const onboardingSteps = [
    {
      title: "Welcome to Literati Rewards! 🎮",
      subtitle: "Turn reading into an adventure",
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
          <p style={{ fontSize: '18px', marginBottom: '24px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            Literati's gamification system rewards every page you read, note you take, and book you complete.
            Let's show you how to maximize your reading journey!
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '24px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💎</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Earn Points</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Level Up</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏅</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>Unlock Achievements</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Earning Points is Simple 📈",
      subtitle: "Every reading activity counts",
      content: (
        <div>
          <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
            {[
              { action: 'Read a page', points: '1 point', icon: '📄' },
              { action: 'Complete reading session', points: '10 points', icon: '✅' },
              { action: 'Take notes', points: '15 points', icon: '📝' },
              { action: 'Upload a book', points: '25 points', icon: '📤' },
              { action: 'Finish a book', points: '100 points', icon: '🎉' },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgb(var(--md-sys-color-surface-container))',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ fontSize: '16px' }}>{item.action}</span>
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgb(var(--md-sys-color-primary))',
                  background: 'rgb(var(--md-sys-color-primary-container))',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>
                  +{item.points}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))', textAlign: 'center' }}>
            💡 Pro tip: Reading consistently and taking notes maximizes your points!
          </p>
        </div>
      )
    },
    {
      title: "Level Up Your Reading 🚀",
      subtitle: "Progress through 10 reading levels",
      content: (
        <div>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgb(var(--md-sys-color-primary-container))',
              padding: '12px 20px',
              borderRadius: '20px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '24px' }}>⭐</span>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>Level {stats?.level || 1}</span>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>({stats?.totalPoints || 0} points)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <div
                key={level}
                style={{
                  textAlign: 'center',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  background: (stats?.level || 1) >= level
                    ? 'rgb(var(--md-sys-color-primary-container))'
                    : 'rgb(var(--md-sys-color-surface-variant))',
                  opacity: (stats?.level || 1) >= level ? 1 : 0.5
                }}
              >
                <div style={{ fontSize: '16px' }}>
                  {level === 10 ? '👑' : level >= 8 ? '💎' : level >= 5 ? '🏆' : '⭐'}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '500' }}>{level}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))', textAlign: 'center' }}>
            Each level unlocks new achievements and recognition for your reading mastery!
          </p>
        </div>
      )
    },
    {
      title: "Unlock Achievements 🏅",
      subtitle: "Complete challenges for bonus points",
      content: (
        <div>
          <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
            {[
              { name: 'First Steps', desc: 'Upload your first book', points: 50, icon: '📚' },
              { name: 'Early Bird', desc: 'Read before 8 AM', points: 75, icon: '🌅' },
              { name: 'Week Warrior', desc: 'Read 7 days in a row', points: 250, icon: '🔥' },
              { name: 'Completionist', desc: 'Finish 10 books', points: 500, icon: '🏆' },
            ].map((achievement, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgb(var(--md-sys-color-surface-container))',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{achievement.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '500' }}>{achievement.title || achievement.name}</div>
                  <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
                    {achievement.desc}
                  </div>
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'rgb(var(--md-sys-color-primary))'
                }}>
                  +{achievement.points}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))', textAlign: 'center' }}>
            🎯 There are 15+ achievements to unlock. Can you collect them all?
          </p>
        </div>
      )
    },
    {
      title: "You're All Set! 🎉",
      subtitle: "Start your reading adventure",
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
          <p style={{ fontSize: '18px', marginBottom: '24px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            You now know how to earn points, level up, and unlock achievements.
            Time to start your reading journey!
          </p>

          <div style={{
            background: 'linear-gradient(135deg, rgba(var(--md-sys-color-primary), 0.1) 0%, rgba(var(--md-sys-color-secondary), 0.1) 100%)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              Quick Start Tips:
            </h4>
            <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))', textAlign: 'left' }}>
              • Upload your first book for an instant 25 points
              • Start a reading session to begin earning
              • Take notes while reading for bonus points
              • Check the "Rewards" menu anytime for the full guide
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <MD3Button
              variant="outlined"
              onClick={() => navigate('/gamification')}
            >
              View Full Guide
            </MD3Button>
            <MD3Button
              variant="filled"
              onClick={() => navigate('/upload')}
            >
              Upload First Book
            </MD3Button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('literati-onboarding-completed', 'true');
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (canSkip) {
      handleComplete();
    }
  };

  if (!isVisible) return null;

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <MD3Card style={{
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '32px',
        position: 'relative'
      }}>
        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '24px',
          justifyContent: 'center'
        }}>
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                background: index <= currentStep
                  ? 'rgb(var(--md-sys-color-primary))'
                  : 'rgb(var(--md-sys-color-outline-variant))',
                transition: 'background 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Step Content */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'rgb(var(--md-sys-color-on-surface))'
          }}>
            {currentStepData.title}
          </h2>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '16px',
            textAlign: 'center',
            color: 'rgb(var(--md-sys-color-on-surface-variant))'
          }}>
            {currentStepData.subtitle}
          </p>
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {currentStep > 0 ? (
              <MD3Button variant="text" onClick={handlePrevious}>
                ← Previous
              </MD3Button>
            ) : (
              <div></div>
            )}
          </div>

          <div style={{ fontSize: '14px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            {currentStep + 1} of {onboardingSteps.length}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {canSkip && (
              <MD3Button variant="text" onClick={handleSkip}>
                Skip
              </MD3Button>
            )}
            <MD3Button variant="filled" onClick={handleNext}>
              {currentStep === onboardingSteps.length - 1 ? 'Get Started!' : 'Next →'}
            </MD3Button>
          </div>
        </div>
      </MD3Card>
    </div>
  );
};

export default GamificationOnboarding;