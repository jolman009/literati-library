import React from 'react';

const VARIANTS = {
  assist:  { bg:'rgb(var(--md-sys-color-surface-container-low))', fg:'rgb(var(--md-sys-color-on-surface))', selBg:'rgb(var(--md-sys-color-primary))', selFg:'rgb(var(--md-sys-color-on-primary))' },
  filter:  { bg:'rgb(var(--md-sys-color-surface-container-low))', fg:'rgb(var(--md-sys-color-on-surface))', selBg:'rgb(var(--md-sys-color-primary))', selFg:'rgb(var(--md-sys-color-on-primary))' },
  input:   { bg:'rgb(var(--md-sys-color-surface-container-low))', fg:'rgb(var(--md-sys-color-on-surface))', selBg:'rgb(var(--md-sys-color-primary))', selFg:'rgb(var(--md-sys-color-on-primary))' },
  suggest: { bg:'rgb(var(--md-sys-color-surface-container-low))', fg:'rgb(var(--md-sys-color-on-surface))', selBg:'rgb(var(--md-sys-color-primary))', selFg:'rgb(var(--md-sys-color-on-primary))' },
};

export default React.forwardRef(function MD3Chip(
  {
    type = 'assist',           // assist | filter | input | suggest
    label,
    selected = false,
    icon,
    onDelete,
    onClick,
    disabled = false,
    size = 'medium',
    className = '',
    style = {},
    ...props
  },
  ref
) {
  const v = VARIANTS[type] || VARIANTS.assist;
  const pad = size === 'small' ? '4px 8px' : size === 'large' ? '8px 14px' : '6px 12px';
  const radius = 16;

  return (
    <button
      ref={ref}
      type="button"
      className={`md3-chip ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={type === 'filter' ? selected : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: pad, borderRadius: radius,
        border: selected ? 'none' : '1px solid rgb(var(--md-sys-color-outline-variant))',
        background: selected ? v.selBg : v.bg,
        color: selected ? v.selFg : v.fg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontSize: 14, fontWeight: 500, lineHeight: 1,
        transition: 'filter .15s ease, transform .02s ease, border .15s ease',
        ...style
      }}
      onPointerDown={disabled ? undefined : (e)=>{ e.currentTarget.style.transform='scale(.98)'; }}
      onPointerUp={disabled ? undefined : (e)=>{ e.currentTarget.style.transform='scale(1)'; }}
      onMouseEnter={disabled ? undefined : (e)=>{ e.currentTarget.style.filter='brightness(1.03)'; }}
      onMouseLeave={disabled ? undefined : (e)=>{ e.currentTarget.style.filter='none'; }}
      {...props}
    >
      {icon && <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>}
      <span>{label}</span>
      {onDelete && (
        <span
          role="button"
          aria-label="Remove"
          tabIndex={0}
          onClick={(e)=>{ e.stopPropagation(); onDelete?.(e); }}
          onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); onDelete?.(e); }}}
          style={{ marginLeft: 2, width: 18, height: 18, display:'grid', placeItems:'center',
                   borderRadius: 9, background:'rgba(0,0,0,.06)' }}
        >
          ✕
        </span>
      )}
    </button>
  );
});
