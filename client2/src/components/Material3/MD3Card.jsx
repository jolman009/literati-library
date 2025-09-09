import React from 'react';

const ELEVATION = {
  0:'none',
  1:'0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.20)',
  2:'0 2px 8px rgba(0,0,0,.16)',
  3:'0 6px 16px rgba(0,0,0,.16)',
};

const MD3Card = React.forwardRef(({
  variant='elevated',     // elevated | filled | outlined
  elevation=1,            // 0..3
  interactive=false,      // hover/press affordances
  onClick,
  className='',
  style={},
  children,
  ...props
}, ref) => {
  const isInteractive = interactive || typeof onClick === 'function';
  const base = {
    display:'grid',
    backgroundColor: variant==='filled' ? '#fef7ff' : '#ffffff',
    border: variant==='outlined' ? '1px solid #e0e0e0' : 'none',
    borderRadius: 16,
    boxShadow: variant==='elevated' ? (ELEVATION[elevation] || ELEVATION[1]) : 'none',
    transition:'transform .04s ease, box-shadow .2s ease, filter .2s ease',
    cursor: isInteractive ? 'pointer' : 'default',
    overflow:'hidden',
    ...style
  };

  const handleKeyDown = (e) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      ref={ref}
      className={`md3-card ${className}`}
      style={base}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      onPointerDown={isInteractive ? (e)=>{ e.currentTarget.style.transform='scale(.997)'; } : undefined}
      onPointerUp={isInteractive ? (e)=>{ e.currentTarget.style.transform='scale(1)'; } : undefined}
      onMouseEnter={isInteractive ? (e)=>{ e.currentTarget.style.filter='brightness(1.01)'; } : undefined}
      onMouseLeave={isInteractive ? (e)=>{ e.currentTarget.style.filter='none'; e.currentTarget.style.transform='scale(1)'; } : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

MD3Card.displayName = 'MD3Card';
export default MD3Card;
