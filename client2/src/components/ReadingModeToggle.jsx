import useReadingMode from '../hooks/useReadingMode';
import '../styles/reading-mode.css';

/**
 * Reading Mode Toggle Button
 * Provides button to enter/exit distraction-free reading mode
 *
 * @param {string} variant - Button style: 'fab', 'button', 'icon'
 * @param {string} position - Position for FAB: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
 * @param {Function} onModeChange - Callback when mode changes
 */
const ReadingModeToggle = ({
  variant = 'fab',
  position = 'bottom-right',
  onModeChange,
}) => {
  const {
    isReadingMode,
    isSupported,
    toggleReadingMode,
  } = useReadingMode();

  const handleToggle = async () => {
    const result = await toggleReadingMode();
    if (onModeChange) {
      onModeChange(result);
    }
  };

  if (!isSupported) {
    return null; // Don't show if fullscreen not supported
  }

  if (variant === 'fab') {
    return (
      <button
        className={`reading-mode-fab reading-mode-fab-${position} ${isReadingMode ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label={isReadingMode ? 'Exit reading mode' : 'Enter reading mode'}
        title={isReadingMode ? 'Exit reading mode' : 'Enter distraction-free mode'}
      >
        <span className="material-symbols-outlined">
          {isReadingMode ? 'fullscreen_exit' : 'fullscreen'}
        </span>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        className="reading-mode-icon-btn"
        onClick={handleToggle}
        aria-label={isReadingMode ? 'Exit reading mode' : 'Enter reading mode'}
      >
        <span className="material-symbols-outlined">
          {isReadingMode ? 'fullscreen_exit' : 'fullscreen'}
        </span>
      </button>
    );
  }

  // Default button variant
  return (
    <button
      className="reading-mode-button"
      onClick={handleToggle}
    >
      <span className="material-symbols-outlined">
        {isReadingMode ? 'fullscreen_exit' : 'fullscreen'}
      </span>
      <span>{isReadingMode ? 'Exit Reading Mode' : 'Reading Mode'}</span>
    </button>
  );
};

export default ReadingModeToggle;
