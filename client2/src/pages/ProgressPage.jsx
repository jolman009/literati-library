// src/pages/ProgressPage.jsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../contexts/GamificationContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import '../styles/progress-page.css';

/**
 * Confetti Component - Celebration animation for achievements
 */
const Confetti = ({ active, onComplete }) => {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  if (!active) return null;

  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    color: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F', '#A78BFA'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="confetti-container">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color
          }}
        />
      ))}
    </div>
  );
};

/**
 * Progress Page - Visual Journey/Progression System
 * Inspired by Candy Crush map and Clash of Clans league tiers
 */
const ProgressPage = () => {
  const navigate = useNavigate();
  const { stats, achievements } = useGamification();
  const { actualTheme } = useMaterial3Theme();

  // State for animations and interactions
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState(null);
  const [tierTransitioning, setTierTransitioning] = useState(false);

  // Swipe gesture handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const journeyRef = useRef(null);

  // Define reading tiers/leagues with theme unlocks
  const tiers = [
    {
      id: 'novice',
      name: 'Novice Reader',
      icon: '📖',
      minPoints: 0,
      maxPoints: 500,
      color: '#8B4513',
      description: 'Just starting your reading adventure',
      themeUnlock: { name: 'Classic', description: 'Standard light and dark themes' }
    },
    {
      id: 'bookworm',
      name: 'Bookworm',
      icon: '🐛',
      minPoints: 501,
      maxPoints: 1500,
      color: '#CD7F32',
      description: 'Building good reading habits',
      themeUnlock: { name: 'Warm Sepia', description: 'Easy on the eyes, perfect for long reads' }
    },
    {
      id: 'scholar',
      name: 'Scholar',
      icon: '🎓',
      minPoints: 1501,
      maxPoints: 3000,
      color: '#C0C0C0',
      description: 'Expanding your knowledge',
      themeUnlock: { name: 'Ocean Blue', description: 'Calm and focused reading environment' }
    },
    {
      id: 'sage',
      name: 'Sage',
      icon: '📚',
      minPoints: 3001,
      maxPoints: 5000,
      color: '#FFD700',
      description: 'Wisdom through literature',
      themeUnlock: { name: 'Forest Green', description: 'Natural and relaxing theme' }
    },
    {
      id: 'master',
      name: 'Literary Master',
      icon: '👑',
      minPoints: 5001,
      maxPoints: 10000,
      color: '#9370DB',
      description: 'Mastering the written word',
      themeUnlock: { name: 'Royal Purple', description: 'Elegant and sophisticated' }
    },
    {
      id: 'legend',
      name: 'Legend',
      icon: '🏆',
      minPoints: 10001,
      maxPoints: Infinity,
      color: '#FF6B6B',
      description: 'A true reading legend',
      themeUnlock: { name: 'Legendary Gold', description: 'Exclusive premium theme for legends' }
    }
  ];

  // Calculate current tier
  const currentTier = useMemo(() => {
    const points = stats?.totalPoints || 0;
    return tiers.find(tier => points >= tier.minPoints && points <= tier.maxPoints) || tiers[0];
  }, [stats?.totalPoints, tiers]);

  // Calculate progress to next tier
  const nextTier = useMemo(() => {
    const currentIndex = tiers.findIndex(t => t.id === currentTier.id);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }, [currentTier, tiers]);

  const progressToNextTier = useMemo(() => {
    if (!nextTier) return 100;
    const points = stats?.totalPoints || 0;
    const range = nextTier.minPoints - currentTier.minPoints;
    const progress = points - currentTier.minPoints;
    return Math.min((progress / range) * 100, 100);
  }, [stats?.totalPoints, currentTier, nextTier]);

  // Milestones along the journey
  const milestones = [
    { id: 1, title: '1st Book Read', points: 100, icon: '📚', unlocked: (stats?.booksRead || 0) >= 1 },
    { id: 2, title: '5 Books Read', points: 500, icon: '📚📚', unlocked: (stats?.booksRead || 0) >= 5 },
    { id: 3, title: '10 Books Read', points: 1000, icon: '🎯', unlocked: (stats?.booksRead || 0) >= 10 },
    { id: 4, title: '7-Day Streak', points: 700, icon: '🔥', unlocked: (stats?.readingStreak || 0) >= 7 },
    { id: 5, title: '25 Books Read', points: 2500, icon: '⭐', unlocked: (stats?.booksRead || 0) >= 25 },
    { id: 6, title: '50 Books Read', points: 5000, icon: '💎', unlocked: (stats?.booksRead || 0) >= 50 },
    { id: 7, title: '100 Books Read', points: 10000, icon: '👑', unlocked: (stats?.booksRead || 0) >= 100 },
  ];

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - scroll down
        journeyRef.current?.scrollBy({ top: 200, behavior: 'smooth' });
      } else {
        // Swiped right - scroll up
        journeyRef.current?.scrollBy({ top: -200, behavior: 'smooth' });
      }
    }
  };

  // Social sharing function
  const handleShareAchievement = async (achievement) => {
    const shareData = {
      title: `ShelfQuest Achievement: ${achievement.title}`,
      text: `I just unlocked "${achievement.title}" on ShelfQuest! 🎉📚`,
      url: window.location.origin + '/progress'
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        alert('Achievement details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Tier selection handler with animation
  const handleTierClick = (tierIndex) => {
    setTierTransitioning(true);
    setSelectedTierIndex(tierIndex);
    setTimeout(() => {
      setTierTransitioning(false);
      // Trigger confetti if it's the current tier
      if (tierIndex === tiers.findIndex(t => t.id === currentTier.id)) {
        setShowConfetti(true);
      }
    }, 300);
  };

  // Check for tier unlock on mount/stats change
  useEffect(() => {
    const lastSeenPoints = localStorage.getItem('lastSeenPoints');
    const currentPoints = stats?.totalPoints || 0;

    if (lastSeenPoints && currentPoints > parseInt(lastSeenPoints)) {
      const lastTier = tiers.find(t => parseInt(lastSeenPoints) >= t.minPoints && parseInt(lastSeenPoints) <= t.maxPoints);
      const newTier = tiers.find(t => currentPoints >= t.minPoints && currentPoints <= t.maxPoints);

      if (lastTier && newTier && lastTier.id !== newTier.id) {
        // Tier unlocked! Show confetti
        setShowConfetti(true);
      }
    }

    localStorage.setItem('lastSeenPoints', currentPoints.toString());
  }, [stats?.totalPoints, tiers]);

  return (
    <div className={`progress-page ${actualTheme === 'dark' ? 'dark' : ''}`}>
      {/* Confetti Celebration */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <div className="progress-header">
        <button
          className="progress-back-button"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="progress-page-title">Your Reading Journey</h1>
      </div>

      {/* Current Tier Card */}
      <div className="current-tier-card" style={{ borderColor: currentTier.color }}>
        <div className="current-tier-badge" style={{ backgroundColor: currentTier.color }}>
          <span className="current-tier-icon">{currentTier.icon}</span>
        </div>
        <div className="current-tier-info">
          <h2 className="current-tier-name">{currentTier.name}</h2>
          <p className="current-tier-description">{currentTier.description}</p>
          <div className="current-tier-points">
            {stats?.totalPoints?.toLocaleString() || 0} points
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="next-tier-progress">
          <div className="next-tier-header">
            <span>Progress to {nextTier.name}</span>
            <span>{Math.floor(progressToNextTier)}%</span>
          </div>
          <div className="next-tier-bar">
            <div
              className="next-tier-fill"
              style={{
                width: `${progressToNextTier}%`,
                backgroundColor: nextTier.color
              }}
            />
          </div>
          <p className="next-tier-points-needed">
            {nextTier.minPoints - (stats?.totalPoints || 0)} points to next tier
          </p>
        </div>
      )}

      {/* All Tiers Display */}
      <div className="tiers-section">
        <h2 className="section-heading">All Reading Tiers</h2>
        <div className="tiers-grid">
          {tiers.map((tier) => {
            const isCurrentTier = tier.id === currentTier.id;
            const isPastTier = (stats?.totalPoints || 0) > tier.maxPoints;
            const isLockedTier = (stats?.totalPoints || 0) < tier.minPoints;

            const tierIndex = tiers.findIndex(t => t.id === tier.id);
            const isSelected = selectedTierIndex === tierIndex;

            return (
              <div
                key={tier.id}
                className={`tier-card ${isCurrentTier ? 'current' : ''} ${isPastTier ? 'completed' : ''} ${isLockedTier ? 'locked' : ''} ${isSelected ? 'selected' : ''} ${tierTransitioning ? 'transitioning' : ''}`}
                style={{ borderColor: tier.color }}
                onClick={() => handleTierClick(tierIndex)}
                role="button"
                tabIndex={0}
              >
                <div className="tier-icon-badge" style={{ backgroundColor: tier.color }}>
                  {tier.icon}
                </div>
                <h3 className="tier-name">{tier.name}</h3>
                <p className="tier-range">
                  {tier.minPoints.toLocaleString()} - {tier.maxPoints === Infinity ? '∞' : tier.maxPoints.toLocaleString()} pts
                </p>
                <p className="tier-description">{tier.description}</p>
                {isCurrentTier && <span className="current-badge">Current</span>}
                {isPastTier && <span className="completed-badge">✓ Completed</span>}
                {isLockedTier && <span className="locked-badge">🔒 Locked</span>}
                {tier.themeUnlock && (
                  <div className="tier-theme-unlock">
                    <span className="theme-unlock-icon">🎨</span>
                    <span className="theme-unlock-name">{tier.themeUnlock.name}</span>
                    <p className="theme-unlock-description">{tier.themeUnlock.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme Unlocks Section */}
      <div className="theme-unlocks-section">
        <h2 className="section-heading">Unlocked Themes</h2>
        <p className="section-subtitle">Earn tiers to unlock exclusive reading themes</p>
        <div className="theme-unlocks-grid">
          {tiers.filter((tier) => (stats?.totalPoints || 0) >= tier.minPoints).map((tier) => (
            <div key={tier.id} className="theme-unlock-card">
              <div className="theme-preview" style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}88)` }}>
                <span className="theme-preview-icon">{tier.icon}</span>
              </div>
              <div className="theme-unlock-info">
                <h4 className="theme-unlock-title">{tier.themeUnlock.name}</h4>
                <p className="theme-unlock-desc">{tier.themeUnlock.description}</p>
                <span className="theme-unlock-tier">Unlocked at {tier.name}</span>
              </div>
            </div>
          ))}
        </div>
        {tiers.filter((tier) => (stats?.totalPoints || 0) < tier.minPoints).length > 0 && (
          <div className="locked-themes-preview">
            <h3 className="locked-themes-title">🔒 Locked Themes</h3>
            <p className="locked-themes-subtitle">Continue reading to unlock more themes!</p>
            {tiers.filter((tier) => (stats?.totalPoints || 0) < tier.minPoints).slice(0, 3).map((tier) => (
              <div key={tier.id} className="locked-theme-preview">
                <span>{tier.themeUnlock.name}</span>
                <span className="locked-theme-points">{tier.minPoints - (stats?.totalPoints || 0)} pts away</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Journey Map - Milestone Path */}
      <div className="journey-section">
        <h2 className="section-heading">Your Reading Path</h2>
        <p className="section-subtitle">Track your milestones and achievements • Swipe to navigate</p>

        <div
          className="journey-path"
          ref={journeyRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {milestones.map((milestone, index) => {
            const isActive = milestone.unlocked;
            const isNext = !isActive && (index === 0 || milestones[index - 1].unlocked);

            return (
              <div key={milestone.id} className="milestone-container">
                {/* Connecting line */}
                {index < milestones.length - 1 && (
                  <div className={`milestone-line ${isActive ? 'completed' : ''}`} />
                )}

                {/* Milestone node */}
                <div className={`milestone-node ${isActive ? 'unlocked' : 'locked'} ${isNext ? 'next' : ''}`}>
                  <div className="milestone-icon">{milestone.icon}</div>
                  <div className="milestone-info">
                    <h4 className="milestone-title">{milestone.title}</h4>
                    <p className="milestone-points">+{milestone.points} points</p>
                    {isActive && <span className="milestone-status">✓ Unlocked</span>}
                    {isNext && <span className="milestone-status">⏳ In Progress</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements && achievements.length > 0 && (
        <div className="achievements-section">
          <h2 className="section-heading">Recent Achievements</h2>
          <div className="achievements-grid">
            {achievements.slice(0, 6).map((achievement) => (
              <div key={achievement.id} className="achievement-card">
                <span className="achievement-icon">{achievement.icon || '🏅'}</span>
                <h4 className="achievement-title">{achievement.title || achievement.name}</h4>
                <p className="achievement-description">{achievement.description}</p>
                <button
                  className="achievement-share-btn"
                  onClick={() => handleShareAchievement(achievement)}
                  aria-label={`Share ${achievement.title || achievement.name}`}
                >
                  <span className="material-symbols-outlined">share</span>
                  Share
                </button>
              </div>
            ))}
          </div>
          <button
            className="view-all-achievements-btn"
            onClick={() => navigate('/achievements')}
          >
            View All Achievements →
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
