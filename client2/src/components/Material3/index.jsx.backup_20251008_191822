// src/components/Material3/index.jsx

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import MD3Snackbar from './MD3Snackbar';

// -------- Re-exports (barrel) for extracted MD3 components --------
export { default as MD3Tooltip } from './MD3Tooltip.jsx';
export { MD3Divider } from './MD3Divider.jsx';
export { default as MD3Progress } from './MD3Progress.jsx';
export { default as MD3LinearProgress } from './MD3LinearProgress.jsx';
export { default as MD3Chip } from './MD3Chip.jsx';
export { default as MD3Menu } from './MD3Menu.jsx';
export { default as MD3MenuItem } from './MD3MenuItem.jsx';
export { default as MD3MenuDivider } from './MD3MenuDivider.jsx';
export { MD3Select } from './MD3Select.jsx';
export { default as MD3CardHeader } from './MD3CardHeader.jsx';
export { default as MD3CardContent } from './MD3CardContent.jsx';
export { default as MD3CardActions } from './MD3CardActions.jsx';

export {
  MD3NavigationRail,
  MD3NavigationBar,
  MD3NavigationDrawer,
  MD3BookLibraryNavigation,
  MD3NavigationLayout,
  useResponsiveNavigation,
} from './MD3Navigation.jsx';

// ---- Bring extracted components into local scope for composites/aliases ----
import MD3Chip_Imported from './MD3Chip.jsx';
import MD3Progress_Imported from './MD3Progress.jsx';
import MD3Menu_Imported from './MD3Menu.jsx';
import MD3MenuItem_Imported from './MD3MenuItem.jsx';

// ===============================================
// THEME PROVIDER
// ===============================================
const Material3ThemeContext = createContext();

export const Material3ThemeProvider = ({ children, defaultTheme = 'auto' }) => {
  const [theme, setTheme] = useState(defaultTheme);

  // Resolve 'auto' using system preference
  const resolved = theme === 'auto'
    ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;

  // Apply theme class & data attribute on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('theme-dark', 'theme-light');
    html.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
    html.setAttribute('data-theme', resolved);
  }, [resolved]);
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setThemeMode = useCallback(mode => {
    setTheme(mode);
  }, []);

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDark: theme === 'dark',
  };


    
  return (
    <Material3ThemeContext.Provider value={value}>
      <div className={`md3-theme ${resolved === 'dark' ? 'md3-theme--dark' : 'md3-theme--light'}`}>
        {children}
      </div>
    </Material3ThemeContext.Provider>
  );
};

export const useMaterial3Theme = () => {
  const context = useContext(Material3ThemeContext);
  if (!context) {
    throw new Error('useMaterial3Theme must be used within a Material3ThemeProvider');
  }
  return context;
};

// ===============================================
// SNACKBAR PROVIDER
// ===============================================
const SnackbarContext = createContext();

