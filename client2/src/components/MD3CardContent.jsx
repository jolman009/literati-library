import React from 'react';

const MD3CardContent = ({ inset=false, className='', style={}, children, ...props }) => {
  return (
    <div
      className={`md3-card-content ${className}`}
      style={{ padding: inset ? '12px 16px 16px' : '16px 20px 20px', ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

export default MD3CardContent;
