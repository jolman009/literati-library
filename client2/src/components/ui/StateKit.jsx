// src/components/ui/StateKit.jsx
//
// The "in-between" screens the happy-path UI skips: shimmer skeletons that
// mirror real components 1:1, first-run / no-result empty states, and
// offline/error recovery. Recreated from the design package's StateKit using
// the app's MD3 tokens, MD3Button, and lucide-react (no window.SQ kit).
//
// Usage:
//   import { SkeletonGrid, EmptyState, ErrorState } from '../ui/StateKit';
//   {loading ? <SkeletonGrid of="book" count={6} />
//            : books.length ? <Grid/> : <EmptyState tone="brand" .../>}
import React from 'react';
import { Inbox, CloudOff, RefreshCw } from 'lucide-react';
import { MD3Button } from '../Material3';
import './StateKit.css';

/* ============================================================
   Skeletons
   ============================================================ */

/* A single shimmering placeholder block. */
export const Skeleton = ({ w = '100%', h = 14, r = 8, className = '', style = {} }) => (
  <div
    aria-hidden="true"
    className={`sq-skeleton ${className}`}
    style={{ width: w, height: h, borderRadius: r, ...style }}
  />
);

/* Composed skeletons that mirror their real components 1:1, so layout never
   jumps when data resolves. */
