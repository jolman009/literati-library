// src/components/gamification/PointsHistory.jsx
import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import API from '../../config/api';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import './PointsHistory.css';

const PointsHistory = ({ limit = 10 }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { actualTheme } = useMaterial3Theme();

  useEffect(() => {
    fetchHistory();
  }, [limit]);

  // Local fallback mapping for display label/icon
  const getDisplayIconName = (action) => {
    try {
      const key = String(action?.action || '').toLowerCase();
      if (key === 'achievement_unlocked') return 'trophy';
      if (key.includes('reading')) return 'reading';
      if (key.includes('upload')) return 'upload';
      if (key.includes('note')) return 'note';
      if (key.includes('highlight')) return 'highlight';
      return 'star';
    } catch {
      return 'star';
    }
  };

  const getDisplayLabel = (action) => {
    try {
      if (action?.action === 'achievement_unlocked') {
        const title = action?.data?.title;
        return title ? `Achievement: ${title}` : 'Achievement Unlocked';
      }
      if (action?.label) return action.label;
      const name = String(action?.action || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return name || 'Activity';
    } catch {
      return 'Activity';
    }
  };

  // 🔔 Listen for gamification updates and auto-refresh history
  useEffect(() => {
    console.log('🔧 PointsHistory: Setting up gamificationUpdate event listener');

    const handleGamificationUpdate = (event) => {
      console.log('🔔 PointsHistory: Received gamificationUpdate event', event.detail);
      console.log('📊 PointsHistory: Auto-refreshing history after action:', event.detail.action);
      fetchHistory();
    };

    window.addEventListener('gamificationUpdate', handleGamificationUpdate);
    console.log('👂 PointsHistory: Listening for gamificationUpdate events');

    return () => {
      window.removeEventListener('gamificationUpdate', handleGamificationUpdate);
      console.log('👋 PointsHistory: Stopped listening for gamificationUpdate events');
    };
  }, [limit]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📊 PointsHistory: Fetching history (limit: ${limit})...`);
      const response = await API.get(`/api/gamification/actions/history?limit=${limit}`);
      const serverData = response.data || [];
      let localData = [];
      try {
        if (typeof window !== 'undefined') {
          const u = (JSON.parse(localStorage.getItem('shelfquest_user')||'null')||{});
          if (u?.id) {
            localData = JSON.parse(localStorage.getItem(`gamification_actions_${u.id}`)||'[]');
          }
        }
      } catch {}
      const byKey = new Map();
      [...serverData, ...localData].forEach(item => {
        const key = `${item.created_at || ''}_${item.action || ''}`;
        if (!byKey.has(key)) byKey.set(key, item);
      });
      const merged = Array.from(byKey.values()).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at)).slice(0, limit);
      setHistory(merged);
      console.log(`✅ PointsHistory: Fetched ${response.data?.length || 0} history entries`);
    } catch (err) {
      console.error('❌ PointsHistory: Failed to fetch points history:', err);
      setError(err.message);
      try {
        const u=(JSON.parse(localStorage.getItem('shelfquest_user')||'null')||{});
        if(u?.id){
          const localOnly=JSON.parse(localStorage.getItem(`gamification_actions_${u.id}`)||'[]');
          setHistory(localOnly.slice(0, limit));
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Group actions by date for better organization
  const groupedHistory = history.reduce((groups, action) => {
    const date = new Date(action.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(action);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className={`points-history-container ${actualTheme === 'dark' ? 'dark' : ''}`}>
        <div className="points-history-header">
          <h3 className="points-history-title">
            <Icon name="bar_chart" size={16} /> Points History
          </h3>
        </div>
        <div className="points-history-loading">
          <div className="loading-shimmer" style={{ height: '60px', marginBottom: '8px', borderRadius: '8px' }}></div>
          <div className="loading-shimmer" style={{ height: '60px', marginBottom: '8px', borderRadius: '8px' }}></div>
          <div className="loading-shimmer" style={{ height: '60px', borderRadius: '8px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`points-history-container ${actualTheme === 'dark' ? 'dark' : ''}`}>
        <div className="points-history-header">
          <h3 className="points-history-title">
            📊 Points History
          </h3>
        </div>
        <div className="points-history-error">
          <p>Failed to load points history</p>
          <button onClick={fetchHistory} className="retry-button">
            <Icon name="refresh" size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`points-history-container ${actualTheme === 'dark' ? 'dark' : ''}`}>
        <div className="points-history-header">
          <h3 className="points-history-title">
            <Icon name="bar_chart" size={16} /> Points History
          </h3>
        </div>
        <div className="points-history-empty">
          <span style={{ fontSize: '3rem', opacity: 0.5 }}><Icon name="rocket" size={32} /></span>
          <p>No activity yet</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            Start reading, taking notes, or uploading books to earn points!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`points-history-container ${actualTheme === 'dark' ? 'dark' : ''}`}>
      <div className="points-history-header">
        <h3 className="points-history-title">
          <Icon name="bar_chart" size={16} /> Points History
        </h3>
        <button onClick={fetchHistory} className="refresh-button" title="Refresh history">
          <Icon name="refresh" size={14} />
        </button>
      </div>

      <div className="points-history-list">
        {Object.entries(groupedHistory).map(([date, actions]) => (
          <div key={date} className="points-history-date-group">
            <div className="points-history-date-header">{date}</div>
            <div className="points-history-items">
              {actions.map((action, index) => (
                <div key={action.id || index} className="points-history-item">
                  <div className="points-history-item-icon">
                    <Icon name={getDisplayIconName(action)} size={16} />
                  </div>
                  <div className="points-history-item-content">
                    <div className="points-history-item-label">
                      {getDisplayLabel(action)}
                      {(action.pending || String(action.id || '').startsWith('local_')) && (
                        <span
                          title="Pending sync"
                          style={{
                            marginLeft: 8,
                            fontSize: '0.7rem',
                            color: 'var(--color-muted, #94a3b8)',
                            border: '1px solid rgba(148,163,184,0.4)',
                            borderRadius: '8px',
                            padding: '2px 6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Icon name="hourglass_empty" size={12} /> pending
                        </span>
                      )}
                    </div>
                    <div className="points-history-item-time">
                      {action.timeAgo}
                    </div>
                  </div>
                  <div className="points-history-item-points">
                    <span className="points-badge">
                      +{action.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="points-history-footer">
        <span className="points-history-total">
          Total: {history.reduce((sum, action) => sum + (action.points || 0), 0)} points
        </span>
      </div>
    </div>
  );
};

export default PointsHistory;
