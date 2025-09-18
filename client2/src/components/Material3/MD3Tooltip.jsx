import React, { useId, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './MD3ToolTip.css';

/** MD3 Tooltip — expressive, accessible */
const PORTAL_ROOT = typeof document !== 'undefined'
  ? (document.getElementById('md3-tooltips') || createPortalRoot())
  : null;

function createPortalRoot() {
  const el = document.createElement('div');
  el.id = 'md3-tooltips';
  el.style.position = 'fixed';
  el.style.inset = '0';
  el.style.pointerEvents = 'none';
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  return el;
}

export default function MD3Tooltip({
  label,
  disabled = false,
  placement = 'top', // top | bottom | left | right | auto
  delayIn = 250,
  delayOut = 120,
  children,
  className = '',
  style = {},
  ...props
}) {
  const id = useId();
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const show = () => {
    if (disabled || !label) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      position();
      setOpen(true);
    }, delayIn);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(false), delayOut);
  };

  const position = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 10;
    let x = r.left + r.width / 2;
    let y = r.top - pad;
    const chosen = placement === 'auto'
      ? (r.top > 48 ? 'top' : 'bottom')
      : placement;
    if (chosen === 'bottom') y = r.bottom + pad;
    if (chosen === 'left')  { x = r.left - pad; y = r.top + r.height / 2; }
    if (chosen === 'right') { x = r.right + pad; y = r.top + r.height / 2; }
    setCoords({ x, y, side: chosen });
  };

  const tooltipNode = (
    <div
      role="tooltip"
      id={id}
      style={{
        position: 'fixed',
        transform: coords.side === 'top' || coords.side === 'bottom'
          ? 'translate(-50%, -100%)'
          : 'translate(-100%, -50%)',
        left: coords.x,
        top: coords.y,
        background: '#313033',
        color: '#fff',
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 12.5,
        letterSpacing: .2,
        boxShadow: '0 4px 16px rgba(0,0,0,.24)',
        pointerEvents: 'none',
        opacity: open ? 1 : 0,
        transition: 'opacity .12s ease',
        ...style
      }}
      className={`md3-tooltip ${className}`}
      {...props}
    >
      {label}
    </div>
  );

  return (
    <span
      ref={anchorRef}
      aria-describedby={open ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ display: 'inline-flex' }}
    >
      {children}
      {PORTAL_ROOT && open ? createPortal(tooltipNode, PORTAL_ROOT) : null}
    </span>
  );
}
