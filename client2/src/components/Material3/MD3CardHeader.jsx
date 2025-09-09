import React from 'react';

const MD3CardHeader = ({
  title,
  subtitle,
  media,     // icon/avatar/thumbnail
  actions,   // right-side actions
  dense=false,
  className='',
  style={},
  ...props
}) => {
  const root = {
    display:'grid',
    gridTemplateColumns: media ? 'auto 1fr auto' : '1fr auto',
    alignItems: media ? 'center' : 'start',
    gap: dense ? 8 : 12,
    padding: dense ? '14px 16px 0' : '20px 20px 0',
    ...style
  };
  const titleWrap = { minWidth:0, display:'grid', gap:4 };
  const titleStyle = { margin:0, fontSize:22, fontWeight:700, lineHeight:1.2, letterSpacing:.2 };
  const subtitleStyle = { margin:0, color:'#49454f', fontSize:14.5, lineHeight:1.3 };

  return (
    <div className={`md3-card-header ${className}`} style={root} {...props}>
      {media && <div className="md3-card-header__media" style={{ display:'grid', placeItems:'center' }}>{media}</div>}
      <div className="md3-card-header__titles" style={titleWrap}>
        {title && <h3 style={titleStyle}>{title}</h3>}
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actions && <div className="md3-card-header__actions" style={{ display:'flex', gap:8, alignItems:'center' }}>{actions}</div>}
    </div>
  );
};

export default MD3CardHeader;
