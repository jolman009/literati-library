// src/components/Material3/MD3Surface.jsx
import React from 'react';
import './MD3Surface.css';

const MD3Surface = React.forwardRef(function MD3Surface({
  level = 'surface',
  elevation = 0,
  children,
  className = '',
  ...props
}, ref) {
  const classes = [
    'md3-surface',
    `md3-surface--${level}`,
    elevation > 0 && `md3-surface--elevation-${elevation}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

export default React.memo(MD3Surface);