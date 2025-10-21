// Enhanced Loading States for Better UX
import React from 'react';
import './LoadingStates.css';

// Generic loading spinner with contextual messages
export const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "medium", 
  variant = "primary" 
}) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  const variantClasses = {
    primary: "border-primary",
    secondary: "border-gray-400",
    accent: "border-accent"
  };

  return (
    <div className="loading-spinner-container">
      <div 
        className={`loading-spinner ${sizeClasses[size]} ${variantClasses[variant]}`}
      />
      <p className="loading-message">{message}</p>
    </div>
  );
};

// Skeleton card for library/dashboard
export const BookCardSkeleton = () => (
  <div className="book-card-skeleton">
    <div className="skeleton-cover" />
    <div className="skeleton-content">
      <div className="skeleton-title" />
      <div className="skeleton-author" />
      <div className="skeleton-progress" />
    </div>
  </div>
);

// Multiple skeleton cards for grid layout
export const BookGridSkeleton = ({ count = 6 }) => (
  <div className="book-grid-skeleton">
    {Array.from({ length: count }, (_, i) => (
      <BookCardSkeleton key={i} />
    ))}
  </div>
);

// Skeleton for dashboard stats
export const StatsSkeleton = () => (
  <div className="stats-skeleton">
    {Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="stat-card-skeleton">
        <div className="skeleton-stat-icon" />
        <div className="skeleton-stat-number" />
        <div className="skeleton-stat-label" />
      </div>
    ))}
  </div>
);

// Skeleton for notes list
export const NotesListSkeleton = ({ count = 5 }) => (
  <div className="notes-list-skeleton">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="note-item-skeleton">
        <div className="skeleton-note-title" />
        <div className="skeleton-note-content" />
        <div className="skeleton-note-meta" />
      </div>
    ))}
  </div>
);

// Upload progress with contextual feedback
export const UploadProgress = ({ 
  progress, 
  fileName, 
  status = "uploading",
  error = null 
}) => {
  const statusMessages = {
    uploading: `Uploading ${fileName}...`,
    processing: `Processing ${fileName}...`,
    success: `✅ ${fileName} uploaded successfully!`,
    error: `❌ Failed to upload ${fileName}`
  };

  return (
    <div className="upload-progress-container">
      <div className="upload-progress-header">
        <span className="upload-filename">{fileName}</span>
        <span className="upload-percentage">{Math.round(progress)}%</span>
      </div>
      
      <div className="upload-progress-bar">
        <div 
          className={`upload-progress-fill ${status}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className={`upload-status ${status}`}>
        {error || statusMessages[status]}
      </p>
      
      {status === "error" && (
        <button className="retry-upload-btn">
          Try Again
        </button>
      )}
    </div>
  );
};

// Reading session loading
export const ReadingSessionLoader = ({ bookTitle }) => (
  <div className="reading-session-loader">
    <div className="reading-loader-animation">
      <div className="book-pages">
        <div className="loader-page loader-page-1" />
        <div className="loader-page loader-page-2" />
        <div className="loader-page loader-page-3" />
      </div>
    </div>
    <h3>Preparing your reading session</h3>
    <p>Loading {bookTitle}...</p>
  </div>
);

// Network status indicator
export const NetworkStatus = ({ isOnline, isReconnecting }) => {
  if (isOnline && !isReconnecting) return null;

  return (
    <div className={`network-status ${isOnline ? 'reconnecting' : 'offline'}`}>
      <div className="network-indicator">
        {isOnline ? (
          <>
            <div className="reconnecting-icon" />
            <span>Reconnecting...</span>
          </>
        ) : (
          <>
            <div className="offline-icon" />
            <span>You're offline</span>
          </>
        )}
      </div>
      {!isOnline && (
        <p className="offline-message">
          You can still read downloaded books and access cached content
        </p>
      )}
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  loading, 
  children, 
  loadingText = "Loading...", 
  variant = "primary",
  ...props 
}) => (
  <button 
    {...props}
    disabled={loading || props.disabled}
    className={`loading-button ${variant} ${loading ? 'loading' : ''} ${props.className || ''}`}
  >
    {loading && <div className="button-spinner" />}
    <span className={loading ? 'loading-text' : ''}>
      {loading ? loadingText : children}
    </span>
  </button>
);

// Page transition loader for route changes
export const PageTransition = ({ isTransitioning, currentRoute }) => {
  if (!isTransitioning) return null;

  const routeMessages = {
    '/dashboard': 'Loading your dashboard...',
    '/library': 'Loading your library...',
    '/notes': 'Loading your notes...',
    '/upload': 'Preparing upload...',
    default: 'Loading page...'
  };

  const message = routeMessages[currentRoute] || routeMessages.default;

  return (
    <div className="page-transition-overlay">
      <LoadingSpinner message={message} size="large" />
    </div>
  );
};
