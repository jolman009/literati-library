// Network Status Hook for Enhanced UX
import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      console.warn('🌐 Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
      console.warn('📴 Connection lost');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !navigator.onLine) {
        setIsReconnecting(true);
        // Check if we're actually back online
        setTimeout(() => {
          if (navigator.onLine) {
            setIsOnline(true);
            setIsReconnecting(false);
          } else {
            setIsReconnecting(false);
          }
        }, 2000);
      }
    };

    // Get connection type if available
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  // Method to test actual connectivity
  const testConnectivity = async () => {
    setIsReconnecting(true);
    
    try {
      // Try to fetch a small resource to test real connectivity
      const response = await fetch('/manifest.webmanifest', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const actuallyOnline = response.ok;
      setIsOnline(actuallyOnline);
      
      if (!actuallyOnline && navigator.onLine) {
        // Browser thinks we're online but we're not
        console.warn('🔄 Browser reports online but no connectivity');
      }
      
      return actuallyOnline;
    } catch (error) {
      console.warn('🔄 Connectivity test failed:', error.message);
      setIsOnline(false);
      return false;
    } finally {
      setIsReconnecting(false);
    }
  };

  return {
    isOnline,
    isReconnecting,
    connectionType,
    testConnectivity
  };
};

// Hook for handling offline-first behavior
export const useOfflineState = () => {
  const { isOnline } = useNetworkStatus();
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  useEffect(() => {
    // Check if we have offline data available
    const checkOfflineData = async () => {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          const hasData = cacheNames.length > 0;
          setHasOfflineData(hasData);
        }
      } catch (error) {
        console.warn('Error checking offline data:', error);
      }
    };

    checkOfflineData();
  }, []);

  const addToOfflineQueue = (action) => {
    setOfflineQueue(prev => [...prev, { ...action, timestamp: Date.now() }]);
  };

  const processOfflineQueue = async () => {
    if (!isOnline || offlineQueue.length === 0) return;

    console.warn(`🔄 Processing ${offlineQueue.length} offline actions`);
    
    for (const action of offlineQueue) {
      try {
        // Process the queued action
        await action.execute();
        console.warn('✅ Processed offline action:', action.type);
      } catch (error) {
        console.error('❌ Failed to process offline action:', action.type, error);
      }
    }

    setOfflineQueue([]);
  };

  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline]);

  return {
    isOnline,
    offlineQueue,
    hasOfflineData,
    addToOfflineQueue,
    processOfflineQueue
  };
};

// Hook for handling API requests with offline support
export const useOfflineAPI = () => {
  const { isOnline } = useNetworkStatus();
  const { addToOfflineQueue } = useOfflineState();

  const request = async (url, options = {}) => {
    if (isOnline) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        if (error.message.includes('Failed to fetch')) {
          // Network error, add to offline queue if it's a write operation
          if (options.method && options.method !== 'GET') {
            addToOfflineQueue({
              type: 'api_request',
              url,
              options,
              execute: () => fetch(url, options)
            });
          }
          throw new Error('Network unavailable. Request queued for when connection returns.');
        }
        throw error;
      }
    } else {
      // Offline handling
      if (options.method && options.method !== 'GET') {
        addToOfflineQueue({
          type: 'api_request',
          url,
          options,
          execute: () => fetch(url, options)
        });
        throw new Error('Currently offline. Request will be processed when connection returns.');
      } else {
        // Try to get from cache for GET requests
        try {
          const cache = await caches.open('api-cache');
          const cachedResponse = await cache.match(url);
          if (cachedResponse) {
            return cachedResponse;
          }
        } catch (error) {
          console.warn('Cache access failed:', error);
        }
        throw new Error('No cached data available for this request.');
      }
    }
  };

  return { request, isOnline };
};