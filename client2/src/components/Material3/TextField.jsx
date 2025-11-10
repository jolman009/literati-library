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
  const [showPassword, setShowPassword] = useState(false);
  const hasValue = value && value.length > 0;

  // Determine actual input type
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // Eye icons for password visibility toggle
  const EyeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
    </svg>
  );

  // Determine which trailing icon to show
  const effectiveTrailingIcon = type === 'password' ? (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="md3-text-field__password-toggle"
      tabIndex={-1}
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  ) : trailingIcon;

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
            type={inputType}
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

        {effectiveTrailingIcon && (
          <span className="md3-text-field__icon md3-text-field__icon--trailing">
            {effectiveTrailingIcon}
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