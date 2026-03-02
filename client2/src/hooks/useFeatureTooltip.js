import { useEffect, useRef, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import monitoring from '../services/monitoring';

const STORAGE_PREFIX = 'feature_tooltip_';

/**
 * Reusable hook for one-time feature tooltips using driver.js.
 *
 * @param {string} featureId - Unique identifier for the feature (used in localStorage key)
 * @param {Array} steps - driver.js step definitions (element, popover config)
 * @param {Object} [options]
 * @param {number} [options.delay=500] - Delay in ms before showing the tooltip
 * @param {boolean} [options.enabled=true] - Whether the tooltip can show
 */
export function useFeatureTooltip(featureId, steps, { delay = 500, enabled = true } = {}) {
  const driverRef = useRef(null);

  const isDismissed = useCallback(() => {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}${featureId}_dismissed`) === 'true';
    } catch {
      return true;
    }
  }, [featureId]);

  const markDismissed = useCallback(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${featureId}_dismissed`, 'true');
    } catch {
      // Silently ignore localStorage errors
    }
  }, [featureId]);

  useEffect(() => {
    if (!enabled || !steps?.length || isDismissed()) return;

    const timer = setTimeout(() => {
      monitoring.trackFeature('feature_tooltip', 'shown', { feature_id: featureId });

      driverRef.current = driver({
        showProgress: steps.length > 1,
        steps,
        onDestroyStarted: () => {
          markDismissed();
          monitoring.trackFeature('feature_tooltip', 'dismissed', { feature_id: featureId });
          driverRef.current?.destroy();
        },
        onDestroyed: () => {
          driverRef.current = null;
        },
      });

      driverRef.current.drive();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, [featureId, steps, delay, enabled, isDismissed, markDismissed]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${featureId}_dismissed`);
    } catch {
      // Silently ignore
    }
  }, [featureId]);

  return { isDismissed: isDismissed(), reset };
}

export default useFeatureTooltip;
