
import React from 'react';

// Material 3 Checkbox Component
const Checkbox = ({ checked, onChange, label, id = 'm3-checkbox' }) => {
  return (
    <label htmlFor={id} className="flex items-center space-x-3 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded border border-outline checked:bg-primary checked:border-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
      />
      <span className="text-sm text-on-surface">{label}</span>
    </label>
);

return (
  <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-38 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
    <span className="relative inline-flex items-center justify-center">
      <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          ref={(el) => {
            if (el) {
              el.indeterminate = indeterminate;
            }
          }}
        />
        
        {/* Checkbox box */}
        <span className={`relative w-[18px] h-[18px] rounded-extra-small border-2 transition-all duration-medium2 ${
          checked || indeterminate
            ? 'border-primary bg-primary' 
            : 'border-on-surface-variant peer-focus-visible:border-primary'
        }`}>
          {/* Checkmark */}
          {checked && !indeterminate && (
            <svg 
              className="absolute inset-0 w-full h-full text-on-primary animate-scale-in" 
              viewBox="0 0 18 18" 
              fill="none"
            >
              <path 
                d="M15 5L7 13L3 9" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
          
          {/* Indeterminate line */}
          {indeterminate && !checked && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-on-primary animate-scale-in" />
          )}
        </span>
        
        {/* Hover/focus ring */}
        <span className="absolute -inset-2 rounded-full peer-hover:bg-on-surface peer-hover:bg-opacity-hover peer-focus-visible:bg-primary peer-focus-visible:bg-opacity-focus transition-colors duration-short4" />
      </span>
      
      {label && (
        <span className={`text-body-large text-on-surface select-none ${disabled ? 'opacity-60' : ''}`}>
          {label}
        </span>
      )}
    </label>
  );
};

// Checkbox Group Component for managing multiple checkboxes
export const CheckboxGroup = ({ 
  options, 
  values = [], 
  onChange,
  disabled = false,
  className = '' 
}) => {
  const handleCheckboxChange = (value, checked) => {
    const newValues = checked 
      ? [...values, value]
      : values.filter(v => v !== value);
    onChange(newValues);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={values.includes(option.value)}
          onChange={(checked) => handleCheckboxChange(option.value, checked)}
          disabled={disabled || option.disabled}
        />
      ))}
    </div>
  );
};

export default Checkbox;