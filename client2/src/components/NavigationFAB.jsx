import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Simplified Navigation FAB - Self-Contained with Inline Styles
 * No external CSS dependencies - guaranteed to work
 */
const NavigationFAB = ({ quickStats = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fabActions = [
    {
      to: '/notes',
      label: 'Notes',
      icon: 'edit_note',
      count: quickStats.notes,
    },
    {
      to: '/collections',
      label: 'Collections',
      icon: 'collections_bookmark',
      count: quickStats.collections,
    },
    {
      to: '/upload',
      label: 'Upload',
      icon: 'upload',
      count: quickStats.pendingUploads,
    }
  ];

  const handleActionClick = (to) => {
    navigate(to);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  // Inline styles
  const containerStyle = {
    position: 'fixed',
    bottom: '100px', // Above bottom navigation
    right: '16px',
    zIndex: 1001,
    display: 'block',
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: -1,
    backdropFilter: 'blur(4px)',
    display: isOpen ? 'block' : 'none',
  };

  const fabMainStyle = {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: 'rgb(var(--md-sys-color-primary-container, 234 221 255))',
    color: 'rgb(var(--md-sys-color-on-primary-container, 33 0 94))',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease',
    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
  };

  const actionsContainerStyle = {
    position: 'absolute',
    bottom: '70px',
    right: 0,
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '180px',
  };

  const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: '1px solid rgb(var(--md-sys-color-outline-variant, 201 197 208))',
    borderRadius: '16px',
    backgroundColor: 'rgb(var(--md-sys-color-surface-container-high, 236 234 240))',
    color: 'rgb(var(--md-sys-color-on-surface, 28 27 31))',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  };

  const logoutButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: 'rgb(var(--md-sys-color-error-container, 255 218 214))',
    color: 'rgb(var(--md-sys-color-error, 186 26 26))',
    borderColor: 'rgb(var(--md-sys-color-error, 186 26 26))',
  };

  const iconStyle = {
    fontSize: '20px',
  };

  const labelStyle = {
    flex: 1,
    textAlign: 'left',
  };

  const countStyle = {
    backgroundColor: 'rgb(var(--md-sys-color-primary-container, 234 221 255))',
    color: 'rgb(var(--md-sys-color-on-primary-container, 33 0 94))',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '20px',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      {/* Overlay */}
      {isOpen && <div style={overlayStyle} onClick={() => setIsOpen(false)} />}

      {/* FAB Menu Actions */}
      {isOpen && (
        <div style={actionsContainerStyle}>
          {fabActions.map((action) => (
            <button
              key={action.to}
              onClick={() => handleActionClick(action.to)}
              style={actionButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              <span className="material-symbols-outlined" style={iconStyle}>
                {action.icon}
              </span>
              <span style={labelStyle}>{action.label}</span>
              {action.count > 0 && (
                <span style={countStyle}>{action.count > 99 ? '99+' : action.count}</span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgb(var(--md-sys-color-outline-variant, 201 197 208))', margin: '4px 0' }} />

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            style={logoutButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
          >
            <span className="material-symbols-outlined" style={iconStyle}>
              logout
            </span>
            <span style={labelStyle}>Logout</span>
          </button>
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={fabMainStyle}
        aria-label={isOpen ? 'Close menu' : 'Open navigation menu'}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
          }
        }}
      >
        <span className="material-symbols-outlined">
          {isOpen ? 'close' : 'add'}
        </span>
      </button>
    </div>
  );
};

export default NavigationFAB;
