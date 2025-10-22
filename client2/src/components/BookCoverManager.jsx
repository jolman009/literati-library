import React, { useState, useEffect } from 'react';
import API from '../config/api';
import './BookCoverManager.css';

// Component to manage and display book covers with fallback
export const BookCoverManager = ({ book, size = 'medium', onClick, className = '' }) => {
  const [coverUrl, setCoverUrl] = useState(book.cover_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Size configurations
  const sizeConfig = {
    small: { width: 96, height: 144, quality: '192x288' },
    medium: { width: 192, height: 288, quality: '384x576' },
    large: { width: 256, height: 384, quality: '512x768' },
    thumbnail: { width: 64, height: 96, quality: '192x288' }
  };
  
  const config = sizeConfig[size] || sizeConfig.medium;

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  };
  
  // Fetch cover if missing
  useEffect(() => {
    if (!coverUrl || coverUrl.includes('placeholder')) {
      fetchCover();
    }
  }, [book.id]);
  
  const fetchCover = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const response = await API.post('/covers-enhanced/ensure', {
        bookId: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        isbn10: book.isbn10,
        isbn13: book.isbn13,
        genre: book.genre
      });
      
      if (response.data.cover_url) {
        setCoverUrl(response.data.cover_url);
        // Update the book object if possible
        if (book.cover_url !== response.data.cover_url) {
          book.cover_url = response.data.cover_url;
          book.cover_base = response.data.cover_base;
        }
      }
    } catch (err) {
      console.error('Failed to fetch cover:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate optimized image URL
  const getOptimizedUrl = () => {
    if (!coverUrl) return null;
    
    // If we have a base directory, use the optimized version
    if (book.cover_base && coverUrl.includes('supabase')) {
      const baseUrl = coverUrl.substring(0, coverUrl.lastIndexOf('/') + 1);
      return `${baseUrl}${config.quality}.webp`;
    }
    
    return coverUrl;
  };
  
  // Generate a color based on book title for consistent colors
  const getBookColor = () => {
    if (!book.title) return { hue: 200, lightness: 45 };
    
    let hash = 0;
    for (let i = 0; i < book.title.length; i++) {
      hash = book.title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const lightness = 35 + (Math.abs(hash) % 30); // 35-65% lightness for good contrast
    
    return { hue, lightness };
  };

  // Render fallback cover with multiple design options
  const renderFallback = () => {
    const { hue, lightness } = getBookColor();
    const fallbackType = Math.abs((book.title || '').length) % 4; // 4 different designs
    
    const baseStyle = {
      width: config.width, 
      height: config.height,
      background: `linear-gradient(135deg, 
        hsl(${hue}, 70%, ${lightness}%) 0%, 
        hsl(${(hue + 30) % 360}, 60%, ${lightness + 10}%) 100%)`,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default'
    };

    // Design Type 1: Geometric Pattern
    if (fallbackType === 0) {
      return (
        <div
          className={`book-cover-fallback geometric ${size} ${className}`}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          style={baseStyle}
        >
          <div className="geometric-pattern" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />
          <div className="book-icon-large" style={{
            fontSize: size === 'small' ? '2.5rem' : '4rem',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 2
          }}>
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
        </div>
      );
    }
    
    // Design Type 2: Abstract Shapes
    if (fallbackType === 1) {
      return (
        <div
          className={`book-cover-fallback abstract ${size} ${className}`}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          style={baseStyle}
        >
          <div className="abstract-shapes" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              circle at 20% 30%, rgba(255,255,255,0.15) 30px, transparent 31px),
              circle at 80% 70%, rgba(255,255,255,0.1) 40px, transparent 41px)`,
            backgroundSize: '100px 100px'
          }} />
          <div className="book-spine" style={{
            position: 'absolute',
            left: '10px',
            top: '20%',
            bottom: '20%',
            width: '4px',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '2px'
          }} />
          <div className="book-icon-large" style={{
            fontSize: size === 'small' ? '2.5rem' : '4rem',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 2
          }}>
            <span className="material-symbols-outlined">library_books</span>
          </div>
        </div>
      );
    }
    
    // Design Type 3: Minimal Lines
    if (fallbackType === 2) {
      return (
        <div
          className={`book-cover-fallback minimal ${size} ${className}`}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          style={baseStyle}
        >
          <div className="minimal-lines" style={{
            position: 'absolute',
            inset: '20px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '4px'
          }} />
          <div className="inner-border" style={{
            position: 'absolute',
            inset: '30px',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '2px'
          }} />
          <div className="book-icon-large" style={{
            fontSize: size === 'small' ? '2.5rem' : '4rem',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 2
          }}>
            <span className="material-symbols-outlined">menu_book</span>
          </div>
        </div>
      );
    }
    
    // Design Type 4: Textured Background
    return (
      <div
        className={`book-cover-fallback textured ${size} ${className}`}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={baseStyle}
      >
        <div className="texture-overlay" style={{
          position: 'absolute',
          inset: 0,
          background: `
            repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.05) 0px,
              rgba(255,255,255,0.05) 1px,
              transparent 1px,
              transparent 8px
            )`,
          zIndex: 1
        }} />
        <div className="corner-decoration" style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          width: '30px',
          height: '30px',
          border: '2px solid rgba(255,255,255,0.4)',
          borderRadius: '50%',
          zIndex: 1
        }} />
        <div className="book-icon-large" style={{
          fontSize: size === 'small' ? '2.5rem' : '4rem',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 2
        }}>
          <span className="material-symbols-outlined">import_contacts</span>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div 
        className={`book-cover-loading ${size} ${className}`}
        style={{ width: config.width, height: config.height }}
      >
        <div className="loading-shimmer"></div>
      </div>
    );
  }
  
  if (error || !coverUrl) {
    return renderFallback();
  }
  
  return (
    <div
      className={`book-cover-container ${size} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ width: config.width, height: config.height }}
    >
      <img 
        src={getOptimizedUrl()}
        alt={book.title}
        className="book-cover-image"
        loading="lazy"
        onError={() => {
          setError(true);
          setCoverUrl(null);
        }}
      />
      {book.cover_source === 'generated' && (
        <div className="cover-badge generated" title="AI Generated Cover">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
      )}
    </div>
  );
};

