import React from 'react';

// ============================================
// Save Button with Loading/Success States
// ============================================

interface SaveButtonProps {
  onClick: () => void;
  isLoading: boolean;
  result: 'success' | 'error' | null;
}

export function SaveButton({ onClick, isLoading, result }: SaveButtonProps) {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <span className="flex items-center justify-center gap-2">
          <span className="spinner" />
          Saving...
        </span>
      );
    }

    if (result === 'success') {
      return (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved!
        </span>
      );
    }

    if (result === 'error') {
      return (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Try Again
        </span>
      );
    }

    return (
      <span className="flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Save to Library
      </span>
    );
  };

  const getButtonClasses = () => {
    const base = 'btn-primary';

    if (result === 'success') {
      return `${base} !bg-green-600 hover:!bg-green-600`;
    }

    if (result === 'error') {
      return `${base} !bg-red-600 hover:!bg-red-500`;
    }

    return base;
  };

  return (
    <button
      type="button"
      className={getButtonClasses()}
      onClick={onClick}
      disabled={isLoading || result === 'success'}
    >
      {getButtonContent()}
    </button>
  );
}
