import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';

/**
 * Simplified Mobile Navigation - Self-Contained with Inline Styles
 * No external CSS dependencies - guaranteed to work
 * Always visible at bottom of viewport (fixed positioning)
 */
const MobileNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { actualTheme } = useMaterial3Theme();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
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
      key: 'notes',
      icon: 'note',
      label: 'Notes',
      path: '/notes'
    },
    {
      key: 'upload',
      icon: 'upload_file',
      label: 'Upload',
      path: '/upload'
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
  const containerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80px',
    backgroundColor: 'rgb(var(--md-sys-color-surface-container, 239 237 242))',
    borderTop: '1px solid rgb(var(--md-sys-color-outline-variant, 201 197 208))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 8px',
    zIndex: 1000,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
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
    backgroundColor: active ? 'rgb(var(--md-sys-color-secondary-container, 232 222 248))' : 'transparent',
    color: active ? 'rgb(var(--md-sys-color-on-secondary-container, 29 25 43))' : 'rgb(var(--md-sys-color-on-surface-variant, 73 69 79))',
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
    <nav style={containerStyle}>
      {destinations.map((dest) => {
        const active = isActive(dest.path);
        return (
          <button
            key={dest.key}
            onClick={() => navigate(dest.path)}
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
  );
};

export default MobileNavigation;
