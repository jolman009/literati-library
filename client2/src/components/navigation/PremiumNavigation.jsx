import { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMaterial3Theme } from '@/contexts/Material3ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import './PremiumNavigation.css';

const PremiumNavigation = ({
  unreadNotesCount = 0,
  pendingUploads = 0,
  isAdmin = false,
  defaultCollapsed = false,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { actualTheme } = useMaterial3Theme();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const navigationItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { to: '/library', label: 'Library', icon: 'menu_book' },
    { to: '/notes', label: 'Notes', icon: 'edit_note', badge: unreadNotesCount },
    { to: '/upload', label: 'Upload Books', icon: 'upload', badge: pendingUploads },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`md3-navigation-rail ${collapsed ? 'collapsed' : ''} ${actualTheme === 'dark' ? 'dark' : ''}`}>
      {/* Header with collapse toggle */}
      <div className="md3-rail-header">
        <button
          className="md3-icon-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {!collapsed && (
          <span className="md3-rail-title">Literati</span>
        )}
      </div>

      {/* Navigation items */}
      <div className="md3-rail-destinations">
        {navigationItems.map(({ to, label, icon, badge }) => {
          const isActive = pathname === to || pathname.startsWith(to + '/');
          
          return (
            <NavLink
              key={to}
              to={to}
              className={`md3-rail-destination ${isActive ? 'active' : ''}`}
              title={collapsed ? label : undefined}
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

      {/* Bottom section */}
      <div className="md3-rail-footer">
        <button
          className="md3-rail-destination"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
        >
          <div className="md3-rail-destination-icon">
            <span className="material-symbols-outlined">logout</span>
          </div>
          {!collapsed && (
            <span className="md3-rail-destination-label">Logout</span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default PremiumNavigation;