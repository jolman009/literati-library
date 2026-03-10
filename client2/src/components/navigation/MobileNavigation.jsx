import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlements } from '../../contexts/EntitlementsContext';

/**
 * More Menu Modal Component
 */
const MoreMenu = ({ isOpen, onClose, navigate, isDark, onToggleTheme, onLogout, isPremium }) => {
  if (!isOpen) return null;

  const menuItems = [
    // Main
    { icon: 'upload', label: 'Upload Book', path: '/upload' },
    { icon: 'content_cut', label: 'Clippings', path: '/clippings' },
    { icon: 'collections_bookmark', label: 'Collections', path: '/collections' },
    // AI & Discovery
    { isSectionLabel: true, label: 'AI & Discovery' },
    { icon: 'auto_awesome', label: 'Recommendations', path: '/recommendations' },
    ...(!isPremium ? [{ icon: 'workspace_premium', label: 'Upgrade to Pro', path: '/pricing', accent: true }] : []),
    // Progress
    { isSectionLabel: true, label: 'Progress' },
    { icon: 'trending_up', label: 'Progress & Journey', path: '/progress' },
    { icon: 'leaderboard', label: 'Leaderboard', path: '/leaderboard' },
    // System
    { isSectionLabel: true, label: 'System' },
    { icon: 'settings', label: 'Settings', path: '/settings' },
    { icon: 'help', label: 'Help & FAQ', path: '/help' },
    { icon: 'feedback', label: 'Send Feedback', path: '/feedback' },
  ];

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1300,
    display: 'flex',
    alignItems: 'flex-end',
    animation: 'fadeIn 0.2s ease-out',
  };

  const menuStyle = {
    width: '100%',
    maxHeight: '70vh',
    backgroundColor: isDark ? '#2b2b2b' : '#ffffff',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '24px 16px',
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.2)',
    animation: 'slideUp 0.3s ease-out',
    overflowY: 'auto',
  };

  const headerStyle = {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '20px',
    color: isDark ? '#ffffff' : '#1f2937',
    textAlign: 'center',
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: isDark ? '#e0e0e0' : '#5f5f5f',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  };

  const handleNavigate = (path) => {
    onClose();
    setTimeout(() => navigate(path), 200);
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={headerStyle}>More Options</h2>
        {/* Theme Toggle Row */}
        <button
          style={menuItemStyle}
          onClick={onToggleTheme}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#4a4a4a' : '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div style={{
          height: '1px',
          backgroundColor: isDark ? '#444' : '#e5e7eb',
          margin: '4px 16px',
        }} />
        {menuItems.map((item, index) => {
          if (item.isSectionLabel) {
            return (
              <div
                key={`section-${item.label}`}
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  padding: '12px 16px 4px',
                  marginTop: '4px',
                }}
              >
                {item.label}
              </div>
            );
          }
          const accentStyle = item.accent ? { color: 'var(--md-sys-color-tertiary)', fontWeight: 600 } : {};
          return (
            <button
              key={item.path || `item-${index}`}
              style={{ ...menuItemStyle, ...accentStyle }}
              onClick={() => handleNavigate(item.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#4a4a4a' : '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px', ...(item.accent ? { color: 'var(--md-sys-color-tertiary)' } : {}) }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
        <div style={{
          height: '1px',
          backgroundColor: isDark ? '#444' : '#e5e7eb',
          margin: '12px 16px',
        }} />
        <button
          style={{ ...menuItemStyle, color: isDark ? '#f87171' : '#dc2626' }}
          onClick={() => { onClose(); onLogout(); }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#4a4a4a' : '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>logout</span>
          <span>Logout</span>
        </button>
        <button
          style={{ ...menuItemStyle, marginTop: '8px', color: isDark ? '#9ca3af' : '#6b7280', justifyContent: 'center' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

/**
 * Simplified Mobile Navigation - Self-Contained with Inline Styles
 * No external CSS dependencies - guaranteed to work
 * Always visible at bottom of viewport (fixed positioning)
 */
const MobileNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { actualTheme, toggleTheme } = useMaterial3Theme();
  const { logout } = useAuth();
  const { isPremium } = useEntitlements();
  const [isMobile, setIsMobile] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1080);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const destinations = [
    {
      key: 'dashboard',
      icon: 'home',
      label: 'Home',
      path: '/dashboard'
    },
    {
      key: 'library',
      icon: 'menu_book',
      label: 'Library',
      path: '/library'
    },
    {
      key: 'mentor',
      icon: 'psychology',
      label: 'Mentor',
      path: '/mentor'
    },
    {
      key: 'notes',
      icon: 'note',
      label: 'Notes',
      path: '/notes'
    },
    {
      key: 'more',
      icon: 'more_horiz',
      label: 'More',
      path: null, // Special handling for More
      onClick: () => setIsMoreMenuOpen(true)
    },
  ];

  const isActive = (path) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  // Inline styles - guaranteed to work regardless of CSS state
  // Dark mode colors with proper contrast
  const isDark = actualTheme === 'dark';

  const containerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80px',
    backgroundColor: isDark ? '#2b2b2b' : '#f5f5f5',
    borderTop: isDark ? '1px solid #444' : '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 8px',
    zIndex: 1200,
    boxShadow: isDark
      ? '0 -2px 8px rgba(0, 0, 0, 0.5)'
      : '0 -2px 8px rgba(0, 0, 0, 0.1)',
  };

  const itemStyle = (active) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '64px',
    height: '64px',
    cursor: 'pointer',
    borderRadius: '16px',
    backgroundColor: active
      ? (isDark ? '#4a4a4a' : '#e8e0f5')
      : 'transparent',
    color: active
      ? (isDark ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-primary)')
      : (isDark ? '#e0e0e0' : '#5f5f5f'),
    transition: 'all 0.2s ease',
    padding: '8px',
    border: 'none',
    textDecoration: 'none',
  });

  const iconStyle = {
    fontSize: '24px',
    marginBottom: '4px',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '500',
    textAlign: 'center',
  };

  return (
    <>
      <nav style={containerStyle}>
        {destinations.map((dest) => {
          const active = dest.path ? isActive(dest.path) : false;
          return (
            <button
              key={dest.key}
              onClick={dest.onClick || (() => navigate(dest.path))}
              style={itemStyle(active)}
              aria-label={dest.label}
            >
              <span className="material-symbols-outlined" style={{
                ...iconStyle,
                fontVariationSettings: active ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300"
              }}>
                {dest.icon}
              </span>
              <span style={labelStyle}>{dest.label}</span>
            </button>
          );
        })}
      </nav>
      <MoreMenu
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        navigate={navigate}
        isDark={actualTheme === 'dark'}
        onToggleTheme={toggleTheme}
        onLogout={async () => { await logout(); navigate('/login', { replace: true }); }}
        isPremium={isPremium}
      />
    </>
  );
};

export default MobileNavigation;

