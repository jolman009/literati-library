// src/components/Material3/MD3Menu.jsx
import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './MD3Menu.css';

const MD3Menu = memo(({
  open = false,
  onClose,
  anchorEl,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  elevation = 2,
  children,
  className = '',
  ...props
}) => {
  const menuRef = useRef();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Calculate menu position
  const calculatePosition = useCallback(() => {
    if (!anchorEl || !menuRef.current) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let top = anchorRect.bottom;
    let left = anchorRect.left;

    // Anchor origin adjustments
    if (anchorOrigin.vertical === 'top') {
      top = anchorRect.top;
    } else if (anchorOrigin.vertical === 'center') {
      top = anchorRect.top + anchorRect.height / 2;
    }

    if (anchorOrigin.horizontal === 'right') {
      left = anchorRect.right;
    } else if (anchorOrigin.horizontal === 'center') {
      left = anchorRect.left + anchorRect.width / 2;
    }

    // Transform origin adjustments
    if (transformOrigin.vertical === 'center') {
      top -= menuRect.height / 2;
    } else if (transformOrigin.vertical === 'bottom') {
      top -= menuRect.height;
    }

    if (transformOrigin.horizontal === 'center') {
      left -= menuRect.width / 2;
    } else if (transformOrigin.horizontal === 'right') {
      left -= menuRect.width;
    }

    // Viewport boundary adjustments
    if (left + menuRect.width > viewport.width) {
      left = viewport.width - menuRect.width - 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (top + menuRect.height > viewport.height) {
      top = anchorRect.top - menuRect.height;
    }
    if (top < 8) {
      top = 8;
    }

    setPosition({ top, left });
  }, [anchorEl, anchorOrigin, transformOrigin]);

  // Handle opening/closing
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setTimeout(() => {
        calculatePosition();
        // Autofocus first enabled menu item for keyboard users
        try {
          const root = menuRef.current;
          if (root) {
            const firstItem = root.querySelector('[role="menuitem"]:not([aria-disabled="true"])');
            firstItem?.focus();
          }
        } catch {}
      }, 0);
    } else {
      setTimeout(() => setIsVisible(false), 200);
    }
  }, [open, calculatePosition]);

  // Handle clicks outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          anchorEl && !anchorEl.contains(event.target)) {
        onClose?.();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', calculatePosition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [open, onClose, anchorEl, calculatePosition]);

  if (!isVisible) return null;

  const menuClasses = [
    'md3-menu',
    `md3-menu--elevation-${elevation}`,
    open ? 'md3-menu--open' : 'md3-menu--closing',
    className
  ].filter(Boolean).join(' ');

  const onMenuKeyDown = (e) => {
    if (!menuRef.current) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])'));
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

  const menuContent = (
    <div
      ref={menuRef}
      className={menuClasses}
      style={{
        top: position.top,
        left: position.left
      }}
      role="menu"
      onKeyDown={onMenuKeyDown}
      {...props}
    >
      {children}
    </div>
  );

  return createPortal(menuContent, document.body);
});

MD3Menu.displayName = 'MD3Menu';

// Menu Item Component
export const MD3MenuItem = memo(({
  children,
  icon,
  trailingIcon,
  disabled = false,
  selected = false,
  onClick,
  onKeyDown,
  className = '',
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
    onKeyDown?.(e);
  };

  const itemClasses = [
    'md3-menu-item',
    disabled && 'md3-menu-item--disabled',
    selected && 'md3-menu-item--selected',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={itemClasses}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      {...props}
    >
      <span className="md3-menu-item__ripple" />
      
      {icon && (
        <span className="md3-menu-item__icon md3-menu-item__icon--leading">
          {icon}
        </span>
      )}
      
      <span className="md3-menu-item__text">
        {children}
      </span>
      
      {trailingIcon && (
        <span className="md3-menu-item__icon md3-menu-item__icon--trailing">
          {trailingIcon}
        </span>
      )}
    </div>
  );
});

MD3MenuItem.displayName = 'MD3MenuItem';

// Menu Divider Component
export const MD3MenuDivider = memo(({ className = '' }) => (
  <div className={`md3-menu-divider ${className}`} role="separator" />
));

MD3MenuDivider.displayName = 'MD3MenuDivider';

// Menu Group Component
export const MD3MenuGroup = memo(({ label, children, className = '' }) => (
  <div className={`md3-menu-group ${className}`} role="group" aria-label={label}>
    {label && (
      <div className="md3-menu-group__label">
        {label}
      </div>
    )}
    {children}
  </div>
));

MD3MenuGroup.displayName = 'MD3MenuGroup';

