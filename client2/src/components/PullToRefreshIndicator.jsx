import '../styles/pull-to-refresh.css';

/**
 * Pull-to-Refresh Visual Indicator
 * Shows the refreshing state and progress
 */
const PullToRefreshIndicator = ({
  isPulling,
  pullDistance,
  isRefreshing,
  refreshComplete,
  progress,
  spinnerRotation,
}) => {
  if (!isPulling && !isRefreshing && !refreshComplete) {
    return null;
  }

  const opacity = Math.min(progress / 50, 1); // Fade in as user pulls

  return (
    <div
      className="pull-to-refresh-indicator"
      style={{
        transform: `translateY(${pullDistance}px)`,
        opacity,
      }}
    >
      <div className="ptr-content">
        {refreshComplete ? (
          // Success state
          <>
            <div className="ptr-icon ptr-icon-success">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <span className="ptr-text">Refreshed!</span>
          </>
        ) : isRefreshing ? (
          // Refreshing state
          <>
            <div className="ptr-spinner">
              <div className="spinner-ring" />
            </div>
            <span className="ptr-text">Refreshing...</span>
          </>
        ) : (
          // Pulling state
          <>
            <div
              className="ptr-icon"
              style={{
                transform: `rotate(${spinnerRotation}deg)`,
              }}
            >
              <span className="material-symbols-outlined">refresh</span>
            </div>
            <span className="ptr-text">
              {progress >= 100 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </>
        )}
      </div>

      {/* Progress circle */}
      <svg
        className="ptr-progress-circle"
        width="48"
        height="48"
        viewBox="0 0 48 48"
      >
        <circle
          className="ptr-progress-bg"
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="var(--md-sys-color-outline-variant)"
          strokeWidth="2"
        />
        <circle
          className="ptr-progress-fill"
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="var(--md-sys-color-primary)"
          strokeWidth="2"
          strokeDasharray={`${(progress / 100) * 125.6} 125.6`}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </svg>
    </div>
  );
};

export default PullToRefreshIndicator;
