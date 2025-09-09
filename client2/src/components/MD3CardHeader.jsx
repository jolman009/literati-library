import React from 'react';

/**
 * MD3CardHeader
 * - Expressive-friendly header slot for cards.
 * - Supports: title, subtitle, actions (right), media (left/top), dense.
 */
const MD3CardHeader = ({
  title,
  subtitle,
  actions,
  media,
  dense = false,
  className = '',
  style = {},
  ...props
}) => {
  const root = {
    display: 'grid',
    gridTemplateColumns: media ? 'auto 1fr auto' : '1fr auto',
    alignItems: media ? 'center' : 'start',
    gap: dense ? 8 : 12,
    padding: dense ? '12px 16px 0' : '20px 20px 0',
    ...style,
  };

  const titleWrap = {
    minWidth: 0,
    display: 'grid',
    gap: 4,
  };

  const titleStyle = {
    margin: 0,
    fontSize: 'var(--mxe-title-large, 22px)',
    fontWeight: 600,
    lineHeight: 1.2,
  };

  const subtitleStyle = {
    margin: 0,
    color: 'var(--md3-on-surface-variant, #49454f)',
    fontSize: 'var(--mxe-body, 14.5px)',
  };

  const mediaWrap = media ? { display: 'grid', placeItems: 'center' } : null;

  return (
    <div className={`md3-card-header ${className}`} style={root} {...props}>
      {media && <div className="md3-card-header__media" style={mediaWrap}>{media}</div>}
      <div className="md3-card-header__titles" style={titleWrap}>
        {title && <h3 className="md3-card-header__title" style={titleStyle}>{title}</h3>}
        {subtitle && <p className="md3-card-header__subtitle" style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actions && <div className="md3-card-header__actions" style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
};

export default MD3CardHeader;
