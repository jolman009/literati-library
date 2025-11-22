import { useState, useEffect } from 'react';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useGamification } from '../contexts/GamificationContext';
import {
  getUnlockedThemes,
  getLockedThemes,
  isThemeUnlocked,
  applyTheme,
  saveThemePreference,
  loadThemePreference,
  getNextThemeProgress,
} from '../utils/themeUtils';
import '../styles/theme-switcher.css';

/**
 * Theme Preview Card Component
 */
const ThemeCard = ({ theme, isUnlocked, isActive, onClick, pointsNeeded }) => {
  return (
    <button
      className={`theme-card ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
      onClick={onClick}
      disabled={!isUnlocked}
      aria-label={`${theme.name} theme ${isUnlocked ? '' : '(locked)'}`}
    >
      {/* Theme preview colors */}
      <div className="theme-preview">
        <div className="preview-colors">
          <div
            className="preview-primary"
            style={{ backgroundColor: theme.preview.primary }}
          />
          <div
            className="preview-secondary"
            style={{ backgroundColor: theme.preview.secondary }}
          />
          <div
            className="preview-surface"
            style={{ backgroundColor: theme.preview.surface }}
          />
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="active-badge">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        )}

        {/* Lock overlay */}
        {!isUnlocked && (
          <div className="lock-overlay">
            <span className="material-symbols-outlined lock-icon">lock</span>
          </div>
        )}
      </div>

      {/* Theme info */}
      <div className="theme-info">
        <div className="theme-header">
          <span className="theme-icon">{theme.icon}</span>
          <h3 className="theme-name">{theme.name}</h3>
        </div>
        <p className="theme-description">{theme.description}</p>

        {/* Unlock requirement */}
        {!isUnlocked && (
          <div className="unlock-requirement">
            <span className="material-symbols-outlined">stars</span>
            <span>{pointsNeeded} more points needed</span>
          </div>
        )}

        {/* Points badge */}
        <div className="theme-points-badge">
          {theme.requiredPoints === 0 ? (
            <span>Default</span>
          ) : (
            <span>{theme.requiredPoints.toLocaleString()} pts</span>
          )}
        </div>
      </div>
    </button>
  );
};

/**
 * Theme Switcher Component
 * Displays all themes with lock/unlock status and allows switching
 */
const ThemeSwitcher = () => {
  const { actualTheme } = useMaterial3Theme();
  const { state: gamificationState } = useGamification();
  const [activeTheme, setActiveTheme] = useState('classic');
  const [showConfetti, setShowConfetti] = useState(false);

  const userPoints = gamificationState?.totalPoints || 0;
  const unlockedThemes = getUnlockedThemes(userPoints);
  const lockedThemes = getLockedThemes(userPoints);
  const nextThemeProgress = getNextThemeProgress(userPoints);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = loadThemePreference();
    if (savedTheme && isThemeUnlocked(savedTheme, userPoints)) {
      setActiveTheme(savedTheme);
      applyTheme(savedTheme, actualTheme);
    } else {
      setActiveTheme('classic');
    }
  }, []);

  // Update theme when mode changes (light/dark)
  useEffect(() => {
    applyTheme(activeTheme, actualTheme);
  }, [actualTheme, activeTheme]);

  // Handle theme selection
  const handleThemeSelect = (themeId) => {
    if (!isThemeUnlocked(themeId, userPoints)) {
      console.warn('Theme is locked:', themeId);
      return;
    }

    // Show brief celebration animation if switching to a newly unlocked theme
    const previousTheme = activeTheme;
    if (previousTheme === 'classic' && themeId !== 'classic') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }

    setActiveTheme(themeId);
    applyTheme(themeId, actualTheme);
    saveThemePreference(themeId);

    console.warn(`✨ Theme switched to: ${themeId}`);
  };

  return (
    <div className="theme-switcher">
      {/* Header */}
      <div className="theme-switcher-header">
        <div className="header-content">
          <span className="material-symbols-outlined header-icon">palette</span>
          <div className="header-text">
            <h2>Reading Themes</h2>
            <p>Unlock new themes by earning points through reading</p>
          </div>
        </div>

        {/* Progress to next theme */}
        {lockedThemes.length > 0 && (
          <div className="next-theme-progress">
            <div className="progress-info">
              <span className="progress-label">
                Progress to {lockedThemes[0].name}
              </span>
              <span className="progress-percentage">
                {Math.round(nextThemeProgress)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${nextThemeProgress}%` }}
              />
            </div>
            <span className="progress-points">
              {lockedThemes[0].pointsNeeded.toLocaleString()} points to go
            </span>
          </div>
        )}
      </div>

      {/* Unlocked Themes Section */}
      {unlockedThemes.length > 0 && (
        <div className="themes-section">
          <h3 className="section-title">
            <span className="material-symbols-outlined">check_circle</span>
            Unlocked Themes ({unlockedThemes.length})
          </h3>
          <div className="themes-grid">
            {unlockedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isUnlocked={true}
                isActive={activeTheme === theme.id}
                onClick={() => handleThemeSelect(theme.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked Themes Section */}
      {lockedThemes.length > 0 && (
        <div className="themes-section locked-section">
          <h3 className="section-title">
            <span className="material-symbols-outlined">lock</span>
            Locked Themes ({lockedThemes.length})
          </h3>
          <div className="themes-grid">
            {lockedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isUnlocked={false}
                isActive={false}
                onClick={() => {}}
                pointsNeeded={theme.pointsNeeded}
              />
            ))}
          </div>
        </div>
      )}

      {/* All themes unlocked message */}
      {lockedThemes.length === 0 && (
        <div className="all-unlocked-banner">
          <span className="material-symbols-outlined">emoji_events</span>
          <div className="banner-text">
            <h3>All Themes Unlocked!</h3>
            <p>You've unlocked every reading theme. Legendary achievement!</p>
          </div>
        </div>
      )}

      {/* Confetti celebration (subtle) */}
      {showConfetti && (
        <div className="theme-confetti">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.3}s`,
                backgroundColor: ['#24A8E0', '#7c5dc7', '#2d6b3f', '#996300'][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
