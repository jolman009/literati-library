import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import './PremiumNavigation.css';

const SECTION_STORAGE_KEY = 'shelfquest_nav_sections';

function loadSectionState() {
  try {
    const saved = localStorage.getItem(SECTION_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  // Default: AI & Discovery open, Progress and System collapsed
  return { ai: true, progress: false, system: false };
}

function saveSectionState(state) {
  try {
    localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const PremiumNavigation = ({
  unreadNotesCount = 0,
  pendingUploads = 0,
  defaultCollapsed = false,
  isCollapsed,
  onCollapseChange,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { actualTheme } = useMaterial3Theme();
  const { logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const [sectionOpen, setSectionOpen] = useState(loadSectionState);

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

  const toggleSection = useCallback((key) => {
    setSectionOpen(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveSectionState(next);
      return next;
    });
  }, []);

  // Auto-expand section if user navigates to a page within it
  useEffect(() => {
    const aiPaths = ['/recommendations', '/mentor'];
    const progressPaths = ['/progress', '/achievements', '/leaderboard', '/gamification'];
    const systemPaths = ['/settings', '/help', '/feedback'];

    setSectionOpen(prev => {
      let changed = false;
      const next = { ...prev };
      if (aiPaths.some(p => pathname === p || pathname.startsWith(p + '/')) && !prev.ai) {
        next.ai = true; changed = true;
      }
      if (progressPaths.some(p => pathname === p || pathname.startsWith(p + '/')) && !prev.progress) {
        next.progress = true; changed = true;
      }
      if (systemPaths.some(p => pathname === p || pathname.startsWith(p + '/')) && !prev.system) {
        next.system = true; changed = true;
      }
      if (changed) {
        saveSectionState(next);
        return next;
      }
      return prev;
    });
  }, [pathname]);

  // Main items — always visible
  const mainItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { to: '/library', label: 'Library', icon: 'menu_book' },
    { to: '/upload', label: 'Upload Books', icon: 'upload', badge: pendingUploads },
    { to: '/notes', label: 'Notes', icon: 'edit_note', badge: unreadNotesCount },
    { to: '/clippings', label: 'Clippings', icon: 'content_cut' },
    { to: '/collections', label: 'Collections', icon: 'collections_bookmark' },
  ];

  const sections = [
    {
      key: 'ai',
      label: 'AI & Discovery',
      icon: 'auto_awesome',
      items: [
        { to: '/recommendations', label: 'Recommendations', icon: 'auto_awesome' },
        { to: '/mentor', label: 'Mentor AI', icon: 'psychology' },
      ],
    },
    {
      key: 'progress',
      label: 'Progress',
      icon: 'trending_up',
      items: [
        { to: '/progress', label: 'Progress & Journey', icon: 'trending_up' },
        { to: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
      ],
    },
    {
      key: 'system',
      label: 'System',
      icon: 'settings',
      items: [
        { to: '/settings', label: 'Settings', icon: 'settings' },
        { to: '/help', label: 'Help & FAQ', icon: 'help' },
        { to: '/feedback', label: 'Send Feedback', icon: 'feedback' },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const isActive = (to) => pathname === to || pathname.startsWith(to + '/');

  const renderNavItem = ({ to, label, icon, badge }) => (
    <NavLink
      key={to}
      to={to}
      className={`md3-rail-destination ${isActive(to) ? 'active' : ''}`}
    >
      <div className="md3-rail-destination-icon">
        <span className="material-symbols-outlined">{icon}</span>
        {badge > 0 && (
          <span className="md3-badge">{badge > 99 ? '99+' : badge}</span>
        )}
      </div>
      {!collapsed && (
        <span className="md3-rail-destination-label">{label}</span>
      )}
    </NavLink>
  );

  const sectionHasActive = (items) => items.some(item => isActive(item.to));

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
          <span className="md3-rail-title">ShelfQuest</span>
        )}
      </div>

      <div className="md3-rail-destinations">
        {/* Main items — always visible */}
        {mainItems.map(renderNavItem)}

        {/* Collapsible sections */}
        {sections.map(section => {
          const isOpen = sectionOpen[section.key];
          const hasActive = sectionHasActive(section.items);

          if (collapsed) {
            // In collapsed mode, show section icon as a single button
            return (
              <button
                key={section.key}
                className={`md3-rail-destination md3-rail-section-toggle ${hasActive ? 'active' : ''}`}
                onClick={() => toggleSection(section.key)}
                title={section.label}
              >
                <div className="md3-rail-destination-icon">
                  <span className="material-symbols-outlined">{section.icon}</span>
                </div>
              </button>
            );
          }

          return (
            <div key={section.key} className="md3-rail-section" data-section={section.key}>
              <button
                className={`md3-rail-section-header ${hasActive ? 'has-active' : ''}`}
                onClick={() => toggleSection(section.key)}
                aria-expanded={isOpen}
              >
                <span className="material-symbols-outlined md3-rail-section-icon">
                  {section.icon}
                </span>
                <span className="md3-rail-section-label">{section.label}</span>
                <span className={`material-symbols-outlined md3-rail-section-chevron ${isOpen ? 'open' : ''}`}>
                  expand_more
                </span>
              </button>
              {isOpen && (
                <div className="md3-rail-section-items">
                  {section.items.map(renderNavItem)}
                </div>
              )}
            </div>
          );
        })}

        {/* Logout — always at bottom */}
        <button
          key="logout"
          className="md3-rail-destination md3-rail-destination-logout"
          onClick={handleLogout}
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
