import React from 'react';
export default function MD3MenuDivider({ className = '', style = {}, ...props }) {
  return (
    <div
      role="separator"
      className={`md3-menu-divider ${className}`}
      style={{ height: 1, background: '#e7e0ec', margin: '6px 2px', ...style }}
      {...props}
    />
  );
}
