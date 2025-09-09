import React, { useState } from 'react';

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
    'md3-text-field',
    focused && 'md3-text-field--focused',
    hasValue && 'md3-text-field--filled',
    error && 'md3-text-field--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="relative">
      <div className={fieldClasses}>
        {leadingIcon && (
          <span className="ml-4 text-on-surface-variant">
            {leadingIcon}
          </span>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="md3-text-field__input"
          {...props}
        />
        
        <label className="md3-text-field__label">
          {label}
        </label>
        
        {trailingIcon && (
          <span className="mr-4 text-on-surface-variant">
            {trailingIcon}
          </span>
        )}
      </div>
      
      {helperText && (
        <p className={`mt-1 px-4 text-body-small ${
          error ? 'text-error' : 'text-on-surface-variant'
        }`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default TextField;