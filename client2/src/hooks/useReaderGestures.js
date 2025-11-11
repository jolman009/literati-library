import { useEffect, useRef, useState } from 'react';
import haptics from '../utils/haptics';

/**
 * Custom hook for Reader page navigation gestures
 * Supports swipe left/right for page turning
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback for swipe left (next page)
 * @param {Function} options.onSwipeRight - Callback for swipe right (previous page)
 * @param {boolean} options.enabled - Enable/disable gestures
 * @param {number} options.threshold - Minimum swipe distance to trigger (default: 50px)
 * @param {number} options.maxVerticalDeviation - Max vertical movement allowed (default: 100px)
 * @returns {Object} - Gesture state and preview distance
 */
const useReaderGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    enabled = true,
    threshold = 50,
    maxVerticalDeviation = 100,
  } = options;

  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentSwipeDistance = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e) => {
      // Ignore if touching interactive elements
      if (
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'A' ||
        e.target.tagName === 'INPUT' ||
        e.target.closest('button') ||
        e.target.closest('a')
      ) {
        return;
      }

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      setIsSwiping(false);
      setSwipeDistance(0);
      setSwipeDirection(null);
    };

    const handleTouchMove = (e) => {
      if (touchStartX.current === 0) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - touchStartX.current;
      const deltaY = Math.abs(touchY - touchStartY.current);

      // Check if vertical movement is within acceptable range
      if (deltaY > maxVerticalDeviation) {
        // Too much vertical movement, cancel swipe
        resetSwipe();
        return;
      }

      // Determine direction and start visual feedback
      if (Math.abs(deltaX) > 10 && !isSwiping) {
        setIsSwiping(true);
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');
      }

      if (isSwiping) {
        currentSwipeDistance.current = deltaX;
        setSwipeDistance(deltaX);

        // Haptic feedback at threshold
        if (Math.abs(deltaX) >= threshold) {
          haptics.selection();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping) {
        resetSwipe();
        return;
      }

      const distance = currentSwipeDistance.current;
      const absDistance = Math.abs(distance);

      // Trigger page turn if threshold met
      if (absDistance >= threshold) {
        if (distance > 0 && onSwipeRight) {
          // Swiped right - previous page
          haptics.pageTurn();
          onSwipeRight();
        } else if (distance < 0 && onSwipeLeft) {
          // Swiped left - next page
          haptics.pageTurn();
          onSwipeLeft();
        }
      }

      resetSwipe();
    };

    const resetSwipe = () => {
      setIsSwiping(false);
      setSwipeDistance(0);
      setSwipeDirection(null);
      touchStartX.current = 0;
      touchStartY.current = 0;
      currentSwipeDistance.current = 0;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    enabled,
    isSwiping,
    threshold,
    maxVerticalDeviation,
    onSwipeLeft,
    onSwipeRight,
  ]);

  // Calculate opacity for preview (0-1)
  const previewOpacity = Math.min(Math.abs(swipeDistance) / threshold, 1);

  return {
    isSwiping,
    swipeDistance,
    swipeDirection,
    previewOpacity,
  };
};

export default useReaderGestures;
