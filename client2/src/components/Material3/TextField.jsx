import React, { useState } from 'react';
import './MD3TextField.css';

const TextField = ({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  error = false,
  helperText = '',
  leadingIcon,
  trailingIcon,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;

  const fieldClasses = [
    'md3-text-field--filled', // Default to filled variant
    focused && 'md3-text-field--focused',
    hasValue && 'md3-text-field--populated',
    error && 'md3-text-field--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`md3-text-field ${fieldClasses}`}>
      <div className="md3-text-field__container">
        {leadingIcon && (
          <span className="md3-text-field__icon md3-text-field__icon--leading">
            {leadingIcon}
          </span>
        )}

        <div className="md3-text-field__input-container">
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="md3-text-field__input"
            placeholder=" "
            {...props}
          />

          <label className="md3-text-field__label">
            {label}
          </label>
        </div>

        {trailingIcon && (
          <span className="md3-text-field__icon md3-text-field__icon--trailing">
            {trailingIcon}
          </span>
        )}
      </div>

      {helperText && (
        <p className={`md3-text-field__supporting-text ${
          error ? 'md3-text-field__supporting-text--error' : ''
        }`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default TextField;