// Batch cover processor component
export const BatchCoverProcessor = ({ onComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    checkStatus();
  }, []);
  
  const checkStatus = async () => {
    try {
      const response = await API.get('/covers-enhanced/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to get cover status:', error);
    }
  };
  
  const processMissingCovers = async () => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const response = await API.post('/covers-enhanced/batch', {
        processAll: true
      });
      
      if (response.data.success) {
        // Start polling for progress
        const estimatedTime = parseInt(response.data.estimatedTime) * 1000;
        const interval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, estimatedTime / 10);
        
        // Wait for estimated time then check status
        setTimeout(async () => {
          clearInterval(interval);
          setProgress(100);
          await checkStatus();
          setProcessing(false);
          if (onComplete) onComplete();
        }, estimatedTime);
      }
    } catch (error) {
      console.error('Failed to process covers:', error);
      setProcessing(false);
    }
  };
  
  if (!status) return null;
  
  return (
    <div className="batch-cover-processor">
      <div className="cover-status">
        <h3>Book Cover Status</h3>
        <div className="status-stats">
          <div className="stat">
            <span className="stat-value">{status.withCovers}</span>
            <span className="stat-label">With Covers</span>
          </div>
          <div className="stat">
            <span className="stat-value">{status.missing}</span>
            <span className="stat-label">Missing</span>
          </div>
          <div className="stat">
            <span className="stat-value">{status.coverage}%</span>
            <span className="stat-label">Coverage</span>
          </div>
        </div>
        
        {status.missing > 0 && !processing && (
          <button 
            className="md3-button md3-button-filled"
            onClick={processMissingCovers}
          >
            <span className="material-symbols-outlined">image_search</span>
            Fetch Missing Covers ({status.missing})
          </button>
        )}
        
        {processing && (
          <div className="processing-status">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p>Processing covers... {progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCoverManager;
