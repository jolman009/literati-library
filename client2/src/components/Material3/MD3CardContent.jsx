import React from 'react';

const MD3CardContent = ({ className = '', style = {}, children, ...props }) => {
  return (
    <div
      className={`md3-card-content ${className}`}
      style={{ padding: '0 20px 20px', ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

export default MD3CardContent;
