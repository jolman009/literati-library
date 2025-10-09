// src/hooks/useOfflineDetection.js
// React hook for offline/online detection and network monitoring

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect and monitor network status
 * Returns: { isOnline, isOffline, effectiveType, downlink, rtt }
 */
export function useOfflineDetection() {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    effectiveType: null,
    downlink: null,
    rtt: null,
    lastOnline: navigator.onLine ? Date.now() : null,
    lastOffline: !navigator.onLine ? Date.now() : null,
  });

  // Update network connection info
  const updateConnectionInfo = useCallback(() => {
    if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      setNetworkStatus(prev => ({
        ...prev,
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
      }));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: ONLINE');
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        isOffline: false,
        lastOnline: Date.now(),
      }));
      updateConnectionInfo();

      // Dispatch custom event for sync manager
      window.dispatchEvent(new CustomEvent('network-online'));
    };

    const handleOffline = () => {
      console.log('📵 Network: OFFLINE');
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isOffline: true,
        lastOffline: Date.now(),
      }));

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('network-offline'));
    };

    const handleConnectionChange = () => {
      updateConnectionInfo();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', handleConnectionChange);
    }

    // Initial connection info
    updateConnectionInfo();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateConnectionInfo]);

  return networkStatus;
}

/**
 * Hook to check if a specific resource is available offline
 */
export function useOfflineResource(url) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkCache() {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();

          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const response = await cache.match(url);

            if (response) {
              setIsAvailable(true);
              setIsChecking(false);
              return;
            }
          }
        }

        setIsAvailable(false);
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking offline resource:', error);
        setIsAvailable(false);
        setIsChecking(false);
      }
    }

    if (url) {
      checkCache();
    }
  }, [url]);

  return { isAvailable, isChecking };
}

/**
 * Enhanced network status with server connectivity check
 */
export function useNetworkStatus() {
  const offlineDetection = useOfflineDetection();
  const [serverReachable, setServerReachable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkServerConnectivity = useCallback(async () => {
    if (!offlineDetection.isOnline) {
      setServerReachable(false);
      return false;
    }

    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/health', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const reachable = response.ok;
      setServerReachable(reachable);
      setIsChecking(false);
      return reachable;
    } catch (error) {
      console.log('Server unreachable:', error.message);
      setServerReachable(false);
      setIsChecking(false);
      return false;
    }
  }, [offlineDetection.isOnline]);

  useEffect(() => {
    // Check server connectivity when online status changes
    if (offlineDetection.isOnline) {
      checkServerConnectivity();
    } else {
      setServerReachable(false);
    }
  }, [offlineDetection.isOnline, checkServerConnectivity]);

  return {
    ...offlineDetection,
    serverReachable,
    isChecking,
    checkServerConnectivity,
    fullyOnline: offlineDetection.isOnline && serverReachable,
  };
}
