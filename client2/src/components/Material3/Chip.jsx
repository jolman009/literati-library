import React from 'react';

// Material 3 Chip with selection states
export const Chip = ({ 
  label, 
  selected = false, 
  onClick, 
  icon, 
  onDelete,
  type = 'assist' 
}) => {
  const baseClasses = 'inline-flex items-center h-8 px-4 rounded-small text-label-large transition-all duration-medium2 cursor-pointer';
  
  const types = {
    assist: selected 
      ? 'bg-secondary-container text-on-secondary-container border border-outline' 
      : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container',
    filter: selected
      ? 'bg-secondary-container text-on-secondary-container'
      : 'bg-surface-container-low text-on-surface-variant border border-outline-variant hover:bg-surface-container',
    input: 'bg-surface-container-low text-on-surface border border-outline-variant',
    suggestion: 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
  };
  
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${types[type]}`}
    >
      {icon && <span className="mr-2 text-lg">{icon}</span>}
      <span>{label}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-2 -mr-1 w-5 h-5 rounded-full hover:bg-on-surface hover:bg-opacity-hover flex items-center justify-center"
        >
          ×
        </button>
      )}
    </button>
  );
};

export default Chip;
