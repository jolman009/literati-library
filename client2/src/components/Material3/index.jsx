// src/components/Material3/index.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ===============================================
// CORE EXPORTS - Individual Components
// ===============================================
export { default as MD3Tooltip } from './MD3Tooltip.jsx';
export { MD3Divider } from './MD3Divider.jsx';
export { default as MD3Progress } from './MD3Progress.jsx';
export { default as CircularProgress } from './MD3Progress.jsx'; // Alias
export { default as MD3LinearProgress } from './MD3LinearProgress.jsx';
export { default as MD3Chip } from './MD3Chip.jsx';
export { default as MD3Menu } from './MD3Menu.jsx';
export { default as MD3MenuItem } from './MD3MenuItem.jsx';
export { default as MD3MenuDivider } from './MD3MenuDivider.jsx';
export { MD3Select } from './MD3Select.jsx';
export { default as MD3CardHeader } from './MD3CardHeader.jsx';
export { default as MD3CardContent } from './MD3CardContent.jsx';
export { default as MD3CardActions } from './MD3CardActions.jsx';
export { default as MD3DialogActions } from './MD3CardActions.jsx'; // Alias
export { default as MD3Snackbar } from './MD3Snackbar.jsx';
export { default as MD3Checkbox } from './MD3Checkbox.jsx';
export { default as MD3SortMenu } from './MD3SortMenu.jsx';
export { default as MD3Surface } from './MD3Surface.jsx';

// Navigation components
export {
  MD3NavigationRail,
  MD3NavigationBar,
  MD3NavigationDrawer,
  MD3BookLibraryNavigation,
  MD3NavigationLayout,
  useResponsiveNavigation,
} from './MD3Navigation.jsx';

// Theme hooks and providers - using feature-rich implementation from context
export { useThemeColors } from './providers/ThemeProvider.jsx';
export { useMaterial3Theme, Material3ThemeProvider } from '../../contexts/Material3ThemeContext.jsx';

// Import for internal use
import MD3Chip_Imported from './MD3Chip.jsx';
import MD3Snackbar_Imported from './MD3Snackbar.jsx';

// ===============================================
// THEME PROVIDER - Now using feature-rich implementation from contexts
// ===============================================
// Note: Material3ThemeProvider and useMaterial3Theme are exported from
// ../../contexts/Material3ThemeContext.jsx at the top of this file.
// The legacy implementation there includes:
// - localStorage persistence
// - System theme detection
// - Dynamic color generation
// - Proper theme attribute management

// ===============================================
// SNACKBAR PROVIDER
// ===============================================
const MD3SnackbarContext = createContext();

export const MD3SnackbarProvider = ({ children }) => {
  const [snackbars, setSnackbars] = useState([]);

  const showSnackbar = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    setSnackbars(prev => [...prev, { id, message, ...options }]);
    return id;
  }, []);

  const hideSnackbar = useCallback((id) => {
    setSnackbars(prev => prev.filter(s => s.id !== id));
  }, []);

  const value = { showSnackbar, hideSnackbar };

  return (
    <MD3SnackbarContext.Provider value={value}>
      {children}
      <div className="md3-snackbar-container">
        {snackbars.map(snack => (
          <MD3Snackbar_Imported
            key={snack.id}
            message={snack.message}
            open={true}
            onClose={() => hideSnackbar(snack.id)}
            {...snack}
          />
        ))}
      </div>
    </MD3SnackbarContext.Provider>
  );
};

