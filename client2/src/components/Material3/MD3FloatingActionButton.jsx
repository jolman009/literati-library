// src/components/Material3/MD3BookLibraryFab.jsx - FIXED VERSION
import React, { useState, memo } from 'react';
import './MD3FloatingActionButton.css';

const MD3BookLibraryFab = memo(({
  onAddBook,
  onImportBooks,
  onScan,
  onUpload,
  disabled = false,
  className = '',
  ...props
}) => {
  // ✅ FIXED: Added missing state
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ FIXED: Properly remove custom props from DOM props
  const {
    onAddBook: _onAddBook,
    onImportBooks: _onImportBooks,
    onScan: _onScan,
    onUpload: _onUpload,
    disabled: _disabled,
    ...domProps
  } = props;

  const classes = [
    'md3-fab-group',
    isExpanded && 'md3-fab-group--expanded',
    disabled && 'md3-fab-group--disabled',
    className
  ].filter(Boolean).join(' ');

  const handleMainClick = () => {
    if (disabled) return;
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (action, handler) => {
    if (disabled || !handler) return;
    setIsExpanded(false);
    handler();
  };

  return (
    <div className={classes} {...domProps}>
      {/* Secondary Actions */}
      {isExpanded && (
        <div className="md3-fab-group__actions">
          {onScan && (
            <button
              className="md3-fab md3-fab--small"
              onClick={() => handleActionClick('scan', onScan)}
              disabled={disabled}
              title="Scan book"
            >
              📷
            </button>
          )}
          
          {onImportBooks && (
            <button
              className="md3-fab md3-fab--small"
              onClick={() => handleActionClick('import', onImportBooks)}
              disabled={disabled}
              title="Import books"
            >
              📁
            </button>
          )}
          
          {onUpload && (
            <button
              className="md3-fab md3-fab--small"
              onClick={() => handleActionClick('upload', onUpload)}
              disabled={disabled}
              title="Upload book"
            >
              ⬆️
            </button>
          )}
        </div>
      )}

      {/* Main FAB */}
      <button
        className="md3-fab md3-fab--large"
        onClick={isExpanded ? handleMainClick : () => handleActionClick('add', onAddBook)}
        disabled={disabled}
        title={isExpanded ? "Close menu" : "Add book"}
      >
        <span className={`md3-fab__icon ${isExpanded ? 'rotated' : ''}`}>
          {isExpanded ? '✕' : '+'}
        </span>
      </button>
    </div>
  );
});

MD3BookLibraryFab.displayName = 'MD3BookLibraryFab';
export default MD3BookLibraryFab;