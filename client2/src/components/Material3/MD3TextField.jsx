// src/components/Material3/MD3TextField.jsx
import React, { memo, forwardRef, useState } from 'react';
import './MD3TextField.css';

const MD3TextField = memo(forwardRef(({
  label,
  supportingText,
  errorText,
  value,
  defaultValue,
  variant = 'outlined',
  disabled = false,
  error = false,
  required = false,
  leadingIcon,
  trailingIcon,
  className = '',
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value || defaultValue));

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    setHasValue(Boolean(e.target.value));
    onBlur?.(e);
  };

  const classes = [
    'md3-text-field',
    `md3-text-field--${variant}`,
    focused && 'md3-text-field--focused',
    hasValue && 'md3-text-field--populated',
    disabled && 'md3-text-field--disabled',
    error && 'md3-text-field--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="md3-text-field__container">
        {leadingIcon && (
          <span className="md3-text-field__icon md3-text-field__icon--leading">
            {leadingIcon}
          </span>
        )}
        
        <div className="md3-text-field__input-container">
          <input
            ref={ref}
            className="md3-text-field__input"
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            required={required}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          
          {label && (
            <span className="md3-text-field__label">
              {label}
              {required && <span className="md3-text-field__asterisk"> *</span>}
            </span>
          )}
        </div>
        
        {trailingIcon && (
          <span className="md3-text-field__icon md3-text-field__icon--trailing">
            {trailingIcon}
          </span>
        )}
      </div>
      
      {(supportingText || errorText) && (
        <div className="md3-text-field__supporting-text">
          {error ? errorText : supportingText}
        </div>
      )}
    </div>
  );
}));

MD3TextField.displayName = 'MD3TextField';

export { MD3Button, MD3Card, MD3Surface, MD3TextField };