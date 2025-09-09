// src/components/EnhancedBookCard.jsx DEBUG VERSION
const EnhancedBookCard = ({ 
  book, 
  viewMode = 'grid', 
  onRead, 
  onStartReading, 
  onStopReading,
  onEdit,
  onDelete,
  onMenuAction,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showTimerWidget, setShowTimerWidget] = useState(false);
  
  // Try to get reading session - with error handling
  let activeSession = null;
  let startReadingSession = null;
  let stopReadingSession = null;
  
  try {
    const readingSessionHook = useReadingSession();
    activeSession = readingSessionHook?.activeSession;
    startReadingSession = readingSessionHook?.startReadingSession;
    stopReadingSession = readingSessionHook?.stopReadingSession;
  } catch (error) {
    console.log('🔍 Reading session hook not available:', error);
  }

  // Debug: Calculate if currently reading
  const isCurrentlyReading = activeSession?.book?.id === book.id;
  
  // Debug: Log everything
  console.log('🔍 CARD DEBUG for', book.title, {
    bookId: book.id,
    hasActiveSession: !!activeSession,
    activeSessionBookId: activeSession?.book?.id,
    isCurrentlyReading: isCurrentlyReading,
    showTimerWidget: showTimerWidget
  });

  const handleCardClick = (e) => {
    if (e.target.closest('.menu-button') || 
        e.target.closest('.book-menu') || 
        e.target.closest('.reading-actions')) {
      return;
    }
    
    console.log('📖 Card clicked, opening book:', book.title);
    onRead?.(book);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    console.log('🔍 Menu clicked for:', book.title);
    setShowMenu(!showMenu);
  };

  const handleStartReading = async () => {
    console.log('🔍 Starting reading session for:', book.title);
    
    if (startReadingSession) {
      try {
        const result = await startReadingSession(book);
        console.log('🔍 Start reading result:', result);
        if (result?.success) {
          setShowTimerWidget(true);
          setShowMenu(false);
          console.log('✅ Reading session started successfully');
        }
      } catch (error) {
        console.error('❌ Failed to start reading session:', error);
      }
    } else if (onStartReading) {
      // Fallback to prop function
      console.log('🔍 Using onStartReading prop');
      onStartReading(book);
      setShowTimerWidget(true);
    } else {
      console.log('❌ No start reading function available');
    }
  };

  const handleStopReading = async () => {
    console.log('🔍 Stopping reading session');
    
    if (stopReadingSession) {
      try {
        const result = await stopReadingSession();
        console.log('🔍 Stop reading result:', result);
        if (result?.success) {
          setShowTimerWidget(false);
          console.log('✅ Reading session stopped successfully');
        }
      } catch (error) {
        console.error('❌ Failed to stop reading session:', error);
      }
    } else if (onStopReading) {
      // Fallback to prop function
      console.log('🔍 Using onStopReading prop');
      onStopReading(book);
      setShowTimerWidget(false);
    }
  };

  // Debug: Auto-show timer widget when reading this book
  useEffect(() => {
    console.log('🔍 Reading state changed for', book.title, 'isCurrentlyReading:', isCurrentlyReading);
    if (isCurrentlyReading) {
      setShowTimerWidget(true);
    } else {
      setShowTimerWidget(false);
    }
  }, [isCurrentlyReading, book.title]);

  return (
    <div className={`enhanced-book-card ${viewMode} ${className}`}>
      <div 
        className="book-card-content"
        onClick={handleCardClick}
        style={{
          borderRadius: '12px',
          background: 'white',
          border: `3px solid ${isCurrentlyReading ? '#4caf50' : '#ddd'}`,
          padding: '16px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
      >
        {/* DEBUG INFO */}
        <div style={{
          backgroundColor: isCurrentlyReading ? '#4caf50' : '#666',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          {isCurrentlyReading ? '🟢 READING ACTIVE' : '⚫ NOT READING'} | 
          Timer: {showTimerWidget ? 'SHOWN' : 'HIDDEN'}
        </div>

        {/* Book Cover */}
        <div style={{ 
          marginBottom: '12px', 
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          aspectRatio: '3/4',
          backgroundColor: '#f0f0f0'
        }}>
          {book.cover_url ? (
            <img 
              src={book.cover_url} 
              alt={`${book.title} cover`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e0e0e0',
              fontSize: '12px',
              textAlign: 'center',
              padding: '8px'
            }}>
              {book.title}
            </div>
          )}

          {/* Menu button */}
          <button
            className="menu-button"
            onClick={handleMenuClick}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              zIndex: 10
            }}
          >
            ⋮
          </button>

          {/* TIMER BUTTON - Big and obvious when reading */}
          {isCurrentlyReading && (
            <button
              onClick={() => {
                console.log('🔍 Timer button clicked!');
                setShowTimerWidget(!showTimerWidget);
              }}
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                minWidth: '80px',
                height: '36px',
                borderRadius: '18px',
                border: 'none',
                backgroundColor: '#ff9800',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 10,
                animation: 'pulse 2s infinite'
              }}
            >
              🔥 TIMER 🔥
            </button>
          )}

          {/* Reading status badge */}
          {isCurrentlyReading && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              Reading
            </div>
          )}
        </div>

        {/* Book Details */}
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>
            {book.title}
          </h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
            {book.author}
          </p>
        </div>

        {/* READING ACTIONS SECTION - This is where the timer should appear */}
        <div className="reading-actions" style={{ marginTop: '16px' }}>
          {showTimerWidget && isCurrentlyReading ? (
            <SimpleTimerWidget book={book} onStop={handleStopReading} />
          ) : (
            <div>
              <button
                onClick={handleStartReading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ▶️ Start Reading
              </button>
            </div>
          )}
        </div>

        {/* Menu */}
        {showMenu && (
          <div 
            style={{
              position: 'absolute',
              top: '40px',
              right: '8px',
              backgroundColor: 'white',
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '8px',
              zIndex: 20,
              minWidth: '150px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!isCurrentlyReading && (
              <button
                onClick={() => {
                  console.log('🔍 Menu: Start Reading clicked');
                  setShowMenu(false);
                  handleStartReading();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#4caf50',
                  fontWeight: '600'
                }}
              >
                ▶️ Start Reading
              </button>
            )}
            
            {isCurrentlyReading && (
              <button
                onClick={() => {
                  console.log('🔍 Menu: Stop Reading clicked');
                  setShowMenu(false);
                  handleStopReading();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#f44336',
                  fontWeight: '600'
                }}
              >
                ⏹️ Stop Reading
              </button>
            )}
            
            <button
              onClick={() => {
                setShowMenu(false);
                onRead?.(book);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📖 Open Book
            </button>
            
            <button
              onClick={() => {
                setShowMenu(false);
                onEdit?.(book);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✏️ Edit
            </button>
            
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete?.(book);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#f44336'
              }}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};



export default EnhancedBookCard;