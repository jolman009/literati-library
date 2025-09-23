import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavigationFAB = ({ quickStats = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const fabActions = [
    {
      to: '/notes',
      label: 'Notes',
      icon: 'edit_note',
      count: quickStats.notes,
      color: 'var(--md-sys-color-tertiary)'
    },
    {
      to: '/collections',
      label: 'Collections',
      icon: 'collections_bookmark',
      count: quickStats.collections,
      color: 'var(--md-sys-color-secondary)'
    },
    {
      to: '/upload',
      label: 'Upload',
      icon: 'upload',
      count: quickStats.pendingUploads,
      color: 'var(--md-sys-color-primary)'
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

  return (
    <div className="navigation-fab">
      {/* Overlay */}
      {isOpen && <div className="fab-overlay" onClick={() => setIsOpen(false)} />}

      {/* FAB Menu Actions */}
      {isOpen && (
        <div className="fab-actions">
          {fabActions.map((action) => (
            <button
              key={action.to}
              onClick={() => handleActionClick(action.to)}
              className={`fab-action ${pathname === action.to ? 'fab-action--active' : ''}`}
              style={{ '--action-color': action.color }}
            >
              <span className="material-symbols-outlined fab-action-icon">
                {action.icon}
              </span>
              <span className="fab-action-label">{action.label}</span>
              {action.count > 0 && (
                <span className="fab-action-count">{action.count > 99 ? '99+' : action.count}</span>
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="fab-divider"></div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="fab-action fab-action--logout"
          >
            <span className="material-symbols-outlined fab-action-icon">
              logout
            </span>
            <span className="fab-action-label">Logout</span>
          </button>
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fab-main ${isOpen ? 'fab-main--open' : ''}`}
        aria-label={isOpen ? 'Close menu' : 'Open navigation menu'}
      >
        <span className="material-symbols-outlined">
          {isOpen ? 'close' : 'add'}
        </span>
      </button>
    </div>
  );
};

export default NavigationFAB;