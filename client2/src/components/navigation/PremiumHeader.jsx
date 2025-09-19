import { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import './PremiumHeader.css';

const PremiumHeader = ({
  title,
  breadcrumbs,
  rightActions,
  showSearch = true,
  onSearch,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { actualTheme, toggleTheme } = useMaterial3Theme();
  const { user, logout } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const userBtnRef = useRef(null);
  const notifBtnRef = useRef(null);

  const resolvedTitle = useMemo(() => {
    if (title) return title;
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/upload')) return 'Upload Books';
    if (pathname.startsWith('/notes')) return 'Notes';
    if (pathname.startsWith('/library')) return 'Library';
    return 'Literati';
  }, [title, pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLaunchOnboarding = () => {
    // Remove the completed flag to show onboarding again
    localStorage.removeItem('literati-onboarding-completed');
    setUserMenuOpen(false);
    // Refresh page to trigger onboarding
    window.location.reload();
  };


  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const [logoError, setLogoError] = useState(false);

  return (
    <header className={`md3-header ${actualTheme === 'dark' ? 'dark' : ''}`}>
      <div className="md3-header-content">
        {/* Left section */}
        <div className="md3-header-left">
          {!logoError ? (
            <img 
              src="/literatiLOGO_144x153.png" 
              alt="Literati" 
              className="md3-header-logo"
              onClick={() => navigate('/dashboard')}
              onError={() => {
                console.error('Failed to load logo');
                setLogoError(true);
              }}
            />
          ) : (
            <>
              <button onClick={() => navigate('/dashboard')} aria-label="Literati">
                <span className="material-symbols-outlined">auto_stories</span>
              </button>
              <h1 className="md3-header-title">{resolvedTitle}</h1>
            </>
          )}
          {breadcrumbs && (
            <nav className="md3-header-breadcrumbs">
              {breadcrumbs}
            </nav>
          )}
        </div>

        {/* Search section */}
        {showSearch && (
          <div className="md3-header-search">
            <div 
              className="md3-search-field"
              onClick={onSearch}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'var(--md3-surface-container-low)',
                borderRadius: '24px',
                border: '1px solid var(--md3-outline-variant)',
                minWidth: '300px',
                color: 'var(--md3-on-surface-variant)'
              }}
            >
              <span>Search books, notes, collections...</span>
              <div style={{
                fontSize: '11px',
                padding: '2px 6px',
                backgroundColor: 'var(--md3-surface-container)',
                borderRadius: '4px',
                border: '1px solid var(--md3-outline)',
                opacity: 0.7
              }}>
                ⌘K
              </div>
            </div>
          </div>
        )}

        {/* Right section */}
        <div className="md3-header-right">
          {rightActions}
          
          {/* Theme toggle */}
          <button
            className="md3-header-icon-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-symbols-outlined">
              {actualTheme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notifications */}
          <div className="md3-header-icon-button">
            <button
              ref={notifBtnRef}
              className="md3-header-icon-button"
              onClick={() => setNotifMenuOpen(!notifMenuOpen)}
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="md3-header-badge"></span>
            </button>
            
            
            {notifMenuOpen && (
              <div className="md3-header-menu open">
                <div className="md3-header-menu-item">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>No new notifications</span>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button
              ref={userBtnRef}
              className="md3-header-avatar"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
            >
              {userInitials}
            </button>
            
            {userMenuOpen && (
              <div className="md3-header-menu open">
                <div className="md3-header-menu-item">
                  <span className="material-symbols-outlined">person</span>
                  <span>{user?.name || 'User'}</span>
                </div>
                <div className="md3-header-menu-item">
                  <span className="material-symbols-outlined">mail</span>
                  <span>{user?.email || 'user@example.com'}</span>
                </div>
                <div className="md3-header-menu-divider" />
                <button className="md3-header-menu-item" onClick={() => navigate('/settings')}>
                  <span className="material-symbols-outlined">settings</span>
                  <span>Settings</span>
                </button>
                <button className="md3-header-menu-item" onClick={handleLaunchOnboarding}>
                  <span className="material-symbols-outlined">help</span>
                  <span>Rewards Tutorial</span>
                </button>
                <button className="md3-header-menu-item" onClick={handleLogout}>
                  <span className="material-symbols-outlined">logout</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PremiumHeader;