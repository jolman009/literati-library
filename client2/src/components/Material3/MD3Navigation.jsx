// src/components/Material3/MD3Navigation.jsx
import React, { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './MD3Navigation.css';

// Navigation Rail Component
export const MD3NavigationRail = memo(({
  destinations = [],
  selectedIndex = 0,
  onDestinationSelect,
  fab,
  header,
  expanded = false,
  className = '',
  ...props
}) => {
  const railClasses = [
    'md3-navigation-rail',
    expanded && 'md3-navigation-rail--expanded',
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={railClasses} {...props}>
      {header && (
        <div className="md3-navigation-rail__header">
          {header}
        </div>
      )}
      
      {fab && (
        <div className="md3-navigation-rail__fab">
          {fab}
        </div>
      )}
      
      <div className="md3-navigation-rail__destinations">
        {destinations.map((destination, index) => (
          <MD3NavigationItem
            key={destination.key || index}
            icon={destination.icon}
            selectedIcon={destination.selectedIcon}
            label={destination.label}
            badge={destination.badge}
            selected={index === selectedIndex}
            onClick={() => onDestinationSelect?.(index, destination)}
            expanded={expanded}
          />
        ))}
      </div>
    </nav>
  );
});

MD3NavigationRail.displayName = 'MD3NavigationRail';

// Navigation Drawer Component
export const MD3NavigationDrawer = memo(({
  open = false,
  onClose,
  variant = 'temporary',
  destinations = [],
  selectedIndex = 0,
  onDestinationSelect,
  header,
  footer,
  className = '',
  children,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleScrimClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleDestinationClick = (index, destination) => {
    onDestinationSelect?.(index, destination);
    if (variant === 'temporary') {
      onClose?.();
    }
  };

  if (!isVisible && variant === 'temporary') return null;

  const drawerClasses = [
    'md3-navigation-drawer',
    `md3-navigation-drawer--${variant}`,
    open && 'md3-navigation-drawer--open',
    className
  ].filter(Boolean).join(' ');

  const drawerContent = (
    <>
      {variant === 'temporary' && (
        <div 
          className="md3-navigation-drawer__scrim"
          onClick={handleScrimClick}
        />
      )}
      
      <div className={drawerClasses} {...props}>
        {header && (
          <div className="md3-navigation-drawer__header">
            {header}
          </div>
        )}
        
        <div className="md3-navigation-drawer__content">
          {children || (
            <div className="md3-navigation-drawer__destinations">
              {destinations.map((destination, index) => (
                <MD3NavigationItem
                  key={destination.key || index}
                  icon={destination.icon}
                  selectedIcon={destination.selectedIcon}
                  label={destination.label}
                  badge={destination.badge}
                  selected={index === selectedIndex}
                  onClick={() => handleDestinationClick(index, destination)}
                  expanded={true}
                  variant="drawer"
                />
              ))}
            </div>
          )}
        </div>
        
        {footer && (
          <div className="md3-navigation-drawer__footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );

  return variant === 'temporary' 
    ? createPortal(drawerContent, document.body)
    : drawerContent;
});

MD3NavigationDrawer.displayName = 'MD3NavigationDrawer';

// Navigation Item Component (used by both rail and drawer)
const MD3NavigationItem = memo(({
  icon,
  selectedIcon,
  label,
  badge,
  selected = false,
  onClick,
  expanded = false,
  variant = 'rail',
  disabled = false,
  className = ''
}) => {
  const itemClasses = [
    'md3-navigation-item',
    `md3-navigation-item--${variant}`,
    selected && 'md3-navigation-item--selected',
    disabled && 'md3-navigation-item--disabled',
    expanded && 'md3-navigation-item--expanded',
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <button
      className={itemClasses}
      onClick={handleClick}
      disabled={disabled}
      aria-selected={selected}
    >
      <span className="md3-navigation-item__ripple" />
      
      <div className="md3-navigation-item__container">
        <div className="md3-navigation-item__icon-container">
          <span className="md3-navigation-item__icon">
            {selected && selectedIcon ? selectedIcon : icon}
          </span>
          
          {badge && (
            <span className="md3-navigation-item__badge">
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        
        {(expanded || variant === 'drawer') && (
          <span className="md3-navigation-item__label">
            {label}
          </span>
        )}
      </div>
    </button>
  );
});

MD3NavigationItem.displayName = 'MD3NavigationItem';

// Navigation Bar Component (for mobile bottom navigation)
export const MD3NavigationBar = memo(({
  destinations = [],
  selectedIndex = 0,
  onDestinationSelect,
  className = '',
  ...props
}) => {
  const barClasses = [
    'md3-navigation-bar',
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={barClasses} {...props}>
      <div className="md3-navigation-bar__destinations">
        {destinations.map((destination, index) => (
          <MD3NavigationItem
            key={destination.key || index}
            icon={destination.icon}
            selectedIcon={destination.selectedIcon}
            label={destination.label}
            badge={destination.badge}
            selected={index === selectedIndex}
            onClick={() => onDestinationSelect?.(index, destination)}
            variant="bar"
          />
        ))}
      </div>
    </nav>
  );
});

MD3NavigationBar.displayName = 'MD3NavigationBar';

// Book Library Navigation Components
export const MD3BookLibraryNavigation = memo(({
  currentPage = 'library',
  onNavigate,
  variant = 'rail'
}) => {
  const destinations = [
    {
      key: 'library',
      icon: '📚',
      selectedIcon: '📚',
      label: 'Library',
      badge: null
    },
    {
      key: 'reading',
      icon: '📖',
      selectedIcon: '📖',
      label: 'Reading',
      badge: 2
    },
    {
      key: 'notes',
      icon: '📝',
      selectedIcon: '📝',
      label: 'Notes',
      badge: null
    },
    {
      key: 'collections',
      icon: '📂',
      selectedIcon: '📂',
      label: 'Collections',
      badge: null
    },
    {
      key: 'stats',
      icon: '📊',
      selectedIcon: '📊',
      label: 'Statistics',
      badge: null
    }
  ];

  const selectedIndex = destinations.findIndex(dest => dest.key === currentPage);

  const handleDestinationSelect = (index, destination) => {
    onNavigate?.(destination.key);
  };

  if (variant === 'rail') {
    return (
      <MD3NavigationRail
        destinations={destinations}
        selectedIndex={selectedIndex}
        onDestinationSelect={handleDestinationSelect}
      />
    );
  }

  if (variant === 'bar') {
    return (
      <MD3NavigationBar
        destinations={destinations}
        selectedIndex={selectedIndex}
        onDestinationSelect={handleDestinationSelect}
      />
    );
  }

  return (
    <MD3NavigationDrawer
      destinations={destinations}
      selectedIndex={selectedIndex}
      onDestinationSelect={handleDestinationSelect}
      variant="permanent"
    />
  );
});

MD3BookLibraryNavigation.displayName = 'MD3BookLibraryNavigation';

// Responsive Navigation Hook
export const useResponsiveNavigation = () => {
  const [variant, setVariant] = useState('rail');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const updateVariant = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setVariant('bar');
      } else if (width < 1024) {
        setVariant('drawer');
      } else {
        setVariant('rail');
      }
    };

    updateVariant();
    window.addEventListener('resize', updateVariant);
    return () => window.removeEventListener('resize', updateVariant);
  }, []);

  return {
    variant,
    drawerOpen,
    setDrawerOpen,
    isMobile: variant === 'bar',
    isTablet: variant === 'drawer',
    isDesktop: variant === 'rail'
  };
};

// Complete Navigation Layout Component
export const MD3NavigationLayout = memo(({
  currentPage,
  onNavigate,
  children,
  header,
  className = ''
}) => {
  const { variant, drawerOpen, setDrawerOpen } = useResponsiveNavigation();

  const layoutClasses = [
    'md3-navigation-layout',
    `md3-navigation-layout--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
      {/* Header with menu button for mobile/tablet */}
      {(variant === 'bar' || variant === 'drawer') && (
        <header className="md3-navigation-layout__header">
          {variant === 'drawer' && (
            <button
              className="md3-navigation-layout__menu-button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>
          )}
          {header}
        </header>
      )}

      {/* Navigation Rail (desktop) */}
      {variant === 'rail' && (
        <MD3BookLibraryNavigation
          currentPage={currentPage}
          onNavigate={onNavigate}
          variant="rail"
        />
      )}

      {/* Navigation Drawer (tablet) */}
      {variant === 'drawer' && (
        <MD3NavigationDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          variant="temporary"
          destinations={[
            { key: 'library', icon: '📚', label: 'Library' },
            { key: 'reading', icon: '📖', label: 'Reading', badge: 2 },
            { key: 'notes', icon: '📝', label: 'Notes' },
            { key: 'collections', icon: '📂', label: 'Collections' },
            { key: 'stats', icon: '📊', label: 'Statistics' }
          ]}
          selectedIndex={['library', 'reading', 'notes', 'collections', 'stats'].indexOf(currentPage)}
          onDestinationSelect={(index, destination) => {
            onNavigate?.(destination.key);
            setDrawerOpen(false);
          }}
        />
      )}

      {/* Main content */}
      <main className="md3-navigation-layout__content">
        {children}
      </main>

      {/* Bottom Navigation Bar (mobile) */}
      {variant === 'bar' && (
        <MD3BookLibraryNavigation
          currentPage={currentPage}
          onNavigate={onNavigate}
          variant="bar"
        />
      )}
    </div>
  );
});

MD3NavigationLayout.displayName = 'MD3NavigationLayout';

export default MD3NavigationRail;