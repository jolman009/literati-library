import React from 'react';

// Material 3 Radio Button Component
const Radio = ({ 
  checked, 
  onChange, 
  label, 
  name, 
  value,
  disabled = false,
  className = ''
}) => {
  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e.target.value, e);
    }
  };

  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-38 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <span className="relative inline-flex items-center justify-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
        />
        
        {/* Radio button circle */}
        <span className={`relative w-5 h-5 rounded-full border-2 transition-all duration-medium2 ${
          checked 
            ? 'border-primary' 
            : 'border-on-surface-variant peer-focus-visible:border-primary'
        }`}>
          {/* Inner dot */}
          {checked && (
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary animate-scale-in" />
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

// Radio Group Component for easier management
export const RadioGroup = ({ 
  name, 
  value, 
  onChange, 
  options, 
  disabled = false,
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          disabled={disabled || option.disabled}
        />
      ))}
    </div>
  );
};

export default Radio;