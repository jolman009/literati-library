import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import './PremiumHeader.css';
import { useEntitlements } from '../../contexts/EntitlementsContext';
import GoPremiumCTA from '../premium/GoPremiumCTA';

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
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const { isPremium, openPremiumModal } = useEntitlements();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef(null);
  const userMenuRef = useRef(null);

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

  // Manage focus and dismissal for the user menu
  useEffect(() => {
    if (!userMenuOpen) return;

    const focusFirstItem = () => {
      try {
        const first = userMenuRef.current?.querySelector('.dropdown-item:not([disabled])');
        first?.focus();
      } catch {}
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    };

    const onClickOutside = (e) => {
      const menuEl = userMenuRef.current;
      const btnEl = userMenuButtonRef.current;
      if (menuEl && !menuEl.contains(e.target) && btnEl && !btnEl.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };

    setTimeout(focusFirstItem, 0);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [userMenuOpen]);

  const onMenuKeyDown = (e) => {
    if (!userMenuRef.current) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(userMenuRef.current.querySelectorAll('.dropdown-item:not([disabled])'));
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      const next = items[(index + 1) % items.length];
      next?.focus();
    } else if (e.key === 'ArrowUp') {
      const prev = items[(index - 1 + items.length) % items.length];
      prev?.focus();
    }
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

  /**
   * Handle logout - clears HttpOnly cookies and navigates to login
   */
  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="premium-header">
      <div className="premium-header-left">
        <button
          className="premium-header-logo-btn"
          onClick={handleLogoClick}
          aria-label="Home"
        >
          <img
            src="/ShelfQuest_logo_favicon.png"
            alt="ShelfQuest"
            className="header-logo-image"
            width="32"
            height="32"
          />
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
        {/* Inline Premium CTA for non-premium users */}
        {!isPremium && (
          <div className="premium-header-actions">
            <GoPremiumCTA to="/premium" variant="tonal" className="premium-cta" />
          </div>
        )}

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
              id="user-menu-button"
              className="premium-header-user-btn"
              ref={userMenuButtonRef}
              onClick={toggleUserMenu}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-controls={userMenuOpen ? 'user-menu' : undefined}
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
              <div
                id="user-menu"
                className="premium-header-dropdown"
                role="menu"
                aria-labelledby="user-menu-button"
                ref={userMenuRef}
                onKeyDown={onMenuKeyDown}
              >
                <div className="dropdown-header">
                  <div className="user-info">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-email">{user?.email || 'user@example.com'}</span>
                  </div>
                </div>
                {!isPremium && (
                  <>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        openPremiumModal();
                        setUserMenuOpen(false);
                      }}
                    >
                      <span className="material-symbols-outlined">workspace_premium</span>
                      Go Premium
                    </button>
                  </>
                )}
                <div className="dropdown-divider"></div>
                <nav className="dropdown-nav">
                  <button
                    className="dropdown-item"
                    role="menuitem"
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
                    role="menuitem"
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
                    role="menuitem"
                    onClick={() => {
                      navigate('/premium');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">workspace_premium</span>
                    Premium
                  </button>
                  <button
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      navigate('/help');
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">help</span>
                    Help
                  </button>
                  <button
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      try {
                        localStorage.setItem('sq_tour_seen_v1', '0');
                      } catch {}
                      // Ask dashboard to restart guided tour
                      window.dispatchEvent(new CustomEvent('restartGuidedTour'));
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">flag</span>
                    Restart Guided Tour
                  </button>
                  <button
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      // Dispatch custom event to show tutorial
                      window.dispatchEvent(new CustomEvent('showTutorial'));
                      setUserMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-outlined">school</span>
                    Tutorial
                  </button>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item logout-item"
                    role="menuitem"
                    onClick={handleLogout}
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
