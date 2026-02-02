import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationPanel.css';

const NOTIFICATION_URL_MAP = {
  achievement_unlocked: '/achievements',
  level_up: '/dashboard',
  streak_milestone: '/dashboard',
  streak_shield: '/dashboard',
  streak_warning: '/dashboard',
  challenge_completed: '/dashboard',
  goal_completed: '/progress',
  new_follower: '/leaderboard',
};

const NOTIFICATION_ICON_MAP = {
  achievement_unlocked: 'emoji_events',
  level_up: 'arrow_upward',
  streak_milestone: 'local_fire_department',
  streak_shield: 'shield',
  streak_warning: 'warning',
  challenge_completed: 'military_tech',
  goal_completed: 'flag',
  new_follower: 'person_add',
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    const url = notification.data?.url || NOTIFICATION_URL_MAP[notification.type] || '/dashboard';
    navigate(url);
    onClose();
  };

  return (
    <div className="notification-panel" ref={panelRef}>
      <div className="notification-panel-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button className="notification-mark-all" onClick={markAllAsRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-panel-list">
        {loading && notifications.length === 0 && (
          <div className="notification-empty">Loading...</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="notification-empty">
            <span className="material-symbols-outlined">notifications_none</span>
            <p>No notifications yet</p>
          </div>
        )}

        {notifications.map((n) => (
          <button
            key={n.id}
            className={`notification-item ${n.read ? '' : 'notification-unread'}`}
            onClick={() => handleNotificationClick(n)}
          >
            <span className="material-symbols-outlined notification-icon">
              {n.icon || NOTIFICATION_ICON_MAP[n.type] || 'notifications'}
            </span>
            <div className="notification-content">
              <span className="notification-title">{n.title}</span>
              <span className="notification-body">{n.body}</span>
              <span className="notification-time">{timeAgo(n.created_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
