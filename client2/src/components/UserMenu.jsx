import React, { useState, useRef, useEffect } from 'react';

const UserMenu = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const username = user?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative">
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="md3-button md3-button--outlined flex items-center space-x-2 px-4 py-2 min-w-[120px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="bg-primary/20 p-1.5 rounded-full">
          <span className="material-symbols-outlined text-primary text-lg">
            person
          </span>
        </div>
        <span className="text-label-large hidden sm:inline flex-1 text-left">
          {username}
        </span>
        <span className={`material-symbols-outlined text-lg transition-transform duration-medium2 ${
          isOpen ? 'rotate-180' : ''
        }`}>
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 bg-surface-container elevation-3 rounded-medium min-w-[280px] border border-outline-variant md3-animate-scale-up z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info Section */}
          <div className="p-4 border-b border-outline-variant">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-full">
                <span className="material-symbols-outlined text-on-primary text-xl">
                  person
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-title-small text-on-surface font-medium truncate">
                  {username}
                </p>
                <p className="text-body-small text-on-surface-variant truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-label-large text-on-surface hover:bg-surface-container-high transition-colors duration-short2"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-xl">
                settings
              </span>
              <span>Settings</span>
            </button>

            <button
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-label-large text-on-surface hover:bg-surface-container-high transition-colors duration-short2"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-xl">
                help
              </span>
              <span>Help & Support</span>
            </button>

            <button
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-label-large text-on-surface hover:bg-surface-container-high transition-colors duration-short2"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <span className="material-symbols-outlined text-xl">
                info
              </span>
              <span>About ShelfQuest</span>
            </button>

            <button
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-label-large text-on-surface hover:bg-surface-container-high transition-colors duration-short2"
              role="menuitem"
              onClick={() => {
                // Dispatch custom event to show tutorial
                window.dispatchEvent(new CustomEvent('showTutorial'));
                setIsOpen(false);
              }}
            >
              <span className="material-symbols-outlined text-xl">
                school
              </span>
              <span>Tutorial</span>
            </button>

            <div className="border-t border-outline-variant my-2"></div>

            <button
              className="w-full flex items-center space-x-3 px-4 py-3 text-left text-label-large text-error hover:bg-error-container/10 transition-colors duration-short2"
              role="menuitem"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined text-xl">
                logout
              </span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;