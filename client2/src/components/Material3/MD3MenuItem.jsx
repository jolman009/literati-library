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
      className={`md3-menu-item ${disabled ? 'md3-menu-item--disabled' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
