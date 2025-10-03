/**
 * GamificationOnboarding.jsx - Updated Version
 * All inline styles replaced with CSS classes from GamificationOnboarding.css
 * Fixes white-on-white text visibility issues
 */

import React, { useState } from 'react';
import { MD3Card, MD3Button } from '../Material3';


// CRITICAL: Import the CSS file
import './GamificationOnboarding.css';

const GamificationOnboarding = ({ isOpen, onClose, canSkip = true }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  // Define onboarding steps
  const onboardingSteps = [
    {
      title: "Welcome to Gamification! 🎮",
      subtitle: "Earn points, level up, and unlock achievements as you read",
      content: <OverviewStep />
    },
    {
      title: "Level Up Your Reading 📚",
      subtitle: "Progress through levels as you achieve more",
      content: <LevelsStep />
    },
    {
      title: "Earn Points 💰",
      subtitle: "Every action you take earns you points",
      content: <PointsStep />
    },
    {
      title: "Unlock Achievements 🏆",
      subtitle: "Complete challenges to earn special badges",
      content: <AchievementsStep />
    },
    {
      title: "You're All Set! 🎉",
      subtitle: "Start your reading journey today",
      content: <GetStartedStep />
    }
  ];

  const currentStepData = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="gamification-onboarding-overlay">
      <MD3Card className="gamification-onboarding-card">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="gamification-onboarding-close"
          aria-label="Close onboarding"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Progress Indicators */}
        <div className="gamification-onboarding-progress">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`gamification-onboarding-progress-dot ${index === currentStep ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="gamification-onboarding-content">
          <h2 className="gamification-onboarding-title">
            {currentStepData.title}
          </h2>
          <p className="gamification-onboarding-subtitle">
            {currentStepData.subtitle}
          </p>
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="gamification-onboarding-navigation">
          <div className="gamification-nav-left">
            {currentStep > 0 && (
              <MD3Button variant="text" onClick={handlePrevious}>
                ← Previous
              </MD3Button>
            )}
          </div>

          <div className="gamification-step-counter">
            {currentStep + 1} of {onboardingSteps.length}
          </div>

          <div className="gamification-nav-right">
            {canSkip && currentStep < onboardingSteps.length - 1 && (
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

// ============================================================
// STEP COMPONENTS
// ============================================================

const OverviewStep = () => {
  const features = [
    {
      icon: 'emoji_events',
      title: 'Earn Points',
      description: 'Get points for adding books, writing reviews, and reading achievements'
    },
    {
      icon: 'workspace_premium',
      title: 'Level Up',
      description: 'Progress through reading levels from Bookworm to Literary Legend'
    },
    {
      icon: 'military_tech',
      title: 'Unlock Badges',
      description: 'Complete challenges and earn special achievement badges'
    },
    {
      icon: 'leaderboard',
      title: 'Compete',
      description: 'See how you rank against other readers in the community'
    }
  ];

  return (
    <div className="gamification-overview-container">
      {features.map((feature, index) => (
        <div key={index} className="gamification-feature-item">
          <div className="gamification-feature-icon">
            <span className="material-symbols-outlined">{feature.icon}</span>
          </div>
          <div className="gamification-feature-text">
            <h4>{feature.title}</h4>
            <p>{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const LevelsStep = () => {
  const levels = [
    {
      emoji: '📚',
      title: 'Bookworm',
      subtitle: 'Just getting started',
      points: '0-99 points'
    },
    {
      emoji: '📖',
      title: 'Page Turner',
      subtitle: 'Reading regularly',
      points: '100-499 points'
    },
    {
      emoji: '🎓',
      title: 'Scholar',
      subtitle: 'Dedicated reader',
      points: '500-999 points'
    },
    {
      emoji: '👑',
      title: 'Literary Legend',
      subtitle: 'Master reader',
      points: '1000+ points'
    }
  ];

  return (
    <div className="gamification-levels-grid">
      {levels.map((level, index) => (
        <div key={index} className="gamification-level-card">
          <span className="gamification-level-emoji">{level.emoji}</span>
          <div className="gamification-level-title">{level.title}</div>
          <div className="gamification-level-subtitle">{level.subtitle}</div>
          <div className="gamification-level-points">{level.points}</div>
        </div>
      ))}
    </div>
  );
};

const PointsStep = () => {
  const pointActions = [
    { name: 'Add a book to your library', points: 10 },
    { name: 'Write a book review', points: 25 },
    { name: 'Complete a book', points: 50 },
    { name: 'Add book to favorites', points: 5 },
    { name: 'Share a book recommendation', points: 15 },
    { name: 'Join a book club discussion', points: 20 }
  ];

  return (
    <div className="gamification-points-list">
      {pointActions.map((action, index) => (
        <div key={index} className="gamification-point-item">
          <span className="gamification-point-label">{action.name}</span>
          <span className="gamification-point-value">+{action.points}</span>
        </div>
      ))}
    </div>
  );
};

const AchievementsStep = () => {
  const achievements = [
    {
      icon: '🌟',
      title: 'First Steps',
      description: 'Add your first book to the library'
    },
    {
      icon: '📝',
      title: 'Critic',
      description: 'Write 10 book reviews'
    },
    {
      icon: '🔥',
      title: 'Reading Streak',
      description: 'Read every day for 7 days'
    },
    {
      icon: '📚',
      title: 'Collector',
      description: 'Have 100 books in your library'
    },
    {
      icon: '🏆',
      title: 'Champion',
      description: 'Reach Literary Legend level'
    }
  ];

  return (
    <div className="gamification-achievements-container">
      {achievements.map((achievement, index) => (
        <div key={index} className="gamification-achievement-card">
          <div className="gamification-achievement-icon">
            {achievement.icon}
          </div>
          <div className="gamification-achievement-content">
            <h4>{achievement.title}</h4>
            <p>{achievement.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const GetStartedStep = () => {
  const tips = [
    'Add your first book to start earning points',
    'Check your profile to see your current level',
    'Visit the achievements page to see all available badges',
    'Join book clubs to earn bonus points'
  ];

  return (
    <div className="gamification-get-started-container">
      <span className="gamification-celebration-icon">🎉</span>
      <p className="gamification-get-started-text">
        You're all set to start your gamified reading journey! 
        Every book you add, every review you write, and every goal 
        you achieve will help you level up.
      </p>

      <div className="gamification-tips-list">
        {tips.map((tip, index) => (
          <div key={index} className="gamification-tip-item">
            <span className="gamification-tip-icon">💡</span>
            <span className="gamification-tip-text">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamificationOnboarding;