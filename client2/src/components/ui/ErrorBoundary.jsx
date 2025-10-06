// Enhanced Error Boundary with Recovery Options
import React from 'react';
import { AlertTriangle, RefreshCcw, Home, Bug } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isReporting: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Enhanced logging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 ====== ERROR BOUNDARY CAUGHT ERROR ======');
      console.error('Component:', this.props.fallbackComponent || 'unknown');
      console.error('Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('🚨 ==========================================');
    }

    // In production, you could send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = async (error, errorInfo) => {
    try {
      // Example error reporting - replace with your service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      console.log('Would report error:', errorReport);
      // await fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    // In development, log the error before redirecting
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 ErrorBoundary: Navigating home due to error:', this.state.error);
    }
    window.location.href = '/';
  };

  handleReportBug = async () => {
    this.setState({ isReporting: true });
    
    try {
      await this.reportError(this.state.error, this.state.errorInfo);
      alert('Thank you! The error has been reported to our team.');
    } catch (err) {
      alert('Unable to report the error. Please try again later.');
    } finally {
      this.setState({ isReporting: false });
    }
  };

  getErrorMessage = () => {
    const { error } = this.state;
    const { fallbackComponent } = this.props;

    if (fallbackComponent === 'library') {
      return "We're having trouble loading your library right now.";
    }
    if (fallbackComponent === 'reader') {
      return "There was an issue loading the book reader.";
    }
    if (fallbackComponent === 'upload') {
      return "The upload feature is temporarily unavailable.";
    }
    if (fallbackComponent === 'notes') {
      return "We can't load your notes at the moment.";
    }

    // Generic error messages based on error type
    if (error?.message?.includes('ChunkLoadError')) {
      return "It looks like the app was updated. Please refresh the page.";
    }
    if (error?.message?.includes('Network')) {
      return "Check your internet connection and try again.";
    }
    if (error?.message?.includes('Permission')) {
      return "You don't have permission to access this feature.";
    }

    return "Something unexpected happened.";
  };

  getSuggestion = () => {
    const { error } = this.state;
    const { fallbackComponent } = this.props;

    if (error?.message?.includes('ChunkLoadError')) {
      return "A new version of the app is available.";
    }
    if (fallbackComponent === 'reader') {
      return "The book file might be corrupted or unavailable.";
    }
    if (fallbackComponent === 'upload') {
      return "Please check your file format and size.";
    }

    return "This might be a temporary issue.";
  };

  render() {
    if (this.state.hasError) {
      const { variant = 'full', showDetails = false } = this.props;
      const errorMessage = this.getErrorMessage();
      const suggestion = this.getSuggestion();
      const { retryCount, isReporting } = this.state;

      if (variant === 'compact') {
        return (
          <div className="error-boundary-compact">
            <div className="error-icon-small">
              <AlertTriangle size={16} />
            </div>
            <span className="error-message-small">{errorMessage}</span>
            <button 
              onClick={this.handleRetry}
              className="retry-button-small"
              disabled={retryCount >= 3}
            >
              <RefreshCcw size={14} />
            </button>
          </div>
        );
      }

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            {/* Error Icon */}
            <div className="error-icon">
              <AlertTriangle size={48} />
            </div>

            {/* Error Message */}
            <h2 className="error-title">Oops! Something went wrong</h2>
            <p className="error-message">{errorMessage}</p>
            <p className="error-suggestion">{suggestion}</p>

            {/* Action Buttons */}
            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="error-button primary"
                disabled={retryCount >= 3}
              >
                <RefreshCcw size={16} />
                {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="error-button secondary"
              >
                <Home size={16} />
                Go to Dashboard
              </button>
              
              <button 
                onClick={this.handleReportBug}
                className="error-button tertiary"
                disabled={isReporting}
              >
                <Bug size={16} />
                {isReporting ? 'Reporting...' : 'Report Issue'}
              </button>
            </div>

            {/* Retry Counter */}
            {retryCount > 0 && (
              <p className="retry-counter">
                Retry attempts: {retryCount}/3
              </p>
            )}

            {/* Error Details (Development) */}
            {showDetails && process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <div className="error-stack">
                  <strong>Error:</strong> {this.state.error?.message}
                  <br />
                  <strong>Stack:</strong>
                  <pre>{this.state.error?.stack}</pre>
                  <strong>Component Stack:</strong>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundaries
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Specific error boundaries for different sections
export const LibraryErrorBoundary = ({ children }) => (
  <ErrorBoundary fallbackComponent="library" variant="full">
    {children}
  </ErrorBoundary>
);

export const ReaderErrorBoundary = ({ children }) => (
  <ErrorBoundary fallbackComponent="reader" variant="full" showDetails>
    {children}
  </ErrorBoundary>
);

export const UploadErrorBoundary = ({ children }) => (
  <ErrorBoundary fallbackComponent="upload" variant="full">
    {children}
  </ErrorBoundary>
);

export const NotesErrorBoundary = ({ children }) => (
  <ErrorBoundary fallbackComponent="notes" variant="full">
    {children}
  </ErrorBoundary>
);

export const CompactErrorBoundary = ({ children }) => (
  <ErrorBoundary variant="compact">
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;