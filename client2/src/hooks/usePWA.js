import { useState, useEffect, useCallback } from 'react';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notification, setNotification] = useState({
    permission: 'default',
    supported: false
  });

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsStandalone(true);
      setIsInstalled(true);
    }

    // Check notification support with safety check
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotification({
        permission: Notification.permission,
        supported: true
      });
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (!installPrompt) return false;
    const result = await installPrompt.prompt();
    setInstallPrompt(null);
    return result.outcome === 'accepted';
  }, [installPrompt]);

  const setBadge = useCallback((count) => {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count);
    }
  }, []);

  const clearBadge = useCallback(() => {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!notification.supported || typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotification(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [notification.supported]);

  const showNotification = useCallback((title, options = {}) => {
    if (notification.permission !== 'granted') {
      return false;
    }

    try {
      const notificationOptions = {
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        ...options
      };

      const n = new Notification(title, notificationOptions);

      // Auto-close after 5 seconds if not clicked
      setTimeout(() => {
        if (n) n.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }, [notification.permission]);

  return {
    isInstalled,
    canInstall: !!installPrompt,
    isStandalone,
    isOnline,
    notification,
    installPWA,
    requestNotificationPermission,
    showNotification,
    setBadge,
    clearBadge
  };
};