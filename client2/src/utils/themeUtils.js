/**
 * Theme System Utilities
 * Manages theme definitions, unlocking, and application
 */

// Theme definitions with unlock requirements
export const THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Standard light and dark themes - clean and professional',
    requiredPoints: 0,
    tier: 'novice',
    preview: {
      primary: '#24A8E0',
      secondary: '#7c5dc7',
      surface: '#fcfcff',
    },
    icon: '🎨',
  },
  {
    id: 'warm-sepia',
    name: 'Warm Sepia',
    description: 'Easy on the eyes for long reading sessions - warm and cozy',
    requiredPoints: 501,
    tier: 'explorer',
    preview: {
      primary: '#8b6914',
      secondary: '#cc7a30',
      surface: '#fffbf5',
    },
    icon: '📜',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Calm and focused reading environment - serene and peaceful',
    requiredPoints: 1501,
    tier: 'scholar',
    preview: {
      primary: '#006497',
      secondary: '#4f616e',
      surface: '#f6fafe',
    },
    icon: '🌊',
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural and relaxing atmosphere - refreshing and balanced',
    requiredPoints: 3001,
    tier: 'sage',
    preview: {
      primary: '#2d6b3f',
      secondary: '#52634f',
      surface: '#f7fbf4',
    },
    icon: '🌲',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Elegant and sophisticated style - luxurious and refined',
    requiredPoints: 5001,
    tier: 'master',
    preview: {
      primary: '#6e3ab4',
      secondary: '#645a70',
      surface: '#fef7ff',
    },
    icon: '👑',
  },
  {
    id: 'legendary-gold',
    name: 'Legendary Gold',
    description: 'Exclusive premium experience - prestigious and extraordinary',
    requiredPoints: 10001,
    tier: 'legend',
    preview: {
      primary: '#996300',
      secondary: '#735a3f',
      surface: '#fffbf7',
    },
    icon: '⭐',
  },
];

/**
 * Get all themes unlocked by the user based on their points
 * @param {number} userPoints - User's current gamification points
 * @returns {Array} Array of unlocked theme objects
 */
export const getUnlockedThemes = (userPoints = 0) => {
  return THEMES.filter(theme => userPoints >= theme.requiredPoints);
};

/**
 * Get all locked themes
 * @param {number} userPoints - User's current gamification points
 * @returns {Array} Array of locked theme objects with unlock info
 */
export const getLockedThemes = (userPoints = 0) => {
  return THEMES.filter(theme => userPoints < theme.requiredPoints).map(theme => ({
    ...theme,
    pointsNeeded: theme.requiredPoints - userPoints,
  }));
};

/**
 * Check if a specific theme is unlocked
 * @param {string} themeId - Theme identifier
 * @param {number} userPoints - User's current gamification points
 * @returns {boolean} True if theme is unlocked
 */
export const isThemeUnlocked = (themeId, userPoints = 0) => {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return false;
  return userPoints >= theme.requiredPoints;
};

/**
 * Get theme object by ID
 * @param {string} themeId - Theme identifier
 * @returns {Object|null} Theme object or null if not found
 */
export const getThemeById = (themeId) => {
  return THEMES.find(t => t.id === themeId) || null;
};

/**
 * Apply theme to the document
 * @param {string} themeId - Theme identifier to apply
 * @param {string} mode - 'light' or 'dark'
 */
export const applyTheme = (themeId, mode = 'light') => {
  const root = document.documentElement;

  // Set theme data attributes
  root.setAttribute('data-theme', themeId);
  root.setAttribute('data-actual-theme', mode);

  console.warn(`🎨 Theme applied: ${themeId} (${mode} mode)`);
};

/**
 * Save theme preference to localStorage
 * @param {string} themeId - Theme identifier
 */
export const saveThemePreference = (themeId) => {
  try {
    localStorage.setItem('shelfquest_theme', themeId);
    console.warn(`💾 Theme preference saved: ${themeId}`);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
};

/**
 * Load theme preference from localStorage
 * @returns {string|null} Saved theme ID or null if none saved
 */
export const loadThemePreference = () => {
  try {
    return localStorage.getItem('shelfquest_theme');
  } catch (error) {
    console.error('Failed to load theme preference:', error);
    return null;
  }
};

/**
 * Get the default theme (always available)
 * @returns {Object} Classic theme object
 */
export const getDefaultTheme = () => {
  return THEMES[0]; // Classic theme
};

/**
 * Check if user just unlocked a new theme
 * @param {number} previousPoints - User's previous points
 * @param {number} currentPoints - User's current points
 * @returns {Array} Array of newly unlocked themes
 */
export const getNewlyUnlockedThemes = (previousPoints, currentPoints) => {
  if (currentPoints <= previousPoints) return [];

  return THEMES.filter(theme =>
    theme.requiredPoints > previousPoints &&
    theme.requiredPoints <= currentPoints
  );
};

/**
 * Get next theme to unlock
 * @param {number} userPoints - User's current points
 * @returns {Object|null} Next theme to unlock or null if all unlocked
 */
export const getNextThemeToUnlock = (userPoints = 0) => {
  const lockedThemes = getLockedThemes(userPoints);
  if (lockedThemes.length === 0) return null;

  // Return the closest locked theme
  return lockedThemes.reduce((closest, theme) => {
    return theme.requiredPoints < closest.requiredPoints ? theme : closest;
  });
};

/**
 * Calculate unlock progress for next theme (0-100)
 * @param {number} userPoints - User's current points
 * @returns {number} Progress percentage (0-100)
 */
export const getNextThemeProgress = (userPoints = 0) => {
  const nextTheme = getNextThemeToUnlock(userPoints);
  if (!nextTheme) return 100; // All themes unlocked

  // Find the previous theme's points (or 0 if this is the first locked theme)
  const unlockedThemes = getUnlockedThemes(userPoints);
  const previousThemePoints = unlockedThemes.length > 0
    ? unlockedThemes[unlockedThemes.length - 1].requiredPoints
    : 0;

  const pointsInCurrentTier = userPoints - previousThemePoints;
  const pointsNeededForTier = nextTheme.requiredPoints - previousThemePoints;

  return Math.min(100, Math.max(0, (pointsInCurrentTier / pointsNeededForTier) * 100));
};

/**
 * Initialize theme system
 * Loads saved theme or applies default
 * @param {number} userPoints - User's current points
 * @param {string} mode - 'light' or 'dark'
 * @returns {string} Applied theme ID
 */
export const initializeTheme = (userPoints = 0, mode = 'light') => {
  const savedTheme = loadThemePreference();

  // Check if saved theme is still unlocked
  if (savedTheme && isThemeUnlocked(savedTheme, userPoints)) {
    applyTheme(savedTheme, mode);
    return savedTheme;
  }

  // Fall back to default theme
  const defaultTheme = getDefaultTheme();
  applyTheme(defaultTheme.id, mode);
  return defaultTheme.id;
};

export default {
  THEMES,
  getUnlockedThemes,
  getLockedThemes,
  isThemeUnlocked,
  getThemeById,
  applyTheme,
  saveThemePreference,
  loadThemePreference,
  getDefaultTheme,
  getNewlyUnlockedThemes,
  getNextThemeToUnlock,
  getNextThemeProgress,
  initializeTheme,
};
