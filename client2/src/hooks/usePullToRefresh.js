import { useEffect, useRef, useState } from 'react';
import haptics from '../utils/haptics';

/**
 * Custom hook for Pull-to-Refresh functionality
 * Provides native mobile pull-to-refresh experience
 *
 * @param {Function} onRefresh - Async function to call when refresh is triggered
 * @param {Object} options - Configuration options
 * @returns {Object} - State and refs for the pull-to-refresh UI
 */
const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80, // Distance to pull before triggering refresh
    resistance = 2.5, // How much resistance when pulling (higher = more resistance)
    maxPullDistance = 120, // Maximum distance the indicator can be pulled
    enabled = true, // Enable/disable the hook
  } = options;

  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshComplete, setRefreshComplete] = useState(false);

  const touchStartY = useRef(0);
  const currentPullDistance = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      // Only start if we're at the top of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop === 0 && !isRefreshing) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing || touchStartY.current === 0) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const touchY = e.touches[0].clientY;
      const pullDelta = touchY - touchStartY.current;

      // Only pull down when at top of page
      if (scrollTop === 0 && pullDelta > 0) {
        // Prevent default scroll behavior
        e.preventDefault();

        // Apply resistance formula for natural feel
        const distance = Math.min(pullDelta / resistance, maxPullDistance);
        currentPullDistance.current = distance;
        setPullDistance(distance);
        setIsPulling(true);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;

      const distance = currentPullDistance.current;

      if (distance >= threshold) {
        // Trigger refresh
        setIsRefreshing(true);
        setPullDistance(threshold); // Lock at threshold during refresh

        try {
          // Haptic feedback for successful pull
          haptics.pull();

          await onRefresh();

          // Show completion state
          setRefreshComplete(true);
          setTimeout(() => {
            setRefreshComplete(false);
            resetPull();
          }, 500);
        } catch (error) {
          console.error('Refresh failed:', error);
          resetPull();
        }
      } else {
        // Didn't pull far enough - snap back
        resetPull();
      }
    };

    const resetPull = () => {
      setIsPulling(false);
      setPullDistance(0);
      setIsRefreshing(false);
      touchStartY.current = 0;
      currentPullDistance.current = 0;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isRefreshing, isPulling, threshold, resistance, maxPullDistance, onRefresh]);

  // Calculate progress percentage (0-100)
  const progress = Math.min((pullDistance / threshold) * 100, 100);

  // Calculate rotation for spinner (0-360 degrees)
  const spinnerRotation = (pullDistance / threshold) * 360;

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    refreshComplete,
    progress,
    spinnerRotation,
  };
};

export default usePullToRefresh;
