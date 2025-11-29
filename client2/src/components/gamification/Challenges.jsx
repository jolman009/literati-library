// src/components/gamification/Challenges.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import ChallengeCard from './ChallengeCard';
import API from '../../config/api';
import './Challenges.css';

/**
 * Challenges Component
 * Displays daily and weekly challenges with progress tracking
 *
 * @param {boolean} showWeekly - Show weekly challenges tab
 * @param {boolean} compact - Use compact styling
 * @param {boolean} showOnlyDaily - Only show daily challenges (no tabs)
 * @param {number} maxChallenges - Limit number of challenges shown
 */
const Challenges = ({ showWeekly = true, compact = false, showOnlyDaily = false, maxChallenges = null }) => {
  const { user } = useAuth();
  const { trackAction, refreshStats } = useGamification();

  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyResetTime, setDailyResetTime] = useState(null);
  const [weeklyResetTime, setWeeklyResetTime] = useState(null);

  // Fetch challenges from API
  const fetchChallenges = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await API.get('/api/challenges/all');
      const data = response.data;

      setDailyChallenges(data.daily?.challenges || []);
      setWeeklyChallenges(data.weekly?.challenges || []);
      setDailyResetTime(data.daily?.resets_at);
      setWeeklyResetTime(data.weekly?.resets_at);

    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Listen for gamification updates to refresh challenges
  useEffect(() => {
    const handleGamificationUpdate = () => {
      // Debounce the refresh
      setTimeout(fetchChallenges, 1000);
    };

    window.addEventListener('gamificationUpdate', handleGamificationUpdate);
    return () => {
      window.removeEventListener('gamificationUpdate', handleGamificationUpdate);
    };
  }, [fetchChallenges]);

  // Claim reward handler
  const handleClaimReward = async (challengeId, type, periodStart) => {
    try {
      const response = await API.post(`/api/challenges/${challengeId}/claim`, {
        type,
        period_start: periodStart
      });

      if (response.data.success) {
        // Track the reward in gamification
        trackAction('challenge_completed', {
          challenge_id: challengeId,
          type,
          points: response.data.reward_points
        });

        // Refresh challenges and stats
        await fetchChallenges();
        await refreshStats();
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
      throw err;
    }
  };

  // Calculate time until reset
  const getTimeUntilReset = (resetTime) => {
    if (!resetTime) return null;

    const now = new Date();
    const reset = new Date(resetTime);
    const diff = reset - now;

    if (diff <= 0) return 'Resetting...';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  // Calculate completion stats
  const getDailyStats = () => {
    const completed = dailyChallenges.filter(c => c.is_completed).length;
    const claimed = dailyChallenges.filter(c => c.reward_claimed).length;
    return { completed, claimed, total: dailyChallenges.length };
  };

  const getWeeklyStats = () => {
    const completed = weeklyChallenges.filter(c => c.is_completed).length;
    const claimed = weeklyChallenges.filter(c => c.reward_claimed).length;
    return { completed, claimed, total: weeklyChallenges.length };
  };

  if (loading) {
    return (
      <div className="challenges-container loading">
        <div className="challenges-skeleton">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="challenges-container error">
        <div className="challenges-error">
          <span className="material-symbols-outlined">error</span>
          <p>{error}</p>
          <button onClick={fetchChallenges} className="retry-btn">
            <span className="material-symbols-outlined">refresh</span>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const dailyStats = getDailyStats();
  const weeklyStats = getWeeklyStats();

  // Apply maxChallenges limit if set
  const displayDailyChallenges = maxChallenges
    ? dailyChallenges.slice(0, maxChallenges)
    : dailyChallenges;
  const displayWeeklyChallenges = maxChallenges
    ? weeklyChallenges.slice(0, maxChallenges)
    : weeklyChallenges;

  // For showOnlyDaily mode, force daily tab and hide navigation
  const effectiveTab = showOnlyDaily ? 'daily' : activeTab;
  const hideNavigation = showOnlyDaily;

  return (
    <div className={`challenges-container ${compact ? 'compact' : ''}`}>
      {/* Tab Navigation - hidden in showOnlyDaily mode */}
      {!hideNavigation && (
        <div className="challenges-tabs">
          <button
            className={`challenges-tab ${effectiveTab === 'daily' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily')}
          >
            <span className="material-symbols-outlined">today</span>
            <span className="tab-label">Daily</span>
            <span className="tab-badge">
              {dailyStats.claimed}/{dailyStats.total}
            </span>
          </button>

          {showWeekly && (
            <button
              className={`challenges-tab ${effectiveTab === 'weekly' ? 'active' : ''}`}
              onClick={() => setActiveTab('weekly')}
            >
              <span className="material-symbols-outlined">calendar_today</span>
              <span className="tab-label">Weekly</span>
              <span className="tab-badge">
                {weeklyStats.claimed}/{weeklyStats.total}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Reset Timer */}
      <div className="challenges-reset-timer">
        <span className="material-symbols-outlined">schedule</span>
        <span>
          {effectiveTab === 'daily' ? 'Daily reset' : 'Weekly reset'} in{' '}
          <strong>
            {effectiveTab === 'daily'
              ? getTimeUntilReset(dailyResetTime)
              : getTimeUntilReset(weeklyResetTime)}
          </strong>
        </span>
      </div>

      {/* Challenge Cards */}
      <div className="challenges-grid">
        {effectiveTab === 'daily' && displayDailyChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onClaim={handleClaimReward}
            compact={compact}
          />
        ))}

        {effectiveTab === 'weekly' && displayWeeklyChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onClaim={handleClaimReward}
            compact={compact}
          />
        ))}
      </div>

      {/* Summary Footer - hidden in compact mode */}
      {!compact && (
        <div className="challenges-summary">
          <div className="summary-stat">
            <span className="material-symbols-outlined">check_circle</span>
            <span>
              {effectiveTab === 'daily' ? dailyStats.completed : weeklyStats.completed} completed
            </span>
          </div>
          <div className="summary-stat">
            <span className="material-symbols-outlined">redeem</span>
            <span>
              {effectiveTab === 'daily' ? dailyStats.claimed : weeklyStats.claimed} claimed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;
