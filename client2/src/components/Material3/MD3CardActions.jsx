import React from 'react';

const MD3CardActions = ({ align='end', className='', style={}, children, ...props }) => {
  const justify = align === 'start' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end';
  return (
    <div
      className={`md3-card-actions ${className}`}
      style={{ display:'flex', gap:12, justifyContent:justify, padding:'0 20px 20px', alignItems:'center', ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

export default MD3CardActions;
