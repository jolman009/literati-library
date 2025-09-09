// src/components/Material3/MD3Badge.jsx
import React, { memo } from 'react';
import './MD3Badge.css';

const MD3Badge = memo(({
  children,
  content,
  variant = 'standard',
  color = 'error',
  position = 'top-right',
  max = 99,
  showZero = false,
  dot = false,
  invisible = false,
  className = '',
  ...props
}) => {
  // Determine if badge should be visible
  const isVisible = !invisible && (
    dot ||
    (typeof content === 'number' && (content > 0 || showZero)) ||
    (typeof content === 'string' && content.length > 0) ||
    content === true
  );

  // Format badge content
  const formatContent = () => {
    if (dot) return '';
    if (typeof content === 'number') {
      return content > max ? `${max}+` : content.toString();
    }
    return content;
  };

  const badgeClasses = [
    'md3-badge',
    `md3-badge--${variant}`,
    `md3-badge--${color}`,
    `md3-badge--${position}`,
    dot && 'md3-badge--dot',
    !isVisible && 'md3-badge--invisible',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="md3-badge-container" {...props}>
      {children}
      {isVisible && (
        <span className={badgeClasses}>
          <span className="md3-badge__content">
            {formatContent()}
          </span>
        </span>
      )}
    </div>
  );
});

MD3Badge.displayName = 'MD3Badge';

// Notification Badge for app notifications
export const MD3NotificationBadge = memo(({
  count = 0,
  children,
  ...props
}) => (
  <MD3Badge
    content={count}
    variant="standard"
    color="error"
    max={999}
    {...props}
  >
    {children}
  </MD3Badge>
));

MD3NotificationBadge.displayName = 'MD3NotificationBadge';

// Status Badge for book reading status
export const MD3StatusBadge = memo(({
  status = 'unread',
  children,
  ...props
}) => {
  const statusConfig = {
    unread: { content: '', color: 'surface', dot: true },
    reading: { content: 'Reading', color: 'primary' },
    completed: { content: 'Complete', color: 'tertiary' },
    paused: { content: 'Paused', color: 'secondary' },
    wishlist: { content: 'Wishlist', color: 'outline' }
  };

  const config = statusConfig[status] || statusConfig.unread;

  return (
    <MD3Badge
      {...config}
      variant="standard"
      position="bottom-right"
      {...props}
    >
      {children}
    </MD3Badge>
  );
});

MD3StatusBadge.displayName = 'MD3StatusBadge';

// Progress Badge showing reading progress
export const MD3ProgressBadge = memo(({
  progress = 0,
  children,
  showPercent = true,
  ...props
}) => {
  const getProgressColor = (progress) => {
    if (progress === 0) return 'surface';
    if (progress < 25) return 'error';
    if (progress < 50) return 'secondary';
    if (progress < 75) return 'primary';
    return 'tertiary';
  };

  const content = progress === 100 ? '✓' : 
                 showPercent ? `${Math.round(progress)}%` : 
                 Math.round(progress);

  return (
    <MD3Badge
      content={content}
      variant="standard"
      color={getProgressColor(progress)}
      position="bottom-left"
      {...props}
    >
      {children}
    </MD3Badge>
  );
});

MD3ProgressBadge.displayName = 'MD3ProgressBadge';

// New Items Badge
export const MD3NewItemsBadge = memo(({
  isNew = false,
  children,
  ...props
}) => (
  <MD3Badge
    content="New"
    variant="small"
    color="tertiary"
    position="top-right"
    invisible={!isNew}
    {...props}
  >
    {children}
  </MD3Badge>
));

MD3NewItemsBadge.displayName = 'MD3NewItemsBadge';

export default MD3Badge;