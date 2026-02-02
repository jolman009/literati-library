import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import API from '../config/api';
import { registerWebPush, unregisterWebPush, isWebPushSubscribed } from '../services/pushNotifications';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

const POLL_INTERVAL = 60_000; // 60 seconds

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const pollRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await API.get('/api/notifications/unread-count');
      const count = data?.count ?? 0;
      setUnreadCount(count);
      // Update browser badge if available
      if ('setAppBadge' in navigator) {
        count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
      }
    } catch {
      // Silent fail — badge count is non-critical
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (limit = 20, offset = 0) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await API.get('/api/notifications', {
        params: { limit, offset },
      });
      setNotifications(data?.notifications || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id) => {
    try {
      await API.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      if ('setAppBadge' in navigator) {
        const newCount = Math.max(0, unreadCount - 1);
        newCount > 0 ? navigator.setAppBadge(newCount) : navigator.clearAppBadge();
      }
    } catch {
      // Silent fail
    }
  }, [unreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await API.post('/api/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      if ('clearAppBadge' in navigator) navigator.clearAppBadge();
    } catch {
      // Silent fail
    }
  }, []);

  const enablePushNotifications = useCallback(async () => {
    try {
      const sub = await registerWebPush();
      if (sub) {
        setIsPushSubscribed(true);
        setPushPermission(Notification.permission);
      }
      return !!sub;
    } catch {
      return false;
    }
  }, []);

  const disablePushNotifications = useCallback(async () => {
    try {
      await unregisterWebPush();
      setIsPushSubscribed(false);
    } catch {
      // Silent fail
    }
  }, []);

  // Check push subscription status on mount
  useEffect(() => {
    if (isAuthenticated) {
      isWebPushSubscribed().then(setIsPushSubscribed);
    }
  }, [isAuthenticated]);

  // Poll for unread count when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        pushPermission,
        isPushSubscribed,
        enablePushNotifications,
        disablePushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
