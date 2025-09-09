import React from 'react';
import './MD3StatusBadge.css';

const MD3StatusBadge = ({ 
  status = 'default', 
  children, 
  variant = 'filled',
  size = 'medium',
  className = '',
  ...props 
}) => {
  const baseClass = 'md3-status-badge';
  const classes = [
    baseClass,
    `${baseClass}--${status}`,
    `${baseClass}--${variant}`,
    `${baseClass}--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

// Export both default and named
export default MD3StatusBadge;
export { MD3StatusBadge };