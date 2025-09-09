import React, { useRef, useEffect } from 'react';

export default function MD3MenuItem({
  children,
  onClick,
  disabled = false,
  className = '',
  style = {},
  autoFocus = false,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);

  const handleKey = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(e); }
  };

  return (
    <div
      role="menuitem"
      ref={ref}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKey}
      onClick={disabled ? undefined : onClick}
      className={`md3-menu-item ${className}`}
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#8c8894' : '#1c1b1f',
        outline: 'none',
        transition: 'background-color .12s ease',
        ...style
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#f6f2fb'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = 'transparent'; }}
      {...props}
    >
      {children}
    </div>
  );
}
