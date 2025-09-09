// src/components/Material3/MD3Radio.jsx
import React, { memo, forwardRef } from 'react';
import './MD3Radio.css';

const MD3Radio = memo(forwardRef(({
  checked = false,
  disabled = false,
  label,
  supportingText,
  value,
  name,
  onChange,
  error = false,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const uniqueId = id || `md3-radio-${Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e);
  };

  const containerClasses = [
    'md3-radio',
    disabled && 'md3-radio--disabled',
    error && 'md3-radio--error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <label 
        htmlFor={uniqueId} 
        className="md3-radio__container"
      >
        <div className="md3-radio__control">
          <input
            ref={ref}
            id={uniqueId}
            type="radio"
            checked={checked}
            disabled={disabled}
            value={value}
            name={name}
            onChange={handleChange}
            className="md3-radio__input"
            {...props}
          />
          
          <div className="md3-radio__button">
            <div className="md3-radio__background" />
            <div className="md3-radio__indicator" />
          </div>
          
          <div className="md3-radio__ripple" />
        </div>
        
        {label && (
          <div className="md3-radio__label-container">
            <span className="md3-radio__label">
              {label}
              {required && <span className="md3-radio__asterisk"> *</span>}
            </span>
            {supportingText && (
              <span className="md3-radio__supporting-text">
                {supportingText}
              </span>
            )}
          </div>
        )}
      </label>
    </div>
  );
}));

MD3Radio.displayName = 'MD3Radio';

// Radio Group Component
export const MD3RadioGroup = memo(({
  options = [],
  value,
  onChange,
  name,
  disabled = false,
  label,
  supportingText,
  error = false,
  required = false,
  orientation = 'vertical',
  className = ''
}) => {
  const handleRadioChange = (e) => {
    onChange?.(e.target.value, e);
  };

  const groupClasses = [
    'md3-radio-group',
    `md3-radio-group--${orientation}`,
    disabled && 'md3-radio-group--disabled',
    error && 'md3-radio-group--error',
    className
  ].filter(Boolean).join(' ');

  const groupName = name || `md3-radio-group-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={groupClasses}>
      {label && (
        <div className="md3-radio-group__label-container">
          <span className="md3-radio-group__label">
            {label}
            {required && <span className="md3-radio-group__asterisk"> *</span>}
          </span>
          {supportingText && (
            <span className="md3-radio-group__supporting-text">
              {supportingText}
            </span>
          )}
        </div>
      )}
      
      <div 
        className="md3-radio-group__options" 
        role="radiogroup"
        aria-labelledby={label ? 'radio-group-label' : undefined}
      >
        {options.map((option, index) => {
          const isObject = typeof option === 'object';
          const optionValue = isObject ? option.value : option;
          const optionLabel = isObject ? option.label : option;
          const optionSupportingText = isObject ? option.supportingText : undefined;
          const optionDisabled = disabled || (isObject && option.disabled);
          
          return (
            <MD3Radio
              key={optionValue || index}
              checked={value === optionValue}
              disabled={optionDisabled}
              label={optionLabel}
              supportingText={optionSupportingText}
              value={optionValue}
              name={groupName}
              onChange={handleRadioChange}
              error={error}
            />
          );
        })}
      </div>
    </div>
  );
});

MD3RadioGroup.displayName = 'MD3RadioGroup';

// Reading Preference Radio Group (specialized component)
export const MD3ReadingPreferenceRadio = memo(({
  value,
  onChange,
  className = ''
}) => {
  const preferences = [
    {
      value: 'light',
      label: 'Light Mode',
      supportingText: 'Better for reading during the day'
    },
    {
      value: 'dark',
      label: 'Dark Mode', 
      supportingText: 'Easier on the eyes in low light'
    },
    {
      value: 'sepia',
      label: 'Sepia Mode',
      supportingText: 'Warm tone for comfortable reading'
    },
    {
      value: 'auto',
      label: 'Auto',
      supportingText: 'Follow system preference'
    }
  ];

  return (
    <MD3RadioGroup
      options={preferences}
      value={value}
      onChange={onChange}
      label="Reading Theme"
      supportingText="Choose your preferred reading experience"
      name="reading-theme"
      className={`md3-reading-preference-radio ${className}`}
    />
  );
});

MD3ReadingPreferenceRadio.displayName = 'MD3ReadingPreferenceRadio';

// Book Format Radio Group (specialized component)
export const MD3BookFormatRadio = memo(({
  value,
  onChange,
  className = ''
}) => {
  const formats = [
    {
      value: 'epub',
      label: 'EPUB',
      supportingText: 'Best for most e-readers and apps'
    },
    {
      value: 'pdf',
      label: 'PDF',
      supportingText: 'Preserves original formatting'
    },
    {
      value: 'mobi',
      label: 'MOBI',
      supportingText: 'Optimized for Kindle devices'
    }
  ];

  return (
    <MD3RadioGroup
      options={formats}
      value={value}
      onChange={onChange}
      label="Preferred Format"
      supportingText="Select your default download format"
      name="book-format"
      orientation="horizontal"
      className={`md3-book-format-radio ${className}`}
    />
  );
});

MD3BookFormatRadio.displayName = 'MD3BookFormatRadio';

export default MD3RadioGroup;