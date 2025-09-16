import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Hook for debouncing values to prevent excessive re-renders
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling function calls to improve performance
 */
export const useThrottle = (callback, delay) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
};

/**
 * Hook for intersection observer to detect element visibility
 */
export const useIntersectionObserver = (
  elementRef,
  { threshold = 0.1, root = null, rootMargin = '0px' } = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersectingNow = entry.isIntersecting;
        setIsIntersecting(isIntersectingNow);

        // Once intersected, stay true (useful for lazy loading)
        if (isIntersectingNow && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, root, rootMargin, hasIntersected]);

  return { isIntersecting, hasIntersected };
};

/**
 * Hook for performance monitoring and optimization
 */
export const usePerformanceMonitor = (name) => {
  const startTimeRef = useRef(null);
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${name} rendered ${renderCountRef.current} times`);
    }
  });

  const startMeasure = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      startTimeRef.current = performance.now();
    }
  }, []);

  const endMeasure = useCallback((label = 'operation') => {
    if (process.env.NODE_ENV === 'development' && startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`${name} ${label} took ${duration.toFixed(2)}ms`);
      startTimeRef.current = null;
    }
  }, [name]);

  return { startMeasure, endMeasure, renderCount: renderCountRef.current };
};

/**
 * Hook for memoizing expensive computations with dependencies
 */
export const useExpensiveMemo = (factory, deps, computationName = 'computation') => {
  const { startMeasure, endMeasure } = usePerformanceMonitor(computationName);

  return useMemo(() => {
    startMeasure();
    const result = factory();
    endMeasure();
    return result;
  }, deps);
};

/**
 * Hook for optimized event handlers that prevent unnecessary re-renders
 */
export const useOptimizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Hook for managing component loading states efficiently
 */
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((error) => {
    setIsLoading(false);
    setError(error);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  };
};

/**
 * Hook for virtual scrolling optimization
 */
export const useVirtualScrolling = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, items.length]);

  const handleScroll = useThrottle((event) => {
    setScrollTop(event.target.scrollTop);
  }, 16); // ~60fps

  return {
    visibleRange,
    handleScroll,
    scrollTop
  };
};

/**
 * Hook for image lazy loading with intersection observer
 */
export const useLazyImage = (src, { threshold = 0.1, rootMargin = '50px' } = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  const { hasIntersected } = useIntersectionObserver(imgRef, {
    threshold,
    rootMargin
  });

  useEffect(() => {
    if (hasIntersected && src && !imageSrc) {
      const img = new Image();

      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };

      img.onerror = () => {
        setIsError(true);
      };

      img.src = src;
    }
  }, [hasIntersected, src, imageSrc]);

  return {
    ref: imgRef,
    imageSrc,
    isLoaded,
    isError,
    shouldLoad: hasIntersected
  };
};

/**
 * Hook for bundle splitting and code splitting optimization
 */
export const useDynamicImport = (importFunc) => {
  const [component, setComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    importFunc()
      .then((module) => {
        if (isMounted) {
          setComponent(() => module.default || module);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [importFunc]);

  return { component, isLoading, error };
};

/**
 * Hook for prefetching resources
 */
export const usePrefetch = (resources = []) => {
  useEffect(() => {
    resources.forEach((resource) => {
      if (resource.type === 'image') {
        const img = new Image();
        img.src = resource.url;
      } else if (resource.type === 'script') {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource.url;
        document.head.appendChild(link);
      }
    });
  }, [resources]);
};

export default {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  usePerformanceMonitor,
  useExpensiveMemo,
  useOptimizedCallback,
  useLoadingState,
  useVirtualScrolling,
  useLazyImage,
  useDynamicImport,
  usePrefetch
};