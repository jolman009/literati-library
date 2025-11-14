import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { MD3Card, MD3Button } from '../components/Material3';
import ReadingHeatmap from '../components/analytics/ReadingHeatmap';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import analyticsService from '../services/analytics';
import '../styles/analytics-page.css';

/**
 * Unified Analytics Page
 * Personal analytics for all users + Admin analytics for admins
 */
const AnalyticsPage = () => {
  const { user, hasRole } = useAuth();
  const { actualTheme } = useMaterial3Theme();

  // Check admin role - simplified for single admin user
  // Since JWT doesn't include roles, check if user is authenticated
  // In a single-admin app, the authenticated user IS the admin
  const isAdmin = user && user.email === 'jolman009@yahoo.com';

  // Debug logging
  console.log('🔍 Analytics Admin Check:', {
    user: user?.name,
    userEmail: user?.email,
    isAdmin,
    fullUser: user
  });

  // State
  const [activeTab, setActiveTab] = useState('personal');
  const [timeframe, setTimeframe] = useState('30d'); // 7d, 30d, 90d, all
  const [personalData, setPersonalData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useFallbackData, setUseFallbackData] = useState(false);

  // Access contexts properly (like Dashboard does)
  const { stats: gamificationStats = {} } = useGamification() || {};
  const { getSessionHistory = () => [] } = useReadingSession() || {};

  // Debug: Log available data
  console.log('📊 Analytics Data Debug:', {
    gamificationStats,
    hasGetSessionHistory: typeof getSessionHistory === 'function',
    sessionHistoryLength: getSessionHistory?.().length
  });

  // Fetch personal analytics (with fallback to gamification data)
  useEffect(() => {
    const fetchPersonalAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/reading-stats?timeframe=${timeframe}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('shelfquest_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPersonalData(data);
          setUseFallbackData(false);
        } else {
          // Use fallback data from gamification context
          console.log('Using fallback data from gamification context');
          setUseFallbackData(true);
        }
      } catch (error) {
        console.log('Analytics API not available, using fallback data');
        setUseFallbackData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalAnalytics();
  }, [timeframe]);

  // Fetch admin analytics (only if admin)
  useEffect(() => {
    if (!isAdmin) return;

    const fetchAdminAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard?timeframe=${timeframe}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('shelfquest_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAdminData(data);
        }
      } catch (error) {
        console.error('Failed to fetch admin analytics:', error);
      }
    };

    fetchAdminAnalytics();
  }, [isAdmin, timeframe]);

  // Get reading sessions from local context
  const readingSessions = useMemo(() => getSessionHistory(), [getSessionHistory]);

  // Theme colors for charts
  const chartColors = {
    primary: actualTheme === 'dark' ? '#24A8E0' : '#1976D2',
    secondary: actualTheme === 'dark' ? '#9C27B0' : '#7B1FA2',
    tertiary: actualTheme === 'dark' ? '#FF9800' : '#F57C00',
    success: actualTheme === 'dark' ? '#4CAF50' : '#388E3C',
    warning: actualTheme === 'dark' ? '#FF9800' : '#F57C00',
    grid: actualTheme === 'dark' ? '#444' : '#e0e0e0',
    text: actualTheme === 'dark' ? '#fff' : '#000'
  };

  // Calculate personal statistics (with fallback to gamification data)
  const personalStats = useMemo(() => {
    // Use gamification stats as fallback
    if (useFallbackData || !personalData) {
      const sessions = readingSessions.length;
      const totalMinutes = readingSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalPages = readingSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
      const activeDays = new Set(readingSessions.map(s => new Date(s.startTime).toDateString())).size;

      const stats = {
        totalSessions: sessions,
        totalTime: totalMinutes,
        averageSession: sessions > 0 ? Math.round(totalMinutes / sessions) : 0,
        averageSpeed: totalMinutes > 0 ? Math.round((totalPages * 250) / totalMinutes) : 0, // Assume 250 words/page
        booksRead: gamificationStats.booksRead || 0,
        activeDays: activeDays
      };

      console.log('📈 Using fallback stats:', { stats, readingSessions, gamificationStats });
      return stats;
    }

    const stats = {
      totalSessions: personalData.stats?.total_sessions || 0,
      totalTime: personalData.stats?.total_reading_time || 0,
      averageSession: personalData.stats?.average_session_duration || 0,
      averageSpeed: personalData.stats?.average_reading_speed || 0,
      booksRead: personalData.stats?.books_read || 0,
      activeDays: personalData.stats?.reading_days || 0
    };

    console.log('📈 Using API stats:', stats);
    return stats;
  }, [personalData, useFallbackData, readingSessions, gamificationStats]);

  // Prepare chart data for reading activity (with fallback)
  const readingActivityData = useMemo(() => {
    const sessions = useFallbackData || !personalData?.sessions ? readingSessions : personalData.sessions;

    if (!sessions || sessions.length === 0) return [];

    // Group sessions by date
    const dateMap = new Map();
    sessions.forEach(session => {
      const timestamp = session.timestamp || session.startTime;
      const date = new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, minutes: 0, pages: 0 });
      }
      const dayData = dateMap.get(date);
      dayData.minutes += parseInt(session.session_duration || session.duration || 0);
      dayData.pages += parseInt(session.pages_read || session.pagesRead || 0);
    });

    return Array.from(dateMap.values()).slice(-30); // Last 30 days
  }, [personalData, useFallbackData, readingSessions]);

  // Calculate WPM (Words Per Minute) data (with fallback)
  const wpmData = useMemo(() => {
    const sessions = useFallbackData || !personalData?.sessions ? readingSessions : personalData.sessions;

    if (!sessions || sessions.length === 0) return [];

    // Calculate WPM from pages read and duration
    return sessions
      .filter(s => {
        const speed = s.reading_speed || s.wpm;
        const duration = s.session_duration || s.duration;
        const pages = s.pages_read || s.pagesRead;
        return speed > 0 || (duration > 0 && pages > 0);
      })
      .slice(-20) // Last 20 sessions
      .map((session, index) => {
        const timestamp = session.timestamp || session.startTime;
        const speed = session.reading_speed || session.wpm;
        const duration = session.session_duration || session.duration;
        const pages = session.pages_read || session.pagesRead;

        // Calculate WPM if not provided (250 words per page)
        const wpm = speed || (pages && duration ? Math.round((pages * 250) / duration) : 0);

        return {
          session: `S${index + 1}`,
          wpm: parseInt(wpm) || 0,
          date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
  }, [personalData, useFallbackData, readingSessions]);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-main">
          <h1 className="page-title">
            <span className="material-symbols-outlined">analytics</span>
            Analytics Dashboard
          </h1>

          {/* Timeframe Selector */}
          <div className="timeframe-selector">
            {['7d', '30d', '90d', 'all'].map(tf => (
              <MD3Button
                key={tf}
                variant={timeframe === tf ? 'filled' : 'outlined'}
                onClick={() => setTimeframe(tf)}
                size="small"
              >
                {tf === '7d' ? 'Week' :
                 tf === '30d' ? 'Month' :
                 tf === '90d' ? '3 Months' : 'All Time'}
              </MD3Button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="analytics-tabs">
          <button
            className={`analytics-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <span className="material-symbols-outlined">person</span>
            <span>Personal Analytics</span>
          </button>

          {isAdmin && (
            <button
              className={`analytics-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span>Admin Dashboard</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                marginLeft: '8px'
              }}>Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Personal Analytics Tab */}
      {activeTab === 'personal' && (
        <div className="personal-analytics">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <MD3Card className="metric-card">
              <div className="metric-icon">
                <span className="material-symbols-outlined">auto_stories</span>
              </div>
              <div className="metric-content">
                <div className="metric-value">{personalStats.totalSessions}</div>
                <div className="metric-label">Reading Sessions</div>
              </div>
            </MD3Card>

            <MD3Card className="metric-card">
              <div className="metric-icon">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div className="metric-content">
                <div className="metric-value">{formatTime(personalStats.totalTime)}</div>
                <div className="metric-label">Total Reading Time</div>
              </div>
            </MD3Card>

            <MD3Card className="metric-card">
              <div className="metric-icon">
                <span className="material-symbols-outlined">speed</span>
              </div>
              <div className="metric-content">
                <div className="metric-value">{personalStats.averageSpeed}</div>
                <div className="metric-label">Pages/Hour</div>
              </div>
            </MD3Card>

            <MD3Card className="metric-card">
              <div className="metric-icon">
                <span className="material-symbols-outlined">local_fire_department</span>
              </div>
              <div className="metric-content">
                <div className="metric-value">{personalStats.activeDays}</div>
                <div className="metric-label">Active Days</div>
              </div>
            </MD3Card>
          </div>

          {/* Reading Heatmap */}
          <MD3Card className="chart-card">
            <h2 className="card-title">
              <span className="material-symbols-outlined">calendar_month</span>
              Reading Activity Heatmap
            </h2>
            <ReadingHeatmap readingSessions={readingSessions} />
          </MD3Card>

          {/* Reading Activity Chart */}
          <MD3Card className="chart-card">
            <h2 className="card-title">
              <span className="material-symbols-outlined">trending_up</span>
              Daily Reading Activity
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={readingActivityData}>
                <defs>
                  <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" stroke={chartColors.text} />
                <YAxis stroke={chartColors.text} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: actualTheme === 'dark' ? '#2a2a2a' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke={chartColors.primary}
                  fillOpacity={1}
                  fill="url(#colorMinutes)"
                  name="Minutes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </MD3Card>

          {/* Reading Speed Trends */}
          {wpmData.length > 0 && (
            <MD3Card className="chart-card">
              <h2 className="card-title">
                <span className="material-symbols-outlined">bolt</span>
                Reading Speed Trends (WPM)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wpmData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="session" stroke={chartColors.text} />
                  <YAxis stroke={chartColors.text} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: actualTheme === 'dark' ? '#2a2a2a' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    stroke={chartColors.secondary}
                    strokeWidth={2}
                    dot={{ fill: chartColors.secondary, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Words Per Minute"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="chart-insights">
                <p>
                  <strong>Average:</strong> {Math.round(wpmData.reduce((sum, d) => sum + d.wpm, 0) / wpmData.length)} WPM
                  {' • '}
                  <strong>Peak:</strong> {Math.max(...wpmData.map(d => d.wpm))} WPM
                </p>
              </div>
            </MD3Card>
          )}

          {/* Insights Section */}
          <div className="insights-grid">
            <MD3Card className="insight-card">
              <h3>📊 Reading Consistency</h3>
              <p>
                You've been active {personalStats.activeDays} days out of the last {timeframe === '7d' ? '7' : timeframe === '30d' ? '30' : '90'} days.
                {personalStats.activeDays / parseInt(timeframe) > 0.7 && " That's excellent consistency!"}
              </p>
            </MD3Card>

            <MD3Card className="insight-card">
              <h3>⏱️ Session Length</h3>
              <p>
                Your average reading session is {formatTime(personalStats.averageSession)}.
                {personalStats.averageSession > 30 && " You have great focus!"}
              </p>
            </MD3Card>

            <MD3Card className="insight-card">
              <h3>🎯 Reading Goal</h3>
              <p>
                At your current pace, you're on track to read approximately{' '}
                {Math.round((personalStats.totalTime / (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90)) * 365 / 300)}{' '}
                books this year!
              </p>
            </MD3Card>
          </div>
        </div>
      )}

      {/* Admin Analytics Tab */}
      {activeTab === 'admin' && isAdmin && (
        <div className="admin-analytics">
          <MD3Card className="admin-notice">
            <span className="material-symbols-outlined">info</span>
            <p>Platform-wide analytics coming soon! This will include user engagement metrics, popular books, feature usage, and more.</p>
          </MD3Card>

          {adminData && (
            <>
              <div className="metrics-grid">
                <MD3Card className="metric-card">
                  <div className="metric-icon">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{adminData.summary?.unique_users || 0}</div>
                    <div className="metric-label">Active Users</div>
                  </div>
                </MD3Card>

                <MD3Card className="metric-card">
                  <div className="metric-icon">
                    <span className="material-symbols-outlined">event</span>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{adminData.summary?.total_events || 0}</div>
                    <div className="metric-label">Total Events</div>
                  </div>
                </MD3Card>

                <MD3Card className="metric-card">
                  <div className="metric-icon">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{adminData.summary?.unique_sessions || 0}</div>
                    <div className="metric-label">Sessions</div>
                  </div>
                </MD3Card>

                <MD3Card className="metric-card">
                  <div className="metric-icon">
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div className="metric-content">
                    <div className="metric-value">{formatTime(adminData.summary?.avg_session_duration || 0)}</div>
                    <div className="metric-label">Avg Session</div>
                  </div>
                </MD3Card>
              </div>

              {/* Top Events */}
              {adminData.events && adminData.events.length > 0 && (
                <MD3Card className="chart-card">
                  <h2 className="card-title">
                    <span className="material-symbols-outlined">bar_chart</span>
                    Top Events
                  </h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={adminData.events.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="event_name" stroke={chartColors.text} angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke={chartColors.text} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: actualTheme === 'dark' ? '#2a2a2a' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Bar dataKey="count" fill={chartColors.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </MD3Card>
              )}
            </>
          )}
        </div>
      )}

      {loading && (
        <div className="analytics-loading">
          <span className="material-symbols-outlined spinning">progress_activity</span>
          <p>Loading analytics...</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