export const useMD3Snackbar = () => {
  const context = useContext(MD3SnackbarContext);
  if (!context) {
    throw new Error('useMD3Snackbar must be used within MD3SnackbarProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useSnackbar = useMD3Snackbar;

// ===============================================
// ADDITIONAL COMPONENTS (Inline)
// ===============================================

// Button Component
export const MD3Button = React.forwardRef(({
  children,
  variant = 'filled',
  icon,
  trailingIcon,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}, ref) => {
  const buttonClass = `md3-button md3-button--${variant} ${disabled ? 'md3-button--disabled' : ''} ${className}`;

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="md3-button__icon">{icon}</span>}
      <span className="md3-button__label">{children}</span>
      {trailingIcon && <span className="md3-button__trailing-icon">{trailingIcon}</span>}
    </button>
  );
});
MD3Button.displayName = 'MD3Button';

// Card Component
export const MD3Card = React.forwardRef(({
  children,
  variant = 'elevated',
  className = '',
  ...props
}, ref) => {
  const cardClass = `md3-card md3-card--${variant} ${className}`;

  return (
    <div ref={ref} className={cardClass} {...props}>
      {children}
    </div>
  );
});
MD3Card.displayName = 'MD3Card';

// TextField Component
export const MD3TextField = React.forwardRef(({
  label,
  value,
  onChange,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  type = 'text',
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;

  const containerClass = `md3-text-field ${focused ? 'md3-text-field--focused' : ''} ${error ? 'md3-text-field--error' : ''} ${disabled ? 'md3-text-field--disabled' : ''} ${className}`;

  return (
    <div className={containerClass}>
      {leadingIcon && <span className="md3-text-field__leading-icon">{leadingIcon}</span>}
      <div className="md3-text-field__input-wrapper">
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="md3-text-field__input"
          {...props}
        />
        <label className={`md3-text-field__label ${hasValue || focused ? 'md3-text-field__label--floating' : ''}`}>
          {label}
        </label>
      </div>
      {trailingIcon && <span className="md3-text-field__trailing-icon">{trailingIcon}</span>}
      {(helperText || error) && (
        <div className="md3-text-field__helper-text">
          {error || helperText}
        </div>
      )}
    </div>
  );
});
MD3TextField.displayName = 'MD3TextField';

// Switch Component
export const MD3Switch = React.forwardRef(({
  checked = false,
  onChange,
  disabled = false,
  label,
  className = '',
  ...props
}, ref) => {
  const switchClass = `md3-switch ${checked ? 'md3-switch--checked' : ''} ${disabled ? 'md3-switch--disabled' : ''} ${className}`;

  return (
    <label className={switchClass}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="md3-switch__input"
        {...props}
      />
      <span className="md3-switch__track">
        <span className="md3-switch__handle" />
      </span>
      {label && <span className="md3-switch__label">{label}</span>}
    </label>
  );
});
MD3Switch.displayName = 'MD3Switch';

// Chip Group Component
export const MD3ChipGroup = React.forwardRef(({
  chips = [],
  selectedChips = [],
  onSelectionChange,
  multiSelect = false,
  className = '',
  ...props
}, ref) => {
  const handleChipClick = (chipValue) => {
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
    <div ref={ref} className={`md3-chip-group ${className}`} {...props}>
      {chips.map(chip => {
        const chipValue = chip.value ?? chip;
        const chipLabel = chip.label ?? chip;
        const isSelected = selectedChips.includes(chipValue);

        return (
          <MD3Chip_Imported
            key={chipValue}
            label={chipLabel}
            selected={isSelected}
            onClick={() => handleChipClick(chipValue)}
          />
        );
      })}
    </div>
  );
});
MD3ChipGroup.displayName = 'MD3ChipGroup';

// Icon Button Component
export const MD3IconButton = React.forwardRef(({
  children,
  variant = 'standard',
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const buttonClass = `md3-icon-button md3-icon-button--${variant} ${disabled ? 'md3-icon-button--disabled' : ''} ${className}`;

  return (
    <button
      ref={ref}
      className={buttonClass}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});
MD3IconButton.displayName = 'MD3IconButton';

// FAB Component
export const MD3FAB = React.forwardRef(({
  children,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const fabClass = `md3-fab md3-fab--${variant} md3-fab--${size} ${disabled ? 'md3-fab--disabled' : ''} ${className}`;

  return (
    <button
      ref={ref}
      className={fabClass}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="md3-fab__icon">{icon}</span>}
      {children && <span className="md3-fab__label">{children}</span>}
    </button>
  );
});
MD3FAB.displayName = 'MD3FAB';

// Alias for backward compatibility
export const MD3FloatingActionButton = MD3FAB;

// Dialog Component
export const MD3Dialog = React.forwardRef(({
  open,
  onClose,
  title,
  children,
  actions,
  className = '',
  ...props
}, ref) => {
  if (!open) return null;

  return (
    <>
      <div className="md3-dialog-scrim" onClick={onClose} />
      <div ref={ref} className={`md3-dialog ${className}`} {...props}>
        <div className="md3-dialog__container">
          {title && <div className="md3-dialog__header">{title}</div>}
          <div className="md3-dialog__content">{children}</div>
          {actions && <div className="md3-dialog__actions">{actions}</div>}
        </div>
      </div>
    </>
  );
});
MD3Dialog.displayName = 'MD3Dialog';

// List Components
export const MD3List = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`md3-list ${className}`} {...props}>
      {children}
    </div>
  );
});
MD3List.displayName = 'MD3List';

export const MD3ListItem = React.forwardRef(({
  children,
  leadingIcon,
  trailingIcon,
  supportingText,
  disabled = false,
  onClick,
  className = '',
  ...props
}, ref) => {
  const itemClass = `md3-list-item ${disabled ? 'md3-list-item--disabled' : ''} ${className}`;

  return (
    <div
      ref={ref}
      className={itemClass}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {leadingIcon && <div className="md3-list-item__leading">{leadingIcon}</div>}
      <div className="md3-list-item__content">
        <div className="md3-list-item__headline">{children}</div>
        {supportingText && <div className="md3-list-item__supporting-text">{supportingText}</div>}
      </div>
      {trailingIcon && <div className="md3-list-item__trailing">{trailingIcon}</div>}
    </div>
  );
});
MD3ListItem.displayName = 'MD3ListItem';

// Tabs Components
export const MD3Tabs = React.forwardRef(({
  children,
  value,
  onChange,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`md3-tabs ${className}`} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            selected: value === index,
            onClick: () => onChange?.(index),
          });
        }
        return child;
      })}
    </div>
  );
});
MD3Tabs.displayName = 'MD3Tabs';

export const MD3Tab = React.forwardRef(({
  children,
  icon,
  selected = false,
  onClick,
  className = '',
  ...props
}, ref) => {
  const tabClass = `md3-tab ${selected ? 'md3-tab--selected' : ''} ${className}`;

  return (
    <button
      ref={ref}
      className={tabClass}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="md3-tab__icon">{icon}</span>}
      <span className="md3-tab__label">{children}</span>
      {selected && <span className="md3-tab__indicator" />}
    </button>
  );
});
MD3Tab.displayName = 'MD3Tab';

// Default export for convenience
const Material3 = {
  Button: MD3Button,
  Card: MD3Card,
  TextField: MD3TextField,
  Switch: MD3Switch,
  ChipGroup: MD3ChipGroup,
  IconButton: MD3IconButton,
  FAB: MD3FAB,
  Dialog: MD3Dialog,
  List: MD3List,
  ListItem: MD3ListItem,
  Tabs: MD3Tabs,
  Tab: MD3Tab,
};

export default Material3;
