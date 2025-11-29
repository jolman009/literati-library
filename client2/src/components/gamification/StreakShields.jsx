// src/components/gamification/StreakShields.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import API from '../../config/api';
import './StreakShields.css';

/**
 * StreakShields Component
 * Displays user's streak shields and allows using them
 * Shields are earned at 7-day streak milestones (7, 14, 21, etc.)
 */
const StreakShields = ({ compact = false, showHistory = false }) => {
  const { user } = useAuth();
  const { stats, refreshStats } = useGamification();

  const [shields, setShields] = useState(0);
  const [maxShields, setMaxShields] = useState(3);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [using, setUsing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch shield data
  const fetchShields = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await API.get('/api/gamification/streak-shields');
      const data = response.data;

      setShields(data.shields || 0);
      setMaxShields(data.max_shields || 3);
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching streak shields:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchShields();
  }, [fetchShields]);

  // Listen for shield earned events
  useEffect(() => {
    const handleGamificationUpdate = (event) => {
      if (event.detail?.shieldEarned) {
        fetchShields();
        setNotification({
          type: 'earned',
          message: 'You earned a Streak Shield!'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    };

    window.addEventListener('gamificationUpdate', handleGamificationUpdate);
    return () => {
      window.removeEventListener('gamificationUpdate', handleGamificationUpdate);
    };
  }, [fetchShields]);

  // Use a shield
  const handleUseShield = async () => {
    if (using || shields <= 0) return;

    try {
      setUsing(true);
      const response = await API.post('/api/gamification/streak-shields/use');

      if (response.data.success) {
        setShields(response.data.shields_remaining);
        setNotification({
          type: 'used',
          message: response.data.message
        });
        setTimeout(() => setNotification(null), 3000);

        // Refresh stats to update streak display
        await refreshStats();
        await fetchShields();
      }
    } catch (error) {
      console.error('Error using shield:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.error || 'Failed to use shield'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUsing(false);
    }
  };

  // Check if streak is at risk (no activity today and had a streak)
  const isStreakAtRisk = () => {
    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem('lastActivityDate');
    return lastActivity !== today && (stats?.readingStreak || 0) > 0;
  };

  // Format history date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading && !compact) {
    return (
      <div className="streak-shields loading">
        <div className="shield-skeleton" />
      </div>
    );
  }

  // Compact version for dashboard widgets
  if (compact) {
    return (
      <div className="streak-shields compact">
        <div className="shield-compact-display">
          <div className="shield-icons">
            {[...Array(maxShields)].map((_, i) => (
              <span
                key={i}
                className={`shield-icon ${i < shields ? 'active' : 'empty'}`}
              >
                🛡️
              </span>
            ))}
          </div>
          <span className="shield-count">{shields}/{maxShields}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="streak-shields">
      {/* Notification Toast */}
      {notification && (
        <div className={`shield-notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'earned' ? '🎉' : notification.type === 'used' ? '🛡️' : '⚠️'}
          </span>
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      {/* Shield Display */}
      <div className="shield-display">
        <div className="shield-header">
          <h3 className="shield-title">
            <span className="material-symbols-outlined">shield</span>
            Streak Shields
          </h3>
          <button
            className="shield-info-btn"
            onClick={() => setShowTooltip(!showTooltip)}
            aria-label="Shield info"
          >
            <span className="material-symbols-outlined">info</span>
          </button>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="shield-tooltip">
            <p><strong>How Streak Shields Work:</strong></p>
            <ul>
              <li>Earn 1 shield every 7-day streak milestone</li>
              <li>Use a shield to protect your streak on days you can't read</li>
              <li>Maximum of {maxShields} shields can be stored</li>
            </ul>
            <button onClick={() => setShowTooltip(false)}>Got it!</button>
          </div>
        )}

        {/* Shield Icons */}
        <div className="shield-visual">
          <div className="shield-icons-large">
            {[...Array(maxShields)].map((_, i) => (
              <div
                key={i}
                className={`shield-icon-container ${i < shields ? 'active' : 'empty'}`}
              >
                <span className="shield-emoji">🛡️</span>
                {i < shields && <span className="shield-glow" />}
              </div>
            ))}
          </div>
          <div className="shield-count-text">
            <span className="count-current">{shields}</span>
            <span className="count-separator">/</span>
            <span className="count-max">{maxShields}</span>
          </div>
        </div>

        {/* Next Shield Progress */}
        {stats?.readingStreak > 0 && (
          <div className="next-shield-progress">
            <span className="progress-label">Next shield in</span>
            <span className="progress-value">
              {7 - (stats.readingStreak % 7)} days
            </span>
          </div>
        )}

        {/* Use Shield Button */}
        {shields > 0 && (
          <button
            className={`use-shield-btn ${using ? 'using' : ''} ${isStreakAtRisk() ? 'recommended' : ''}`}
            onClick={handleUseShield}
            disabled={using}
          >
            {using ? (
              <>
                <span className="material-symbols-outlined spinning">sync</span>
                Activating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">security</span>
                {isStreakAtRisk() ? 'Protect Your Streak!' : 'Use Shield'}
              </>
            )}
          </button>
        )}

        {/* No shields message */}
        {shields === 0 && (
          <div className="no-shields-message">
            <span className="material-symbols-outlined">info</span>
            <p>Keep your streak going to earn shields!</p>
          </div>
        )}
      </div>

      {/* History Section */}
      {showHistory && history.length > 0 && (
        <div className="shield-history">
          <h4 className="history-title">Shield History</h4>
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className={`history-item ${item.action}`}>
                <span className="history-icon">
                  {item.action === 'earned' ? '✨' : item.action === 'used' ? '🛡️' : '⏰'}
                </span>
                <div className="history-details">
                  <span className="history-action">
                    {item.action === 'earned' ? 'Shield Earned' : 'Shield Used'}
                  </span>
                  <span className="history-info">
                    {item.streak_at_action && `At ${item.streak_at_action}-day streak`}
                  </span>
                </div>
                <span className="history-date">{formatDate(item.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakShields;
