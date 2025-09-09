import React from 'react';
{/* import PropTypes from 'prop-types'; */}

const Button = ({
  children,
  variant = 'filled', // filled | outlined | text
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  // Use the new Material 3 expressive classes
  const baseClasses = 'md3-button focus-ring';

  const variants = {
    filled: 'md3-button--filled',
    outlined: 'md3-button--outlined',
    text: 'md3-button--text'
  };

  // Handle form submission for filled buttons
  // If variant is 'filled' and no explicit type was passed, default to 'submit'
  const buttonType = variant === 'filled' && type === 'button' ? 'submit' : type;

  return (
    <button
      type={buttonType}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// PropTypes for runtime type checking (optional but recommended)
{/* Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['filled', 'outlined', 'text']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
}; */}

export default Button;