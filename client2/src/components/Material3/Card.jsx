import React from 'react';

const Card = ({ 
  children, 
  type = 'elevated', // elevated | filled | outlined
  className = '', 
  onClick,
  ...props 
}) => {
  const baseClasses = 'md3-card';
  
  const variants = {
    elevated: 'md3-card--elevated',
    filled: 'md3-card--filled',
    outlined: 'md3-card--outlined'
  };

  const interactive = onClick ? 'cursor-pointer' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${variants[type]} ${interactive} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;