import React from 'react';

// Material 3 Dialog
export const Dialog = ({ 
  open, 
  onClose, 
  title, 
  content, 
  actions 
}) => {
  if (!open) return null;
  
  return (
    <>
      {/* Scrim */}
      <div 
        className="fixed inset-0 bg-scrim bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Dialog */}
        <div 
          className="bg-surface-container-high rounded-extra-large shadow-elevation-3 max-w-md w-full max-h-[90vh] overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          {title && (
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-headline-small text-on-surface">{title}</h2>
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
            <div className="text-body-medium text-on-surface-variant">
              {content}
            </div>
          </div>
          
          {/* Actions */}
          {actions && (
            <div className="px-6 pb-6 flex justify-end space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dialog;
