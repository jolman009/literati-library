// src/components/Material3/MD3Dialog.jsx
import React, { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './MD3Dialog.css';

const MD3Dialog = memo(({
  open = false,
  onClose,
  title,
  children,
  actions,
  variant = 'basic',
  fullscreen = false,
  maxWidth = 'sm',
  scrollable = false,
  dividers = false,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dialogRef = useRef();
  const previousFocusRef = useRef();

  // Handle dialog open/close animations
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsAnimating(true);
      previousFocusRef.current = document.activeElement;
      
      // Focus trap setup
      setTimeout(() => {
        if (dialogRef.current) {
          const focusableElement = dialogRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          focusableElement?.focus();
        }
        setIsAnimating(false);
      }, 50);
    } else if (isVisible) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        // Return focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 200);
    }
  }, [open, isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Handle click outside
  const handleScrimClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  if (!isVisible) return null;

  const dialogClasses = [
    'md3-dialog',
    `md3-dialog--${variant}`,
    `md3-dialog--${maxWidth}`,
    fullscreen && 'md3-dialog--fullscreen',
    scrollable && 'md3-dialog--scrollable',
    dividers && 'md3-dialog--dividers',
    isAnimating && (open ? 'md3-dialog--opening' : 'md3-dialog--closing'),
    className
  ].filter(Boolean).join(' ');

  const dialogContent = (
    <div 
      className="md3-dialog__scrim"
      onClick={handleScrimClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={dialogClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        {...props}
      >
        <div className="md3-dialog__container">
          {title && (
            <div className="md3-dialog__header">
              <h2 id="dialog-title" className="md3-dialog__title">
                {title}
              </h2>
            </div>
          )}
          
          <div className="md3-dialog__content">
            {children}
          </div>
          
          {actions && (
            <div className="md3-dialog__actions">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
});

MD3Dialog.displayName = 'MD3Dialog';

// Dialog Actions Helper Component
export const MD3DialogActions = memo(({ 
  children, 
  alignment = 'end',
  stacked = false,
  className = '' 
}) => {
  const classes = [
    'md3-dialog-actions',
    `md3-dialog-actions--${alignment}`,
    stacked && 'md3-dialog-actions--stacked',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
});

MD3DialogActions.displayName = 'MD3DialogActions';

// Alert Dialog Variant
export const MD3AlertDialog = memo(({
  open,
  onClose,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  destructive = false,
  ...props
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  return (
    <MD3Dialog
      open={open}
      onClose={onClose}
      title={title}
      variant="alert"
      {...props}
    >
      {message && (
        <p className="md3-dialog__message">
          {message}
        </p>
      )}
      
      <MD3DialogActions>
        <button 
          type="button"
          className="md3-button md3-button--text"
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button 
          type="button"
          className={`md3-button ${destructive ? 'md3-button--text md3-button--error' : 'md3-button--text'}`}
          onClick={handleConfirm}
        >
          {confirmText}
        </button>
      </MD3DialogActions>
    </MD3Dialog>
  );
});

MD3AlertDialog.displayName = 'MD3AlertDialog';

export default MD3Dialog;