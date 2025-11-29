// src/pages/LeaderboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import API from '../config/api';
import '../styles/leaderboard.css';

/**
 * LeaderboardPage - Rankings with social features
 * Supports global, weekly, monthly, and friends leaderboards
 */
const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { actualTheme } = useMaterial3Theme();

  // State
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('weekly');
  const [sortBy, setSortBy] = useState('points');
  const [resetTime, setResetTime] = useState(null);

  // Social features state
  const [following, setFollowing] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let endpoint = '/api/leaderboard/';
      const params = new URLSearchParams();

      switch (activeTab) {
        case 'global':
          endpoint += 'global';
          params.append('sort', sortBy);
          break;
        case 'weekly':
          endpoint += 'weekly';
          break;
        case 'monthly':
          endpoint += 'monthly';
          break;
        case 'friends':
          endpoint += 'friends';
          break;
        default:
          endpoint += 'weekly';
      }

      const response = await API.get(`${endpoint}?${params.toString()}`);
      const data = response.data;

      setLeaderboard(data.leaderboard || []);
      setUserRank(data.user_rank);
      setResetTime(data.resets_at);

    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, sortBy]);

  // Fetch following list
  const fetchFollowing = useCallback(async () => {
    if (!user) return;

    try {
      const response = await API.get('/api/leaderboard/following');
      setFollowing(response.data.following || []);
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
    fetchFollowing();
  }, [fetchLeaderboard, fetchFollowing]);

  // Search users
  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await API.get(`/api/leaderboard/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  // Follow/Unfollow user
  const handleFollow = async (targetUserId, isFollowing) => {
    try {
      if (isFollowing) {
        await API.delete(`/api/leaderboard/follow/${targetUserId}`);
      } else {
        await API.post(`/api/leaderboard/follow/${targetUserId}`);
      }
      // Refresh data
      await fetchFollowing();
      if (activeTab === 'friends') {
        await fetchLeaderboard();
      }
      // Update search results
      if (searchResults.length > 0) {
        setSearchResults(prev =>
          prev.map(u =>
            u.id === targetUserId ? { ...u, is_following: !isFollowing } : u
          )
        );
      }
    } catch (err) {
      console.error('Error updating follow:', err);
    }
  };

  // Get rank badge style
  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return { className: 'rank-gold', emoji: '🥇' };
      case 2:
        return { className: 'rank-silver', emoji: '🥈' };
      case 3:
        return { className: 'rank-bronze', emoji: '🥉' };
      default:
        return { className: 'rank-default', emoji: null };
    }
  };

  // Format time until reset
  const getTimeUntilReset = () => {
    if (!resetTime) return null;

    const now = new Date();
    const reset = new Date(resetTime);
    const diff = reset - now;

    if (diff <= 0) return 'Resetting...';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className={`leaderboard-page ${actualTheme === 'dark' ? 'dark' : ''}`}>
      {/* Header */}
      <div className="leaderboard-header">
        <button
          className="leaderboard-back-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="leaderboard-title">Leaderboard</h1>
        <button
          className="leaderboard-search-btn"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Search users"
        >
          <span className="material-symbols-outlined">
            {showSearch ? 'close' : 'person_search'}
          </span>
        </button>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="leaderboard-search-panel">
          <div className="search-input-wrapper">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search readers to follow..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              autoFocus
            />
          </div>

          {searching && (
            <div className="search-loading">
              <span className="material-symbols-outlined spinning">sync</span>
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div key={result.id} className="search-result-item">
                  <div className="user-avatar">
                    {result.avatar ? (
                      <img src={result.avatar} alt={result.name} />
                    ) : (
                      <span className="material-symbols-outlined">person</span>
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{result.name}</span>
                    {result.total_points !== null && (
                      <span className="user-stats">
                        {result.total_points?.toLocaleString()} pts
                        {result.reading_streak > 0 && ` • ${result.reading_streak}🔥`}
                      </span>
                    )}
                    {result.is_private && (
                      <span className="private-badge">Private</span>
                    )}
                  </div>
                  <button
                    className={`follow-btn ${result.is_following ? 'following' : ''}`}
                    onClick={() => handleFollow(result.id, result.is_following)}
                  >
                    {result.is_following ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="no-results">
              <span className="material-symbols-outlined">person_off</span>
              <p>No readers found</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="leaderboard-tabs">
        <button
          className={`lb-tab ${activeTab === 'weekly' ? 'active' : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          <span className="material-symbols-outlined">calendar_today</span>
          Weekly
        </button>
        <button
          className={`lb-tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          <span className="material-symbols-outlined">event</span>
          Monthly
        </button>
        <button
          className={`lb-tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          <span className="material-symbols-outlined">public</span>
          All Time
        </button>
        <button
          className={`lb-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <span className="material-symbols-outlined">group</span>
          Friends
          {following.length > 0 && (
            <span className="friend-count">{following.length}</span>
          )}
        </button>
      </div>

      {/* Reset Timer for timed leaderboards */}
      {(activeTab === 'weekly' || activeTab === 'monthly') && resetTime && (
        <div className="leaderboard-reset-timer">
          <span className="material-symbols-outlined">schedule</span>
          <span>Resets in <strong>{getTimeUntilReset()}</strong></span>
        </div>
      )}

      {/* Sort Options for Global */}
      {activeTab === 'global' && (
        <div className="leaderboard-sort">
          <span>Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="points">Total Points</option>
            <option value="streak">Reading Streak</option>
            <option value="books">Books Completed</option>
            <option value="time">Reading Time</option>
          </select>
        </div>
      )}

      {/* User's Current Rank Card */}
      {userRank && (
        <div className="user-rank-card">
          <div className="your-rank-label">Your Rank</div>
          <div className="your-rank-content">
            <span className={`rank-badge ${getRankStyle(userRank.rank).className}`}>
              {getRankStyle(userRank.rank).emoji || `#${userRank.rank}`}
            </span>
            <div className="your-stats">
              <span className="your-points">{userRank.total_points?.toLocaleString()} pts</span>
              {userRank.reading_streak > 0 && (
                <span className="your-streak">{userRank.reading_streak} day streak 🔥</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="leaderboard-loading">
          <div className="spinner" />
          <p>Loading rankings...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="leaderboard-error">
          <span className="material-symbols-outlined">error</span>
          <p>{error}</p>
          <button onClick={fetchLeaderboard}>Retry</button>
        </div>
      )}

      {/* Leaderboard List */}
      {!loading && !error && (
        <div className="leaderboard-list">
          {leaderboard.length === 0 ? (
            <div className="leaderboard-empty">
              <span className="material-symbols-outlined">
                {activeTab === 'friends' ? 'group_add' : 'leaderboard'}
              </span>
              <h3>
                {activeTab === 'friends'
                  ? 'No friends yet'
                  : 'No rankings yet'}
              </h3>
              <p>
                {activeTab === 'friends'
                  ? 'Follow other readers to see them here!'
                  : 'Start reading to appear on the leaderboard!'}
              </p>
              {activeTab === 'friends' && (
                <button
                  className="find-friends-btn"
                  onClick={() => setShowSearch(true)}
                >
                  <span className="material-symbols-outlined">person_search</span>
                  Find Readers
                </button>
              )}
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const rankStyle = getRankStyle(entry.rank);
              const isCurrentUser = entry.is_current_user;
              const followingIds = new Set(following.map(f => f.id));

              return (
                <div
                  key={entry.id}
                  className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''} ${rankStyle.className}`}
                >
                  {/* Rank */}
                  <div className="entry-rank">
                    {rankStyle.emoji ? (
                      <span className="rank-emoji">{rankStyle.emoji}</span>
                    ) : (
                      <span className="rank-number">#{entry.rank}</span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="entry-user">
                    <div className="user-avatar">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.name} />
                      ) : (
                        <span className="material-symbols-outlined">person</span>
                      )}
                    </div>
                    <div className="user-details">
                      <span className="user-name">
                        {entry.name}
                        {isCurrentUser && <span className="you-badge">You</span>}
                        {entry.is_anonymous && (
                          <span className="anonymous-badge">Anonymous</span>
                        )}
                      </span>
                      <span className="user-secondary">
                        {entry.books_completed} books • {entry.reading_streak}🔥 streak
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="entry-points">
                    <span className="points-value">
                      {entry.total_points?.toLocaleString()}
                    </span>
                    <span className="points-label">pts</span>
                  </div>

                  {/* Follow Button (not for self) */}
                  {!isCurrentUser && !entry.is_anonymous && (
                    <button
                      className={`entry-follow-btn ${followingIds.has(entry.id) ? 'following' : ''}`}
                      onClick={() => handleFollow(entry.id, followingIds.has(entry.id))}
                    >
                      <span className="material-symbols-outlined">
                        {followingIds.has(entry.id) ? 'person_remove' : 'person_add'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Following List (for friends tab) */}
      {activeTab === 'friends' && following.length > 0 && (
        <div className="following-section">
          <h3 className="following-header">
            <span className="material-symbols-outlined">group</span>
            Following ({following.length})
          </h3>
          <div className="following-list">
            {following.slice(0, 5).map((user) => (
              <div key={user.id} className="following-chip">
                <span className="chip-name">{user.name}</span>
                <span className="chip-points">{user.total_points?.toLocaleString()}</span>
              </div>
            ))}
            {following.length > 5 && (
              <span className="more-following">+{following.length - 5} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
