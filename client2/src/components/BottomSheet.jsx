import { useEffect, useRef, useState } from 'react';
import haptics from '../utils/haptics';
import '../styles/bottom-sheet.css';

/**
 * Bottom Sheet Modal Component
 * Native-feeling slide-up modal for mobile interactions
 *
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Callback when sheet is closed
 * @param {string} title - Optional title for the sheet
 * @param {ReactNode} children - Content to display in the sheet
 * @param {string} height - Height of sheet: 'small', 'medium', 'large', 'full', or custom CSS value
 * @param {boolean} allowSwipeDown - Allow swipe-down-to-close gesture (default: true)
 * @param {boolean} showHandle - Show drag handle at top (default: true)
 * @param {string} className - Additional CSS classes
 */
const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  height = 'medium',
  allowSwipeDown = true,
  showHandle = true,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const touchStartY = useRef(0);
  const sheetRef = useRef(null);

  // Height presets
  const heightPresets = {
    small: '30vh',
    medium: '50vh',
    large: '70vh',
    full: '90vh',
  };

  const sheetHeight = heightPresets[height] || height;

  // Handle swipe-down-to-close gesture
  useEffect(() => {
    if (!allowSwipeDown || !isOpen) return;

    const handleTouchStart = (e) => {
      const sheet = sheetRef.current;
      if (!sheet || !sheet.contains(e.target)) return;

      // Only start drag from top portion of sheet
      const rect = sheet.getBoundingClientRect();
      const touchY = e.touches[0].clientY;
      const relativeY = touchY - rect.top;

      if (relativeY < 80) {
        // Within draggable area
        touchStartY.current = touchY;
        setIsDragging(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;

      const touchY = e.touches[0].clientY;
      const delta = touchY - touchStartY.current;

      // Only allow dragging down (positive delta)
      if (delta > 0) {
        setDragDistance(delta);
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      // Close if dragged down more than 100px
      if (dragDistance > 100) {
        haptics.swipe();
        onClose();
      }

      // Reset
      setIsDragging(false);
      setDragDistance(0);
      touchStartY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [allowSwipeDown, isOpen, isDragging, dragDistance, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      haptics.lightTap();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      haptics.lightTap();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onClick={handleBackdropClick}>
      <div
        ref={sheetRef}
        className={`bottom-sheet ${className} ${isDragging ? 'dragging' : ''}`}
        style={{
          height: sheetHeight,
          transform: isDragging ? `translateY(${dragDistance}px)` : 'translateY(0)',
          opacity: isDragging ? 1 - (dragDistance / 400) : 1,
        }}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div className="bottom-sheet-handle-container">
            <div className="bottom-sheet-handle" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="bottom-sheet-header">
            <h2 className="bottom-sheet-title">{title}</h2>
            <button
              className="bottom-sheet-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
