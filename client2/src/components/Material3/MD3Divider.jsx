import React from 'react';

// Divider Component (primitive)
export const MD3Divider = React.forwardRef(({ inset = false, className = '', style = {}, ...props }, ref) => {
  return (
    <hr
      ref={ref}
      className={`md3-divider ${className}`}
      style={{
        border: 0,
        height: 1,
        backgroundColor: '#e7e0ec',
        margin: inset ? '8px 16px' : '8px 0',
        ...style
      }}
      {...props}
    />
  );
});
MD3Divider.displayName = 'MD3Divider';