// Dropdown Button Component (combines button + menu)
export const MD3DropdownButton = memo(({
  children,
  menuItems = [],
  variant = 'outlined',
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef();

  const handleToggle = () => {
    if (disabled) return;
    setOpen(!open);
  };

  const handleMenuClose = () => {
    setOpen(false);
  };

  const handleMenuItemClick = (item) => {
    setOpen(false);
    item.onClick?.();
  };

  const buttonClasses = [
    'md3-dropdown-button',
    `md3-dropdown-button--${variant}`,
    disabled && 'md3-dropdown-button--disabled',
    open && 'md3-dropdown-button--open',
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <button
        ref={buttonRef}
        className={buttonClasses}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        {...props}
      >
        <span className="md3-dropdown-button__ripple" />
        
        {icon && (
          <span className="md3-dropdown-button__icon">
            {icon}
          </span>
        )}
        
        <span className="md3-dropdown-button__text">
          {children}
        </span>
        
        <span className={`md3-dropdown-button__arrow ${open ? 'md3-dropdown-button__arrow--up' : ''}`}>
          ▼
        </span>
      </button>

      <MD3Menu
        open={open}
        onClose={handleMenuClose}
        anchorEl={buttonRef.current}
      >
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return <MD3MenuDivider key={index} />;
          }
          
          if (item.type === 'group') {
            return (
              <MD3MenuGroup key={index} label={item.label}>
                {item.items?.map((groupItem, groupIndex) => (
                  <MD3MenuItem
                    key={groupIndex}
                    icon={groupItem.icon}
                    trailingIcon={groupItem.trailingIcon}
                    disabled={groupItem.disabled}
                    onClick={() => handleMenuItemClick(groupItem)}
                  >
                    {groupItem.label}
                  </MD3MenuItem>
                ))}
              </MD3MenuGroup>
            );
          }
          
          return (
            <MD3MenuItem
              key={index}
              icon={item.icon}
              trailingIcon={item.trailingIcon}
              disabled={item.disabled}
              onClick={() => handleMenuItemClick(item)}
            >
              {item.label}
            </MD3MenuItem>
          );
        })}
      </MD3Menu>
    </>
  );
});

MD3DropdownButton.displayName = 'MD3DropdownButton';


// Find the export const MD3BookActionsMenu = memo(({ section and replace it with this

export const MD3BookActionsMenu = memo(({
  open,
  onClose,
  anchorEl,
  anchorPosition, // Support both anchorEl and anchorPosition
  book,
  onRead,
  onEdit,
  onDelete,
  onShare,
  onAddToCollection,
  onStartReading,    // New prop for starting reading
  onStopReading      // New prop for stopping reading
}) => {
  
  // Handle both anchorEl and anchorPosition for flexibility
  const menuProps = anchorEl 
    ? { anchorEl } 
    : { 
        open: open && !!anchorPosition,
        style: anchorPosition ? {
          position: 'fixed',
          top: anchorPosition.y,
          left: anchorPosition.x,
          zIndex: 1000
        } : {}
      };

  return (
    <MD3Menu open={open} onClose={onClose} {...menuProps}>
      {/* Read Book */}
      <MD3MenuItem
        icon="📖"
        onClick={() => {
          onRead?.(book);
          onClose?.();
        }}
      >
        Read Book
      </MD3MenuItem>

      {/* Reading Status Toggle - NEW FUNCTIONALITY */}
      {book?.isReading ? (
        <MD3MenuItem
          icon="⏹️"
          onClick={() => {
            onStopReading?.(book);
            onClose?.();
          }}
        >
          Stop Reading
        </MD3MenuItem>
      ) : (
        <MD3MenuItem
          icon="▶️"
          onClick={() => {
            onStartReading?.(book);
            onClose?.();
          }}
        >
          Start Reading
        </MD3MenuItem>
      )}

   
      
      <MD3MenuItem
        icon="✏️"
        onClick={() => {
          onEdit?.(book);
          onClose?.();
        }}
      >
        Edit Details
      </MD3MenuItem>
      
      <MD3MenuItem
        icon="📂"
        onClick={() => {
          onAddToCollection?.(book);
          onClose?.();
        }}
      >
        Add to Collection
      </MD3MenuItem>
      
      <MD3MenuItem
        icon="📤"
        onClick={() => {
          onShare?.(book);
          onClose?.();
        }}
      >
        Share
      </MD3MenuItem>
      
      <MD3MenuDivider />
      
      <MD3MenuItem
        icon="🗑️"
        onClick={() => {
          onDelete?.(book);
          onClose?.();
        }}
        className="md3-menu-item--destructive"
      >
        Delete
      </MD3MenuItem>
    </MD3Menu>
  );
});

MD3BookActionsMenu.displayName = 'MD3BookActionsMenu';

export const MD3SortMenu = memo(({
  value,
  onChange,
  options = [
    { value: 'title', label: 'Title', icon: '🔤' },
    { value: 'author', label: 'Author', icon: '👤' },
    { value: 'dateAdded', label: 'Date Added', icon: '📅' },
    { value: 'progress', label: 'Progress', icon: '📊' },
    { value: 'rating', label: 'Rating', icon: '⭐' }
  ]
}) => (
  <MD3DropdownButton
    variant="outlined"
    icon="📋"
    menuItems={options.map(option => ({
      label: option.label,
      icon: option.icon,
      onClick: () => onChange?.(option.value),
      disabled: value === option.value
    }))}
  >
    Sort
  </MD3DropdownButton>
));

MD3SortMenu.displayName = 'MD3SortMenu';

export default MD3Menu;
