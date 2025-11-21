/**
 * Haptic Feedback Utility
 * Provides tactile feedback for user interactions
 * Uses the Vibration API (supported on most mobile browsers)
 */

/**
 * Check if vibration is supported
 * @returns {boolean}
 */
const isSupported = () => {
  return 'vibrate' in navigator;
};

/**
 * Check if haptics are enabled (user preference)
 * @returns {boolean}
 */
const isEnabled = () => {
  try {
    const preference = localStorage.getItem('shelfquest_haptics_enabled');
    return preference !== 'false'; // Enabled by default
  } catch {
    return true;
  }
};

/**
 * Enable or disable haptic feedback
 * @param {boolean} enabled
 */
export const setHapticsEnabled = (enabled) => {
  try {
    localStorage.setItem('shelfquest_haptics_enabled', enabled ? 'true' : 'false');
    console.warn(`📳 Haptics ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.warn('Failed to save haptics preference:', error);
  }
};

/**
 * Trigger vibration if supported and enabled
 * @param {number|number[]} pattern - Vibration pattern in milliseconds
 */
const vibrate = (pattern) => {
  if (!isSupported()) {
    console.warn('📳 Vibration API not supported');
    return false;
  }

  if (!isEnabled()) {
    console.warn('📳 Haptics disabled by user');
    return false;
  }

  try {
    navigator.vibrate(pattern);
    return true;
  } catch (error) {
    console.warn('Vibration failed:', error);
    return false;
  }
};

/**
 * Light tap - For button presses, toggles
 * Quick, subtle feedback
 */
export const lightTap = () => {
  vibrate(10);
};

/**
 * Medium tap - For selections, confirmations
 * Noticeable but not aggressive
 */
export const mediumTap = () => {
  vibrate(20);
};

/**
 * Heavy tap - For important actions, errors
 * Strong, attention-grabbing
 */
export const heavyTap = () => {
  vibrate(40);
};

/**
 * Success pattern - For completed actions
 * Short double-tap pattern
 */
export const success = () => {
  vibrate([15, 50, 15]);
};

/**
 * Error pattern - For failed actions
 * Sharp, urgent triple-tap
 */
export const error = () => {
  vibrate([20, 40, 20, 40, 20]);
};

/**
 * Selection pattern - For picking items from a list
 * Very subtle single tap
 */
export const selection = () => {
  vibrate(5);
};

/**
 * Long press pattern - When holding a button
 * Sustained vibration
 */
export const longPress = () => {
  vibrate(30);
};

/**
 * Notification pattern - For alerts, messages
 * Gentle double-tap
 */
export const notification = () => {
  vibrate([25, 100, 25]);
};

/**
 * Impact pattern - For drag-and-drop, page turns
 * Quick impact feel
 */
export const impact = () => {
  vibrate(12);
};

/**
 * Swipe pattern - For successful swipe gestures
 * Smooth rolling pattern
 */
export const swipe = () => {
  vibrate([8, 20, 8]);
};

/**
 * Pull pattern - For pull-to-refresh
 * Building tension pattern
 */
export const pull = () => {
  vibrate([5, 10, 5, 10, 10]);
};

/**
 * Unlock pattern - For unlocking achievements, themes
 * Celebratory pattern
 */
export const unlock = () => {
  vibrate([20, 50, 20, 50, 40]);
};

/**
 * Level up pattern - For progression milestones
 * Escalating pattern
 */
export const levelUp = () => {
  vibrate([15, 40, 15, 40, 15, 40, 30]);
};

/**
 * Page turn pattern - For reader page navigation
 * Subtle swoosh feel
 */
export const pageTurn = () => {
  vibrate([6, 15, 6]);
};

/**
 * Bookmark pattern - For saving bookmarks
 * Satisfying click pattern
 */
export const bookmark = () => {
  vibrate([10, 30, 15]);
};

/**
 * Delete pattern - For removing items
 * Warning double-tap
 */
export const deleteAction = () => {
  vibrate([25, 50, 25]);
};

/**
 * Custom vibration pattern
 * @param {number|number[]} pattern - Custom vibration pattern
 */
export const custom = (pattern) => {
  vibrate(pattern);
};

/**
 * Stop all vibrations
 */
export const stop = () => {
  if (isSupported()) {
    navigator.vibrate(0);
  }
};

// Export utility functions
export const haptics = {
  isSupported,
  isEnabled,
  setEnabled: setHapticsEnabled,
  lightTap,
  mediumTap,
  heavyTap,
  success,
  error,
  selection,
  longPress,
  notification,
  impact,
  swipe,
  pull,
  unlock,
  levelUp,
  pageTurn,
  bookmark,
  delete: deleteAction,
  custom,
  stop,
};

export default haptics;
