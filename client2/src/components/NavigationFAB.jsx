import React, { useState } from 'react';

const NavigationFAB = ({ currentPage, onPageChange, quickStats = {} }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'library', label: 'Library', icon: '📚', count: quickStats.totalBooks },
    { id: 'reading', label: 'Reading', icon: '📖', count: quickStats.currentlyReading },
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'collections', label: 'Collections', icon: '📁', count: quickStats.collections },
    { id: 'notes', label: 'Notes', icon: '📝', count: quickStats.notes }
  ];

  const currentItem = navItems.find(item => item.id === currentPage);

  return (
    <div className="navigation-fab">
      {/* Overlay */}
      {isOpen && <div className="fab-overlay" onClick={() => setIsOpen(false)} />}

      {/* Navigation Actions */}
      {isOpen && (
        <div className="fab-actions">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onPageChange(item.id);
                setIsOpen(false);
              }}
              className={`fab-action ${currentPage === item.id ? 'fab-action--active' : ''}`}
            >
              <span className="fab-action-icon">{item.icon}</span>
              <span className="fab-action-label">{item.label}</span>
              {item.count > 0 && (
                <span className="fab-action-count">{item.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fab-main ${isOpen ? 'fab-main--open' : ''}`}
        title={`Navigation - Currently: ${currentItem?.label || 'Library'}`}
      >
        {isOpen ? '✕' : (currentItem?.icon || '📚')}
      </button>
    </div>
  );
};

export default NavigationFAB;