// src/components/Material3/MD3Checkbox.jsx
import React, { memo, forwardRef, useRef, useEffect } from 'react';
import './MD3Checkbox.css';

const MD3Checkbox = memo(forwardRef(({
  checked = false,
  indeterminate = false,
  disabled = false,
  label,
  supportingText,
  error = false,
  required = false,
  onChange,
  className = '',
  id,
  ...props
}, ref) => {
  const internalRef = useRef();
  const checkboxRef = ref || internalRef;
  const uniqueId = id || `md3-checkbox-${Math.random().toString(36).substr(2, 9)}`;

  // Handle indeterminate state
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate, checkboxRef]);

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e);
  };

  const containerClasses = [
    'md3-checkbox',
    disabled && 'md3-checkbox--disabled',
    error && 'md3-checkbox--error',
    className
  ].filter(Boolean).join(' ');

  const isChecked = checked || indeterminate;

  return (
    <div className={containerClasses}>
      <label 
        htmlFor={uniqueId} 
        className="md3-checkbox__container"
      >
        <div className="md3-checkbox__control">
          <input
            ref={checkboxRef}
            id={uniqueId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            className="md3-checkbox__input"
            {...props}
          />
          
          <div className={`md3-checkbox__box ${isChecked ? 'md3-checkbox__box--checked' : ''}`}>
            <div className="md3-checkbox__background" />
            
            {/* Checkmark icon */}
            {checked && !indeterminate && (
              <svg 
                className="md3-checkbox__icon md3-checkbox__icon--checkmark" 
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
                <path 
                  d="M6.61 11.89L3.5 8.78 2.44 9.84 6.61 14.01 15.56 5.06 14.5 4z"
                  fill="currentColor"
                />
              </svg>
            )}
            
            {/* Indeterminate icon */}
            {indeterminate && (
              <div className="md3-checkbox__icon md3-checkbox__icon--indeterminate" />
            )}
          </div>
          
          <div className="md3-checkbox__ripple" />
        </div>
        
        {label && (
          <div className="md3-checkbox__label-container">
            <span className="md3-checkbox__label">
              {label}
              {required && <span className="md3-checkbox__asterisk"> *</span>}
            </span>
            {supportingText && (
              <span className="md3-checkbox__supporting-text">
                {supportingText}
              </span>
            )}
          </div>
        )}
      </label>
    </div>
  );
}));

MD3Checkbox.displayName = 'MD3Checkbox';

// Checkbox Group Component
export const MD3CheckboxGroup = memo(({
  options = [],
  values = [],
  onChange,
  disabled = false,
  label,
  supportingText,
  error = false,
  required = false,
  className = ''
}) => {
  const handleCheckboxChange = (value, checked) => {
    const newValues = checked 
      ? [...values, value]
      : values.filter(v => v !== value);
    
    onChange?.(newValues);
  };

  const groupClasses = [
    'md3-checkbox-group',
    disabled && 'md3-checkbox-group--disabled',
    error && 'md3-checkbox-group--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses}>
      {label && (
        <div className="md3-checkbox-group__label-container">
          <span className="md3-checkbox-group__label">
            {label}
            {required && <span className="md3-checkbox-group__asterisk"> *</span>}
          </span>
          {supportingText && (
            <span className="md3-checkbox-group__supporting-text">
              {supportingText}
            </span>
          )}
        </div>
      )}
      
      <div className="md3-checkbox-group__options" role="group">
        {options.map((option, index) => {
          const isObject = typeof option === 'object';
          const value = isObject ? option.value : option;
          const optionLabel = isObject ? option.label : option;
          const optionDisabled = disabled || (isObject && option.disabled);
          
          return (
            <MD3Checkbox
              key={value || index}
              checked={values.includes(value)}
              disabled={optionDisabled}
              label={optionLabel}
              onChange={(e) => handleCheckboxChange(value, e.target.checked)}
            />
          );
        })}
      </div>
    </div>
  );
});

MD3CheckboxGroup.displayName = 'MD3CheckboxGroup';

export default MD3Checkbox;