import React from 'react';

// Material 3 Switch Component
const Switch = ({ 
  checked, 
  onChange, 
  disabled = false,
  label,
  className = ''
}) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex h-8 w-[52px] items-center rounded-full transition-all duration-medium2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-surface-variant'
      } ${disabled ? 'opacity-38 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <span className="sr-only">{label || 'Toggle switch'}</span>
      
      {/* Track */}
      <span className={`absolute inset-0 rounded-full transition-colors duration-medium2 ${
        checked ? 'bg-primary' : 'bg-surface-variant border-2 border-outline'
      }`} />
      
      {/* Handle/Thumb */}
      <span className={`relative inline-block transform rounded-full transition-all duration-medium2 ${
        checked 
          ? 'translate-x-5 h-6 w-6 bg-on-primary shadow-elevation-1' 
          : 'translate-x-1 h-4 w-4 bg-outline'
      }`}>
        {/* Handle state layer for hover/press */}
        <span className="absolute inset-0 -m-1 rounded-full hover:bg-on-surface hover:bg-opacity-hover active:bg-opacity-pressed transition-colors duration-short4" />
      </span>
    </button>
  );

  if (label) {
    return (
      <label className={`inline-flex items-center gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        {switchElement}
        <span className={`text-body-large text-on-surface ${disabled ? 'opacity-38' : ''}`}>
          {label}
        </span>
      </label>
    );
  }

  return switchElement;
};

export default Switch;
