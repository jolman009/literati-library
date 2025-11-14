import '../styles/swipe-indicator.css';

/**
 * Swipe Indicator Component
 * Shows visual feedback during page swipe gestures
 */
const SwipeIndicator = ({ isSwiping, swipeDirection, previewOpacity }) => {
  if (!isSwiping) return null;

  const isLeft = swipeDirection === 'left';
  const isRight = swipeDirection === 'right';

  return (
    <>
      {/* Left indicator (Next page) */}
      {isLeft && (
        <div
          className="swipe-indicator swipe-indicator-left"
          style={{ opacity: previewOpacity }}
        >
          <div className="swipe-icon">
            <span className="material-symbols-outlined">chevron_left</span>
          </div>
          <span className="swipe-text">Next Page</span>
        </div>
      )}

      {/* Right indicator (Previous page) */}
      {isRight && (
        <div
          className="swipe-indicator swipe-indicator-right"
          style={{ opacity: previewOpacity }}
        >
          <span className="swipe-text">Previous Page</span>
          <div className="swipe-icon">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
      )}
    </>
  );
};

export default SwipeIndicator;
