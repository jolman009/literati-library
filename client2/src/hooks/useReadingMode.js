import { useState, useEffect, useCallback } from 'react';
import haptics from '../utils/haptics';

/**
 * Mobile Reading Mode Hook
 * Provides distraction-free fullscreen reading experience
 *
 * Features:
 * - Fullscreen API support
 * - Auto-hide UI on inactivity
 * - Tap-to-show controls
 * - System UI hiding (on supported devices)
 *
 * @param {Object} options - Configuration options
 * @returns {Object} - Reading mode state and controls
 */
const useReadingMode = (options = {}) => {
  const {
    autoHideDelay = 3000, // Time in ms before hiding UI
    enabled = true,
  } = options;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [isReadingMode, setIsReadingMode] = useState(false);

  let hideTimeout = null;

  // Check if fullscreen is supported
  const isFullscreenSupported = () => {
    return !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
  };

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    if (!enabled || !isFullscreenSupported()) {
      console.log('📱 Fullscreen not supported, using reading mode only');
      return false;
    }

    try {
      const elem = document.documentElement;

      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }

      haptics.mediumTap();
      setIsFullscreen(true);
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      return false;
    }
  }, [enabled]);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }

      haptics.lightTap();
      setIsFullscreen(false);
      return true;
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      return false;
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      return await exitFullscreen();
    } else {
      return await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Enter reading mode (fullscreen + auto-hide UI)
  const enterReadingMode = useCallback(async () => {
    setIsReadingMode(true);
    await enterFullscreen();
    setIsUIVisible(true);

    // Start auto-hide timer
    startAutoHideTimer();

    console.log('📖 Reading mode activated');
  }, [enterFullscreen]);

  // Exit reading mode
  const exitReadingMode = useCallback(async () => {
    setIsReadingMode(false);
    await exitFullscreen();
    setIsUIVisible(true);

    // Clear auto-hide timer
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    console.log('📖 Reading mode deactivated');
  }, [exitFullscreen]);

  // Toggle reading mode
  const toggleReadingMode = useCallback(async () => {
    if (isReadingMode) {
      return await exitReadingMode();
    } else {
      return await enterReadingMode();
    }
  }, [isReadingMode, enterReadingMode, exitReadingMode]);

  // Show UI temporarily
  const showUI = useCallback(() => {
    setIsUIVisible(true);
    startAutoHideTimer();
  }, []);

  // Hide UI
  const hideUI = useCallback(() => {
    setIsUIVisible(false);
  }, []);

  // Toggle UI visibility
  const toggleUI = useCallback(() => {
    if (isUIVisible) {
      hideUI();
    } else {
      showUI();
    }
  }, [isUIVisible, showUI, hideUI]);

  // Start auto-hide timer
  const startAutoHideTimer = useCallback(() => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    if (isReadingMode && autoHideDelay > 0) {
      hideTimeout = setTimeout(() => {
        setIsUIVisible(false);
      }, autoHideDelay);
    }
  }, [isReadingMode, autoHideDelay]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      // If user exits fullscreen manually, exit reading mode too
      if (!isCurrentlyFullscreen && isReadingMode) {
        setIsReadingMode(false);
        setIsUIVisible(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isReadingMode]);

  // Tap-to-toggle UI in reading mode
  useEffect(() => {
    if (!isReadingMode) return;

    const handleTap = (e) => {
      // Ignore taps on interactive elements
      if (
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'A' ||
        e.target.tagName === 'INPUT' ||
        e.target.closest('button') ||
        e.target.closest('a')
      ) {
        return;
      }

      toggleUI();
    };

    document.addEventListener('click', handleTap);

    return () => {
      document.removeEventListener('click', handleTap);
    };
  }, [isReadingMode, toggleUI]);

  return {
    // State
    isFullscreen,
    isUIVisible,
    isReadingMode,
    isSupported: isFullscreenSupported(),

    // Controls
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    enterReadingMode,
    exitReadingMode,
    toggleReadingMode,
    showUI,
    hideUI,
    toggleUI,
  };
};

export default useReadingMode;
