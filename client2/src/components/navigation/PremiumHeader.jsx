import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import './PremiumHeader.css';

/**
 * A Material Design 3–compliant header for the premium experience.
 *
 * This component displays a header with a navigation button, a title,
 * optional breadcrumbs and a search field. It uses CSS classes for
 * all styling – there are **no** inline style objects or `title`
 * attributes that cause unwanted tooltips.
 *
 * Props:
 * - `title` (string): The page title to display.
 * - `breadcrumbs` (array of `{ label: string, href?: string }`): Optional
 *     breadcrumb links. If provided, the header will render an ordered
 *     list of links separated by chevrons. If `href` is omitted, the
 *     breadcrumb will render as plain text.
 */
export default function PremiumHeader({ title, breadcrumbs = [] }) {
  const navigate = useNavigate();
  const { actualTheme, toggleTheme } = useMaterial3Theme();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /**
   * Navigate to the dashboard. This replaces the inline `title`
   * attribute previously used to describe the button, using
   * `aria-label` instead to avoid native tooltips while remaining
   * accessible.
   */
  const handleLogoClick = () => navigate('/dashboard');

  /**
   * Handle changes to the search field. At some point you could
   * dispatch this query to a search endpoint or update context state.
   * For now it simply updates local state.
   */
  const handleSearchChange = (e) => setQuery(e.target.value);

  /**
   * Toggle the theme between light and dark modes
   */
  const handleThemeToggle = () => {
    toggleTheme();
  };

  /**
   * Toggle user menu dropdown
   */
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  /**
   * Get user's initials for avatar fallback
   */
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="premium-header">
      <div className="premium-header-left">
        <button
          className="premium-header-logo-btn"
          onClick={handleLogoClick}
          aria-label="Home"
        >
          <span className="material-symbols-outlined">auto_stories</span>
        </button>
        <h1 className="premium-header-title">{title}</h1>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="premium-header-breadcrumbs">
            <ol>
              {breadcrumbs.map((crumb, idx) => (
                <li key={idx} className="premium-header-crumb">
                  {crumb.href ? (
                    <a href={crumb.href}>{crumb.label}</a>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && (
                    <span className="premium-header-crumb-separator">›</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
      <div className="premium-header-right">
        <div className="premium-header-search">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="premium-header-search-input"
            placeholder="Search…"
            value={query}
            onChange={handleSearchChange}
          />
        </div>

        {/* Action buttons */}
        <div className="premium-header-actions">
          {/* Theme Toggle */}
          <button
            className="premium-header-action-btn"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-symbols-outlined">
              {actualTheme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notifications (placeholder for future) */}
          <button
            className="premium-header-action-btn"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* User Menu */}
          <div className="premium-header-user-menu">
            <button
              className="premium-header-user-btn"
              onClick={toggleUserMenu}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="avatar-image" />
                ) : (
                  <span className="avatar-initials">{getUserInitials()}</span>
                )}
              </div>
              <span className="material-symbols-outlined dropdown-icon">
                {userMenuOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="premium-header-dropdown">
                <div className="dropdown-header">
                  <div className="user-info">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-email">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <nav className="dropdown-nav">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">person</span>
                    Profile
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/settings');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">settings</span>
                    Settings
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/help');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">help</span>
                    Help
                  </button>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout-item"
                    onClick={() => {
                      // Handle logout
                      navigate('/login');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Sign Out
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}