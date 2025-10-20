import React, { useRef } from 'react';

/**
 * MD3 Button — premium, full-featured
 * Variants: filled | elevated | tonal | outlined | text
 * Sizes:    small | medium | large
 * Density:  default | comfortable | compact
 * Features: leading/trailing icons, loading, disabled, fullWidth, href (link), ripple, a11y focus ring
 */
const VARIANT_TOKENS = {
  filled:   { bg:'#6750a4',  fg:'#ffffff',  border:'none',     container:'#6750a4' },
  elevated: { bg:'#ffffff',  fg:'#6750a4',  border:'none',     shadow:'0 2px 6px rgba(0,0,0,.18)' },
  tonal:    { bg:'#eaddff',  fg:'#21005d',  border:'none' },
  outlined: { bg:'transparent', fg:'#6750a4', border:'1px solid #79747e' },
  text:     { bg:'transparent', fg:'#6750a4', border:'none' },
};

const SIZE_TOKENS = {
  small:  { pad:'8px 14px',  radius:20, font:13, icon:16, gap:8 },
  medium: { pad:'12px 20px', radius:24, font:14, icon:18, gap:10 },
  large:  { pad:'16px 24px', radius:28, font:16, icon:20, gap:12 },
};

const DENSITY_TOKENS = {
  default:      0,
  comfortable: -2,
  compact:     -4,
};

function useRipple() {
  const ref = useRef(null);
  const onPointerDown = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.cssText = `
      position:absolute; left:${x}px; top:${y}px; width:${size}px; height:${size}px;
      border-radius:50%; background:currentColor; opacity:.12; transform:scale(0);
      pointer-events:none; transition:transform .4s ease, opacity .6s ease;
    `;
    el.appendChild(ripple);
    requestAnimationFrame(() => { ripple.style.transform = 'scale(1)'; });
    setTimeout(() => { ripple.style.opacity = '0'; }, 200);
    setTimeout(() => { ripple.remove(); }, 800);
  };
  return { ref, onPointerDown };
}

const MD3Button = React.forwardRef(({
  variant='filled',
  size='medium',
  density='default',
  icon,
  leadingIcon,
  trailingIcon,
  disabled=false,
  loading=false,
  fullWidth=false,
  href,
  target,
  rel,
  children,
  className='',
  style={},
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const v = VARIANT_TOKENS[variant] || VARIANT_TOKENS.filled;
  const s = SIZE_TOKENS[size] || SIZE_TOKENS.medium;
  const densAdj = DENSITY_TOKENS[density] ?? 0;
  const { ref: rippleRef, onPointerDown } = useRipple();

  const Comp = href ? 'a' : 'button';

  const baseStyle = {
    position:'relative',
    display:'inline-flex',
    alignItems:'center',
    justifyContent:'center',
    gap:s.gap,
    padding: adjustPadding(s.pad, densAdj),
    borderRadius:s.radius,
    border:v.border || 'none',
    background:v.bg,
    color:v.fg,
    boxShadow:v.shadow || 'none',
    textDecoration:'none',
    width: fullWidth ? '100%' : undefined,
    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.38 : 1,
    pointerEvents: (disabled || loading) ? 'none' : 'auto',
    userSelect:'none',
    WebkitUserSelect:'none',
    WebkitAppearance:'none',
    MozAppearance:'none',
    fontWeight:600,
    fontSize:s.font,
    lineHeight:1,
    transition:'box-shadow .2s ease, filter .2s ease, transform .02s ease',
    outline:'none',
    ...style
  };

  const focusRing = {
    position:'absolute', inset:-2, borderRadius:s.radius+2,
    boxShadow:'0 0 0 2px rgba(103,80,164,.35)',
    pointerEvents:'none', opacity:0, transition:'opacity .15s ease'
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (props.onClick && !disabled && !loading) {
        props.onClick(e);
      } else if (href) {
        e.currentTarget.click();
      }
    }
  };

  return (
    <Comp
      ref={(node) => { rippleRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }}
      className={`md3-button md3-button--${variant} md3-button--${size} ${className}`}
      style={baseStyle}
      disabled={href ? undefined : (disabled || loading)}
      aria-disabled={href ? (disabled || loading) : undefined}
      aria-label={ariaLabel}
      href={href}
      target={target}
      rel={rel}
      onPointerDown={disabled || loading ? undefined : onPointerDown}
      onKeyDown={handleKeyDown}
      {...(loading || disabled ? {...props, onClick: undefined} : props)}
    >
      <span aria-hidden className="md3-focus-ring" style={focusRing} />
      {loading ? (
        <span aria-hidden className="loading-spinner" style={{
          width:s.icon, height:s.icon, border:'2px solid currentColor', borderTopColor:'transparent',
          borderRadius:'50%', animation:'spin 1s linear infinite'
        }}/>
      ) : (icon || leadingIcon) ? (
        <span className="md3-button__icon" style={{ fontSize:s.icon, lineHeight:1, display:'inline-grid', placeItems:'center' }}>{icon || leadingIcon}</span>
      ) : null}

      <span className="md3-button__label" style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
        {children}
      </span>

      {trailingIcon && !loading && (
        <span className="md3-button__trailing" style={{ fontSize:s.icon, lineHeight:1, display:'inline-grid', placeItems:'center' }}>
          {trailingIcon}
        </span>
      )}
    </Comp>
  );
});

MD3Button.displayName = 'MD3Button';
export default MD3Button;

// helpers
function adjustPadding(pad, adj) {
  // "12px 20px" => reduce vertical by adj, keep horizontal
  const [py, px] = pad.split(' ').map(v => parseInt(v));
  const clamp = (v, min) => Math.max(v, min);
  const py2 = clamp(py + adj, 6);
  return `${py2}px ${px}px`;
}
