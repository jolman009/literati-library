// Loading States - Only LoadingSpinner and NetworkStatus are used
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
    secondary: "border-secondary",
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
