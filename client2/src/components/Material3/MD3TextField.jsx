// src/components/Material3/MD3TextField.jsx
import React, { memo, forwardRef, useState, useId } from 'react';
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
  multiline = false,
  rows = 3,
  className = '',
  id: externalId,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const reactId = useId();
  const inputId = externalId || reactId;
  const supportingTextId = `${inputId}-supporting`;
  const errorTextId = `${inputId}-error`;
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
    multiline && 'md3-text-field--textarea',
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
          {multiline ? (
            <textarea
              ref={ref}
              id={inputId}
              className="md3-text-field__input"
              value={value}
              defaultValue={defaultValue}
              disabled={disabled}
              required={required}
              rows={rows}
              placeholder=" "
              aria-invalid={error || undefined}
              aria-describedby={error && errorText ? errorTextId : supportingText ? supportingTextId : undefined}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={(e) => {
                props.onChange?.(e);
                setHasValue(Boolean(e.target.value));
              }}
              {...props}
            />
          ) : (
            <input
              ref={ref}
              id={inputId}
              className="md3-text-field__input"
              value={value}
              defaultValue={defaultValue}
              disabled={disabled}
              required={required}
              placeholder=" "
              aria-invalid={error || undefined}
              aria-describedby={error && errorText ? errorTextId : supportingText ? supportingTextId : undefined}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={(e) => {
                props.onChange?.(e);
                setHasValue(Boolean(e.target.value));
              }}
              {...props}
            />
          )}

          {label && (
            <label htmlFor={inputId} className="md3-text-field__label">
              {label}
              {required && <span className="md3-text-field__asterisk"> *</span>}
            </label>
          )}
        </div>
        
        {trailingIcon && (
          <span className="md3-text-field__icon md3-text-field__icon--trailing">
            {trailingIcon}
          </span>
        )}
      </div>
      
      {(supportingText || errorText) && (
        <div
          id={error && errorText ? errorTextId : supportingTextId}
          className="md3-text-field__supporting-text"
          role={error && errorText ? 'alert' : undefined}
        >
          {error ? errorText : supportingText}
        </div>
      )}
    </div>
  );
}));

MD3TextField.displayName = 'MD3TextField';

export default MD3TextField;
