
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReadingSession } from '../contexts/ReadingSessionContext';

const ReadingHeader = ({ book, onClose }) => {
  const navigate = useNavigate();
  const { activeSession } = useReadingSession();

  const handleBackToLibrary = () => {
    navigate('/library');
    onClose?.();
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #6750a4 0%, #4f46e5 100%)',
      color: 'white',
      padding: '16px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleBackToLibrary}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '8px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to Library
          </button>
          
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              {book?.title || 'Reading'}
            </h1>
            {book?.author && (
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                by {book.author}
              </p>
            )}
          </div>
        </div>

        {activeSession && (
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '14px'
          }}>
            📖 Reading Session Active
          </div>
        )}
      </div>
    </header>
  );
};

export default ReadingHeader;