export const MD3SnackbarProvider = ({ children }) => {
  const [snackbars, setSnackbars] = useState([]);

  const showSnackbar = useCallback(({ message, variant = 'default', duration = 4000, action }) => {
    const id = Date.now() + Math.random();
    const snackbar = {
      id,
      message: message || 'Action completed',
      variant: variant || 'info',
      duration,
      action,
      open: true,
    };

    setSnackbars(prev => [...prev, snackbar]);

    if (duration > 0) {
      setTimeout(() => {
        setSnackbars(prev => prev.filter(s => s.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const hideSnackbar = useCallback(id => {
    setSnackbars(prev => prev.filter(s => s.id !== id));
  }, []);

  const hideAll = useCallback(() => {
    setSnackbars([]);
  }, []);

  const value = { showSnackbar, hideSnackbar, hideAll };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {/* Render snackbars at the bottom of screen */}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2 max-w-sm mx-auto md:left-auto md:right-4 md:max-w-md">
        {snackbars.map(snackbar => (
          <MD3Snackbar
            key={snackbar.id}
            message={snackbar.message}
            variant={snackbar.variant}
            action={snackbar.action}
            open={snackbar.open}
            onClose={() => hideSnackbar(snackbar.id)}
          />
        ))}
      </div>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within a MD3SnackbarProvider');
  return context;
};

// ===============================================
// INLINE (kept) PRIMITIVES & COMPOSITES
// ===============================================

// Button
export const MD3Button = React.forwardRef(
  (
    {
      variant = 'filled',
      size = 'medium',
      icon,
      trailingIcon,
      disabled = false,
      loading = false,
      children,
      className = '',
      style = {},
      ...props
    },
    ref
  ) => {
    const baseStyle = {
      padding: size === 'small' ? '8px 16px' : size === 'large' ? '16px 32px' : '12px 24px',
      borderRadius: '24px',
      border: variant === 'outlined' ? '1px solid #79747e' : 'none',
      background: variant === 'filled' ? '#6750a4' : variant === 'outlined' ? 'transparent' : '#e7e0ec',
      color: variant === 'filled' ? '#ffffff' : '#6750a4',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1,
      ...style,
    };

    return (
      <button ref={ref} style={baseStyle} className={className} disabled={disabled || loading} {...props}>
        {loading ? (
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          icon
        )}
        {children}
        {trailingIcon}
      </button>
    );
  }
);
MD3Button.displayName = 'MD3Button';

// Card (surface)
export const MD3Card = React.forwardRef(({ variant = 'elevated', children, className = '', style = {}, ...props }, ref) => {
  // Use MD3 tokens for proper theming in light/dark modes
  const bgByVariant =
    variant === 'filled'
      ? 'var(--md-sys-color-surface-container-highest)'
      : variant === 'outlined'
      ? 'var(--md-sys-color-surface)'
      : 'var(--md-sys-color-surface-container-low)'; // elevated default

  const boxShadow =
    variant === 'elevated'
      ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
      : variant === 'filled'
      ? '0 1px 2px rgba(0,0,0,0.1)'
      : 'none';

  const cardStyle = {
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: bgByVariant,
    color: 'var(--md-sys-color-on-surface)',
    boxShadow,
    border: variant === 'outlined' ? '1px solid var(--md-sys-color-outline-variant)' : 'none',
    ...style,
  };

  return (
    <div ref={ref} style={cardStyle} className={`md3-card ${className}`} {...props}>
      {children}
    </div>
  );
});
MD3Card.displayName = 'MD3Card';

// TextField
export const MD3TextField = React.forwardRef(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      type = 'text',
      multiline = false,
      rows = 1,
      required = false,
      disabled = false,
      leadingIcon,
      trailingIcon,
      className = '',
      style = {},
      ...props
    },
    ref
  ) => {
    const textFieldStyle = { display: 'flex', flexDirection: 'column', gap: '4px', ...style };
    const inputStyle = {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #79747e',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      color: '#1c1b1f',
      outline: 'none',
      transition: 'border-color 0.2s ease',
      resize: multiline ? 'vertical' : 'none',
      minHeight: multiline ? `${rows * 1.5}em` : 'auto',
    };
    const InputComponent = multiline ? 'textarea' : 'input';

    return (
      <div style={textFieldStyle} className={`md3-textfield ${className}`}>
        {label && (
          <label style={{ fontSize: '12px', fontWeight: '500', color: '#49454f' }}>
            {label} {required && <span style={{ color: '#ba1a1a' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leadingIcon && <span style={{ position: 'absolute', left: '12px', fontSize: '16px', color: '#49454f' }}>{leadingIcon}</span>}
          <InputComponent
            ref={ref}
            type={multiline ? undefined : type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            rows={multiline ? rows : undefined}
            style={{
              ...inputStyle,
              paddingLeft: leadingIcon ? '40px' : '16px',
              paddingRight: trailingIcon ? '40px' : '16px',
            }}
            {...props}
          />
          {trailingIcon && <span style={{ position: 'absolute', right: '12px', fontSize: '16px', color: '#49454f' }}>{trailingIcon}</span>}
        </div>
      </div>
    );
  }
);
MD3TextField.displayName = 'MD3TextField';

// Dialog
export const MD3Dialog = React.forwardRef(({ open = false, onClose, title, children, maxWidth = 'md', className = '', style = {}, ...props }, ref) => {
  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  };

  const dialogStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
    maxWidth: maxWidth === 'sm' ? '400px' : maxWidth === 'lg' ? '800px' : '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    ...style,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        ref={ref}
        style={dialogStyle}
        className={`md3-dialog ${className}`}
        onClick={e => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div style={{ padding: '20px 20px 0', borderBottom: '1px solid #e7e0ec' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '600', color: '#1c1b1f' }}>{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
});
MD3Dialog.displayName = 'MD3Dialog';

// Surface
export const MD3Surface = React.forwardRef(({ variant = 'elevated', children, className = '', style = {}, ...props }, ref) => {
  const surfaceStyle = {
    backgroundColor: '#ffffff',
    borderRadius: variant === 'elevated' ? '8px' : '0px',
    boxShadow: variant === 'elevated' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
    ...style,
  };

  return (
    <div ref={ref} style={surfaceStyle} className={`md3-surface ${className}`} {...props}>
      {children}
    </div>
  );
});
MD3Surface.displayName = 'MD3Surface';

// ---- IMPORTANT: We no longer define MD3Progress or MD3Chip inline ----
// Use the imported versions for aliases/composites below.

// Floating Action Button
export const MD3FloatingActionButton = React.forwardRef(({ icon, size = 'medium', disabled = false, className = '', style = {}, ...props }, ref) => {
  const fabStyle = {
    width: size === 'small' ? '40px' : size === 'large' ? '64px' : '56px',
    height: size === 'small' ? '40px' : size === 'large' ? '64px' : '56px',
    borderRadius: '50%',
    backgroundColor: '#6750a4',
    color: '#ffffff',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  return (
    <button ref={ref} style={fabStyle} className={`md3-fab ${className}`} disabled={disabled} {...props}>
      {icon}
    </button>
  );
});
MD3FloatingActionButton.displayName = 'MD3FloatingActionButton';

// CircularProgress alias → uses imported MD3Progress
export const CircularProgress = React.forwardRef((props, ref) => {
  return <MD3Progress_Imported ref={ref} variant="circular" {...props} />;
});
CircularProgress.displayName = 'CircularProgress';

// Theme color helper
export const useThemeColors = () => ({
  primary: '#6750a4',
  secondary: '#625b71',
  tertiary: '#7d5260',
  surface: '#ffffff',
  background: '#fffbfe',
  error: '#ba1a1a',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',
  onTertiary: '#ffffff',
  onSurface: '#1c1b1f',
  onBackground: '#1c1b1f',
  onError: '#ffffff',
});

// Sort Menu (inline)
export const MD3SortMenu = React.forwardRef(({ options = [], value, onChange, label = 'Sort by', className = '', style = {}, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuStyle = { position: 'relative', display: 'inline-block', ...style };
  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #79747e',
    backgroundColor: '#ffffff',
    color: '#1c1b1f',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  };
  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #79747e',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    marginTop: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
  };
  const optionStyle = {
    padding: '12px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '1px solid #e7e0ec',
    transition: 'background-color 0.2s ease',
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={ref} style={menuStyle} className={`md3-sort-menu ${className}`} {...props}>
      <button style={buttonStyle} onClick={() => setIsOpen(!isOpen)} onBlur={() => setTimeout(() => setIsOpen(false), 150)}>
        <span>{selectedOption?.label || label}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          {options.map((option, index) => (
            <div
              key={option.value}
              style={{
                ...optionStyle,
                backgroundColor: option.value === value ? '#e7e0ec' : 'transparent',
                borderBottom: index === options.length - 1 ? 'none' : '1px solid #e7e0ec',
              }}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onMouseEnter={e => {
                if (option.value !== value) e.target.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={e => {
                if (option.value !== value) e.target.style.backgroundColor = 'transparent';
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
MD3SortMenu.displayName = 'MD3SortMenu';

// Chip Group (uses imported MD3Chip)
export const MD3ChipGroup = React.forwardRef(
  ({ chips = [], selectedChips = [], onSelectionChange, multiSelect = false, className = '', style = {}, ...props }, ref) => {
    const groupStyle = { display: 'flex', flexWrap: 'wrap', gap: '8px', ...style };

    const handleChipClick = chipValue => {
      if (!onSelectionChange) return;
      if (multiSelect) {
        const newSelection = selectedChips.includes(chipValue)
          ? selectedChips.filter(v => v !== chipValue)
          : [...selectedChips, chipValue];
        onSelectionChange(newSelection);
      } else {
        onSelectionChange(selectedChips.includes(chipValue) ? [] : [chipValue]);
      }
    };

    return (
      <div ref={ref} style={groupStyle} className={`md3-chip-group ${className}`} {...props}>
        {chips.map(chip => {
          const chipValue = chip.value ?? chip;
          const chipLabel = chip.label ?? chip;
          const isSelected = selectedChips.includes(chipValue);
          return (
            <MD3Chip_Imported
              key={chipValue}
              label={chipLabel}
              onClick={() => handleChipClick(chipValue)}
              style={{
                backgroundColor: isSelected ? '#6750a4' : '#e7e0ec',
                color: isSelected ? '#ffffff' : '#1c1b1f',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </div>
    );
  }
);
MD3ChipGroup.displayName = 'MD3ChipGroup';

// Alias: MD3AssistChip -> MD3Chip
export const MD3AssistChip = MD3Chip_Imported;

// Switch (inline)
export const MD3Switch = React.forwardRef(({ checked = false, onChange, disabled = false, label, className = '', style = {}, ...props }, ref) => {
  const switchStyle = { display: 'inline-flex', alignItems: 'center', gap: '12px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, ...style };
  const trackStyle = { width: '52px', height: '32px', borderRadius: '16px', backgroundColor: checked ? '#6750a4' : '#79747e', position: 'relative', transition: 'background-color 0.2s ease', cursor: disabled ? 'not-allowed' : 'pointer' };
  const thumbStyle = { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff', position: 'absolute', top: '6px', left: checked ? '26px' : '6px', transition: 'left 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };

  return (
    <label ref={ref} style={switchStyle} className={`md3-switch ${className}`} {...props}>
      <div style={trackStyle} onClick={() => !disabled && onChange && onChange(!checked)}>
        <div style={thumbStyle} />
      </div>
      {label && <span style={{ fontSize: '14px', color: '#1c1b1f' }}>{label}</span>}
      <input type="checkbox" checked={checked} onChange={e => onChange && onChange(e.target.checked)} disabled={disabled} style={{ display: 'none' }} />
    </label>
  );
});
MD3Switch.displayName = 'MD3Switch';

// Checkbox (inline)
export const MD3Checkbox = React.forwardRef(({ checked = false, onChange, disabled = false, label, className = '', style = {}, id, ...props }, ref) => {
  const checkboxStyle = { display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, ...style };
  const [isFocused, setIsFocused] = React.useState(false);
  const boxStyle = { 
    width: '18px', 
    height: '18px', 
    borderRadius: '2px', 
    border: checked ? '2px solid var(--md-sys-color-primary)' : '2px solid var(--md-sys-color-on-surface-variant)', 
    backgroundColor: checked ? 'var(--md-sys-color-primary)' : 'transparent', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    transition: 'all 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: isFocused ? '2px solid var(--md-sys-color-primary)' : 'none',
    outlineOffset: isFocused ? '2px' : 0,
    boxShadow: isFocused ? '0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent)' : 'none',
  };
  const checkStyle = { 
    width: '10px', 
    height: '10px', 
    color: 'var(--md-sys-color-on-primary)', 
    fontSize: '12px', 
    lineHeight: '1',
    opacity: checked ? 1 : 0,
    transition: 'opacity 0.2s ease'
  };

  return (
    <label
      ref={ref}
      style={checkboxStyle}
      className={`md3-checkbox ${className}`}
      
      {...props}
    >
      <div style={boxStyle}>
        <div style={checkStyle}>✓</div>
      </div>
      {label && <span style={{ fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>{label}</span>}
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange} 
        disabled={disabled} 
        id={id}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }} 
      />
    </label>
  );
});
MD3Checkbox.displayName = 'MD3Checkbox';

// Dialog Actions (inline)
export const MD3DialogActions = React.forwardRef(({ children, className = '', style = {}, ...props }, ref) => {
  const actionsStyle = { display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '16px 20px 20px', borderTop: '1px solid #e7e0ec', ...style };
  return (
    <div ref={ref} style={actionsStyle} className={`md3-dialog-actions ${className}`} {...props}>
      {children}
    </div>
  );
});
MD3DialogActions.displayName = 'MD3DialogActions';

// Book Actions Menu (uses imported MD3Menu + MD3MenuItem)
export const MD3BookActionsMenu = React.forwardRef(({ book, onAction, className = '', style = {}, ...props }, ref) => {
  const actions = [
    { label: 'Read', action: 'read', icon: '📖' },
    { label: 'Edit', action: 'edit', icon: '✏️' },
    { label: 'Delete', action: 'delete', icon: '🗑️' },
  ];

  return (
    <MD3Menu_Imported ref={ref} className={className} style={style} {...props}>
      {actions.map(action => (
        <MD3MenuItem_Imported key={action.action} onClick={() => onAction && onAction(action.action, book)}>
          <span style={{ marginRight: '8px' }}>{action.icon}</span>
          {action.label}
        </MD3MenuItem_Imported>
      ))}
    </MD3Menu_Imported>
  );
});
MD3BookActionsMenu.displayName = 'MD3BookActionsMenu';

// Book FAB (inline)
export const MD3BookLibraryFab = React.forwardRef(({ onClick, className = '', style = {}, ...props }, ref) => {
  return (
    <MD3FloatingActionButton
      ref={ref}
      icon="➕"
      onClick={onClick}
      className={className}
      style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#6750a4', ...style }}
      {...props}
    />
  );
});
MD3BookLibraryFab.displayName = 'MD3BookLibraryFab';

// IconButton (inline)
export const MD3IconButton = React.forwardRef(
  ({ children, size = 'medium', variant = 'standard', disabled = false, className = '', style = {}, ...props }, ref) => {
    const iconButtonStyle = {
      width: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
      height: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: variant === 'filled' ? '#6750a4' : 'transparent',
      color: variant === 'filled' ? '#ffffff' : variant === 'error' ? '#ba1a1a' : '#6750a4',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size === 'small' ? '16px' : size === 'large' ? '24px' : '20px',
      transition: 'all 0.2s ease',
      opacity: disabled ? 0.6 : 1,
      ...style,
    };

    return (
      <button ref={ref} style={iconButtonStyle} className={`md3-icon-button ${className}`} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);
MD3IconButton.displayName = 'MD3IconButton';

// Progress Controls (keep your existing file)
export { default as MD3BookProgressControls } from './MD3BookProgressControls.jsx';

// CSS animations (once)
if (typeof document !== 'undefined' && !document.querySelector('#md3-animations')) {
  const style = document.createElement('style');
  style.id = 'md3-animations';
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes progress-indeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}