export const BookCardSkeleton = () => (
  <div
    style={{
      background: 'var(--md-sys-color-surface-container-low)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: 'var(--md-sys-elevation-level1)',
    }}
  >
    <Skeleton w="100%" h={0} r={0} style={{ aspectRatio: '3 / 4', height: 'auto' }} />
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton w="90%" h={13} />
      <Skeleton w="55%" h={11} />
      <Skeleton w="100%" h={6} r={9999} style={{ marginTop: 4 }} />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div
    style={{
      background: 'var(--md-sys-color-surface-container-low)',
      border: '1px solid var(--md-sys-color-outline-variant)',
      borderRadius: 16,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <Skeleton w={38} h={38} r={12} />
    <Skeleton w="60%" h={24} style={{ marginTop: 4 }} />
    <Skeleton w="40%" h={12} />
  </div>
);

export const NoteSkeleton = () => (
  <div
    style={{
      padding: 18,
      borderRadius: 18,
      background: 'var(--md-sys-color-surface-container-low)',
      border: '1px solid var(--md-sys-color-outline-variant)',
      display: 'flex',
      flexDirection: 'column',
      gap: 11,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Skeleton w={16} h={16} r={5} />
      <Skeleton w="45%" h={13} />
      <Skeleton w={34} h={11} style={{ marginLeft: 'auto' }} />
    </div>
    <Skeleton w="100%" h={12} />
    <Skeleton w="80%" h={12} />
    <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
      <Skeleton w={60} h={20} r={9999} />
      <Skeleton w={48} h={20} r={9999} />
    </div>
  </div>
);

/* A whole responsive grid/list of skeletons in one call. */
export const SkeletonGrid = ({ of = 'book', count = 6 }) => {
  const MAP = { book: BookCardSkeleton, stat: StatCardSkeleton, note: NoteSkeleton };
  const One = MAP[of] || BookCardSkeleton;
  const columns =
    of === 'book'
      ? 'repeat(auto-fill, minmax(180px, 1fr))'
      : of === 'stat'
      ? 'repeat(auto-fit, minmax(150px, 1fr))'
      : '1fr';
  return (
    <div
      role="status"
      aria-label="Loading…"
      style={{ display: 'grid', gridTemplateColumns: columns, gap: of === 'note' ? 14 : 18 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <One key={i} />
      ))}
    </div>
  );
};

/* ============================================================
   EmptyState
   ============================================================ */

const TONES = {
  brand:   { ring: 'var(--sq-gradient-brand)', ic: '#fff', glow: 'rgba(0,119,182,.16)' },
  quest:   { ring: 'var(--sq-gradient-quest)', ic: '#fff', glow: 'rgba(124,92,255,.16)' },
  neutral: { ring: 'var(--md-sys-color-surface-container-high)', ic: 'var(--md-sys-color-on-surface-variant)', glow: 'transparent' },
  error:   { ring: 'var(--md-sys-color-error-container)', ic: 'var(--md-sys-color-on-error-container)', glow: 'rgba(220,80,80,.14)' },
};

// Normalize an action prop that may be a string, or { label, icon, onClick }.
const normalizeAction = (action, fallbackOnClick) => {
  if (!action) return null;
  if (typeof action === 'string') return { label: action, onClick: fallbackOnClick };
  return { label: action.label, icon: action.icon, onClick: action.onClick || fallbackOnClick };
};

/*
 * EmptyState — icon medallion, headline, supporting copy, optional actions.
 *
 * Props:
 *   icon       React node (lucide icon). Defaults to <Inbox/>.
 *   title      string (required)
 *   body       string
 *   tone       'brand' | 'quest' | 'neutral' (default) | 'error'
 *   compact    boolean — tighter padding + smaller medallion for inline slots
 *   primary    string | { label, icon, onClick }   (+ onPrimary fallback)
 *   secondary  string | { label, onClick }         (+ onSecondary fallback)
 */
export const EmptyState = ({
  icon,
  title,
  body,
  tone = 'neutral',
  compact = false,
  primary,
  onPrimary,
  secondary,
  onSecondary,
  className = '',
  style = {},
}) => {
  const t = TONES[tone] || TONES.neutral;
  const med = compact ? 60 : 84;
  const iconNode = icon || <Inbox />;
  const sizedIcon = React.isValidElement(iconNode)
    ? React.cloneElement(iconNode, {
        size: iconNode.props.size ?? (compact ? 28 : 38),
        strokeWidth: iconNode.props.strokeWidth ?? 1.8,
      })
    : iconNode;

  const p = normalizeAction(primary, onPrimary);
  const s = normalizeAction(secondary, onSecondary);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: compact ? '36px 24px' : '64px 32px',
        fontFamily: 'var(--sq-font-sans)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: med,
          height: med,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: t.ring,
          color: t.ic,
          boxShadow: t.glow !== 'transparent' ? `0 0 0 10px ${t.glow}` : 'none',
        }}
      >
        {sizedIcon}
      </div>

      <div
        style={{
          fontSize: compact ? 17 : 21,
          fontWeight: 800,
          color: 'var(--md-sys-color-on-surface)',
          marginTop: compact ? 18 : 24,
          letterSpacing: '-.01em',
        }}
      >
        {title}
      </div>

      {body && (
        <div
          style={{
            fontSize: compact ? 13.5 : 15,
            lineHeight: 1.55,
            color: 'var(--md-sys-color-on-surface-variant)',
            marginTop: 8,
            maxWidth: compact ? 320 : 420,
            textWrap: 'pretty',
          }}
        >
          {body}
        </div>
      )}

      {(p || s) && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: compact ? 18 : 26,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {p && (
            <MD3Button variant="filled" icon={p.icon} onClick={p.onClick}>
              {p.label}
            </MD3Button>
          )}
          {s && (
            <MD3Button variant="text" onClick={s.onClick}>
              {s.label}
            </MD3Button>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   ErrorState — an EmptyState preset for failures. Always offers retry.
   ============================================================ */
export const ErrorState = ({
  title = 'Something went wrong',
  body = "We couldn't load this just now. Check your connection and try again.",
  icon = <CloudOff />,
  onRetry,
  compact = false,
}) => (
  <EmptyState
    tone="error"
    icon={icon}
    title={title}
    body={body}
    compact={compact}
    primary={{ label: 'Try again', icon: <RefreshCw size={18} /> }}
    onPrimary={onRetry}
  />
);

export default {
  Skeleton,
  BookCardSkeleton,
  StatCardSkeleton,
  NoteSkeleton,
  SkeletonGrid,
  EmptyState,
  ErrorState,
};
