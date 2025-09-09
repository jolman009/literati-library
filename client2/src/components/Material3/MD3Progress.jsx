import React from 'react';

const SIZES = { small: 24, medium: 32, large: 48 };

export default React.forwardRef(function MD3Progress(
  { variant = 'linear', value, size = 'medium', indeterminate, className = '', style = {}, 'aria-label': ariaLabel, ...props },
  ref
) {
  if (variant === 'circular') {
    const dim = SIZES[size] || SIZES.medium;
    const stroke = 3;
    const r = (dim - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = value != null ? (c * (100 - Math.max(0, Math.min(100, value)))) / 100 : c * 0.3;

    return (
      <svg
        ref={ref}
        className={`md3-progress-circular ${className}`}
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value != null ? Math.round(value) : undefined}
        aria-label={ariaLabel}
        style={style}
        {...props}
      >
        <circle cx={dim/2} cy={dim/2} r={r} stroke="#e7e0ec" strokeWidth={stroke} fill="none" />
        <circle
          cx={dim/2} cy={dim/2} r={r}
          stroke="#6750a4" strokeWidth={stroke} fill="none"
          strokeDasharray={c}
          strokeDashoffset={value != null ? dash : 0}
          style={{
            transformOrigin: '50% 50%',
            transform: 'rotate(-90deg)',
            transition: value != null ? 'stroke-dashoffset .3s ease' : undefined,
            animation: value == null || indeterminate ? 'md3-spin 1s linear infinite' : undefined
          }}
        />
        <style>{`
          @keyframes md3-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </svg>
    );
  }

  // linear
  const width = '100%';
  const bar = value != null ? `${Math.max(0, Math.min(100, value))}%` : '100%';

  return (
    <div
      ref={ref}
      className={`md3-progress-linear ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value != null ? Math.round(value) : undefined}
      aria-label={ariaLabel}
      style={{ width, height: 4, background: '#e7e0ec', borderRadius: 2, overflow: 'hidden', ...style }}
      {...props}
    >
      <div
        style={{
          height: '100%',
          background: '#6750a4',
          width: bar,
          animation: value == null || indeterminate ? 'md3-indet 2s linear infinite' : undefined,
          transition: value != null ? 'width .3s ease' : undefined
        }}
      />
      <style>{`
        @keyframes md3-indet {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
});