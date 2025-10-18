import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import './PremiumNavigation.css';

const PremiumNavigation = ({
  unreadNotesCount = 0,
  pendingUploads = 0,
  isAdmin = false,
  defaultCollapsed = false,
  isCollapsed,
  onCollapseChange,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { actualTheme } = useMaterial3Theme();
  const { logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);

  const isControlled = typeof isCollapsed === 'boolean';
  const collapsed = isControlled ? isCollapsed : internalCollapsed;

  useEffect(() => {
    if (isControlled) {
      setInternalCollapsed(isCollapsed);
    }
  }, [isControlled, isCollapsed]);

  const handleCollapseToggle = () => {
    const newCollapsed = !collapsed;

    if (!isControlled) {
      setInternalCollapsed(newCollapsed);
    }

    onCollapseChange?.(newCollapsed);
  };

  const navigationItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { to: '/library', label: 'Library', icon: 'menu_book' },
    { to: '/collections', label: 'Collections', icon: 'collections_bookmark' },
    { to: '/mentor', label: 'Mentor AI', icon: 'psychology' },
    { to: '/notes', label: 'Notes', icon: 'edit_note', badge: unreadNotesCount },
    { to: '/gamification', label: 'Rewards', icon: 'emoji_events' },
    { to: '/upload', label: 'Upload Books', icon: 'upload', badge: pendingUploads },
    { to: null, label: 'Logout', icon: 'logout', isLogout: true },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav
      className={`md3-navigation-rail ${collapsed ? 'collapsed' : 'expanded'} ${actualTheme === 'dark' ? 'dark' : ''}`}
      data-collapsed={collapsed}
    >
      <div className="md3-rail-header">
        <button
          className="md3-icon-button"
          onClick={handleCollapseToggle}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {!collapsed && (
          <span className="md3-rail-title">Literati</span>
        )}
      </div>

      <div className="md3-rail-destinations">
        {navigationItems.map(({ to, label, icon, badge, isLogout }) => {
          if (isLogout) {
            return (
              <button
                key="logout"
                className="md3-rail-destination md3-rail-destination-logout"
                onClick={handleLogout}
              >
                <div className="md3-rail-destination-icon">
                  <span className="material-symbols-outlined">
                    {icon}
                  </span>
                </div>
                {!collapsed && (
                  <span className="md3-rail-destination-label">{label}</span>
                )}
              </button>
            );
          }

          const isActive = pathname === to || pathname.startsWith(to + '/');

          return (
            <NavLink
              key={to}
              to={to}
              className={`md3-rail-destination ${isActive ? 'active' : ''}`}
            >
              <div className="md3-rail-destination-icon">
                <span className="material-symbols-outlined">
                  {icon}
                </span>
                {badge > 0 && (
                  <span className="md3-badge">{badge > 99 ? '99+' : badge}</span>
                )}
              </div>
              {!collapsed && (
                <span className="md3-rail-destination-label">{label}</span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default PremiumNavigation;
