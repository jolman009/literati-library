import React from 'react';

// MD3Select Component
export const MD3Select = React.forwardRef(({
  label,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
  fullWidth = false,
  className = '',
  style = {},
  ...props
}, ref) => {
  const selectStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const selectInputStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #79747e',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#1c1b1f',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1
  };

  return (
    <div style={selectStyle} className={`md3-select ${className}`}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: '500', color: '#49454f' }}>
          {label} {required && <span style={{ color: '#ba1a1a' }}>*</span>}
        </label>
      )}
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={selectInputStyle}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});


MD3Select.displayName = 'MD3Select';
