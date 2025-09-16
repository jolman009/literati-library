import React, { useState, useRef, useCallback } from 'react';
import { useLazyImage, useIntersectionObserver } from './hooks';
import './LazyImage.css';

const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder,
  fallback,
  width,
  height,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  style = {},
  loading = 'lazy',
  ...props
}) => {
  const [loadAttempted, setLoadAttempted] = useState(false);
  const containerRef = useRef(null);

  // Use intersection observer to detect when image should load
  const { hasIntersected } = useIntersectionObserver(containerRef, {
    threshold,
    rootMargin
  });

  // Use lazy image hook for actual image loading
  const { imageSrc, isLoaded, isError, shouldLoad } = useLazyImage(
    hasIntersected ? src : null,
    { threshold, rootMargin }
  );

  // Handle successful image load
  const handleLoad = useCallback((event) => {
    if (onLoad) {
      onLoad(event);
    }
  }, [onLoad]);

  // Handle image load error
  const handleError = useCallback((event) => {
    setLoadAttempted(true);
    if (onError) {
      onError(event);
    }
  }, [onError]);

  // Show placeholder while loading
  const showPlaceholder = !shouldLoad || (!isLoaded && !isError);

  // Show fallback if error and no retry or fallback image
  const showFallback = isError || (loadAttempted && !isLoaded);

  return (
    <div
      ref={containerRef}
      className={`lazy-image-container ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      {...props}
    >
      {/* Placeholder while loading */}
      {showPlaceholder && (
        <div className="lazy-image-placeholder">
          {placeholder || (
            <div className="lazy-image-skeleton">
              <div className="skeleton-shimmer" />
              <div className="skeleton-content">
                <span className="material-symbols-outlined">image</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback on error */}
      {showFallback && fallback && (
        <div className="lazy-image-fallback">
          {typeof fallback === 'string' ? (
            <img
              src={fallback}
              alt={alt}
              className="lazy-image-fallback-img"
              onError={handleError}
            />
          ) : (
            fallback
          )}
        </div>
      )}

      {/* Main image */}
      {imageSrc && !showFallback && (
        <img
          src={imageSrc}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          decoding="async"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease',
            opacity: isLoaded ? 1 : 0
          }}
        />
      )}

      {/* Loading indicator */}
      {shouldLoad && !isLoaded && !isError && (
        <div className="lazy-image-loading">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

// Higher-order component for progressive image enhancement
export const withProgressiveImage = (Component) => {
  return React.forwardRef((props, ref) => {
    const { src, lowQualitySrc, ...otherProps } = props;
    const [hasHighQuality, setHasHighQuality] = useState(false);

    // Preload high quality image
    React.useEffect(() => {
      if (src && src !== lowQualitySrc) {
        const img = new Image();
        img.onload = () => setHasHighQuality(true);
        img.src = src;
      }
    }, [src, lowQualitySrc]);

    return (
      <Component
        ref={ref}
        src={hasHighQuality ? src : lowQualitySrc || src}
        {...otherProps}
      />
    );
  });
};

// Specialized component for book covers with optimized loading
export const LazyBookCover = ({
  book,
  size = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const sizeMap = {
    small: { width: 60, height: 90 },
    medium: { width: 120, height: 180 },
    large: { width: 200, height: 300 }
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  // Generate fallback based on book info
  const fallbackContent = (
    <div className={`book-cover-fallback ${size}`}>
      <div className="book-spine">
        <div className="book-title">{book.title}</div>
        <div className="book-author">{book.author}</div>
      </div>
    </div>
  );

  return (
    <LazyImage
      src={book.cover_image_url || book.cover_url}
      alt={`Cover of ${book.title}`}
      className={`lazy-book-cover ${size} ${className}`}
      width={dimensions.width}
      height={dimensions.height}
      fallback={fallbackContent}
      onClick={onClick}
      threshold={0.1}
      rootMargin="100px"
      {...props}
    />
  );
};

// Utility for batch image preloading
export const preloadImages = (imageUrls, onProgress) => {
  return Promise.allSettled(
    imageUrls.map((url, index) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          if (onProgress) {
            onProgress(index + 1, imageUrls.length);
          }
          resolve(url);
        };

        img.onerror = () => {
          if (onProgress) {
            onProgress(index + 1, imageUrls.length);
          }
          reject(new Error(`Failed to load image: ${url}`));
        };

        img.src = url;
      });
    })
  );
};

export default LazyImage;