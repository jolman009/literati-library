/**
 * Dynamic import utilities for advanced code splitting
 * Implements intelligent lazy loading with fallbacks and error handling
 */

import { lazy } from 'react';

// Error fallback component factory
const createErrorFallback = (componentName) => {
  return function ErrorFallback({ error: _error, retry }) {
    return (
      <div className="dynamic-import-error">
        <div className="error-content">
          <span className="material-symbols-outlined">warning</span>
          <h3>Failed to load {componentName}</h3>
          <p>Check your internet connection and try again.</p>
          <button onClick={retry} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  };
};

// Advanced lazy loader with retry mechanism
const createLazyComponent = (importFunction, componentName, options = {}) => {
  const { maxRetries = 3, retryDelay = 1000 } = options;

  return lazy(() => {
    let retryCount = 0;

    const attemptImport = () => {
      return importFunction().catch((error) => {
        if (retryCount < maxRetries) {
          retryCount++;
          console.warn(`Failed to load ${componentName}, retrying (${retryCount}/${maxRetries})...`);

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(attemptImport());
            }, retryDelay * retryCount);
          });
        }

        console.error(`Failed to load ${componentName} after ${maxRetries} retries:`, error);

        // Return error fallback component
        return {
          default: createErrorFallback(componentName)
        };
      });
    };

    return attemptImport();
  });
};

// Feature-based code splitting for heavy features
export const LazyPDFViewer = createLazyComponent(
  () => import('../components/readers/PDFViewer'),
  'PDF Viewer',
  { maxRetries: 5, retryDelay: 2000 }
);

export const LazyEPUBViewer = createLazyComponent(
  () => import('../components/readers/EPUBViewer'),
  'EPUB Viewer',
  { maxRetries: 5, retryDelay: 2000 }
);

export const LazyStatisticsCharts = createLazyComponent(
  () => import('../components/analytics/StatisticsCharts'),
  'Statistics Charts'
);

export const LazyAdvancedSettings = createLazyComponent(
  () => import('../components/settings/AdvancedSettings'),
  'Advanced Settings'
);

export const LazyAIFeatures = createLazyComponent(
  () => import('../components/ai/AIFeatures'),
  'AI Features'
);

// Route-based lazy components with intelligent preloading
const routeComponents = new Map();

export const createLazyRoute = (routeName, importFunction) => {
  if (!routeComponents.has(routeName)) {
    routeComponents.set(routeName, createLazyComponent(importFunction, routeName));
  }
  return routeComponents.get(routeName);
};

// Preload strategy for route components
export const preloadRoute = (routeName, importFunction) => {
  if (!routeComponents.has(routeName)) {
    // Preload without creating lazy component yet
    importFunction().catch(() => {
      // Ignore preload errors, component will load on demand
    });
  }
};

// Intersection-based preloading for components
export const preloadOnHover = (importFunction, delay = 300) => {
  let timeoutId;

  return {
    onMouseEnter: () => {
      timeoutId = setTimeout(() => {
        importFunction().catch(() => {
          // Ignore preload errors
        });
      }, delay);
    },
    onMouseLeave: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };
};

// Bundle size analyzer utility
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const performanceEntries = performance.getEntriesByType('resource');
    const jsFiles = performanceEntries.filter(entry =>
      entry.name.endsWith('.js') || entry.name.endsWith('.mjs')
    );

    const bundleAnalysis = jsFiles.map(file => ({
      name: file.name.split('/').pop(),
      size: file.transferSize,
      loadTime: file.duration,
      cached: file.transferSize === 0
    }));

    // eslint-disable-next-line no-console
    console.table(bundleAnalysis);
    return bundleAnalysis;
  }
};

// Chunk loading monitor
export const monitorChunkLoading = () => {
  if (process.env.NODE_ENV === 'development') {
    const originalConsoleError = console.error;

    console.error = (...args) => {
      if (args[0] && args[0].toString().includes('Loading chunk')) {
        console.warn('Chunk loading failed:', args);
        // Could implement retry logic here
      }
      originalConsoleError.apply(console, args);
    };
  }
};

// Export utilities
export default {
  createLazyComponent,
  createLazyRoute,
  preloadRoute,
  preloadOnHover,
  analyzeBundleSize,
  monitorChunkLoading
};