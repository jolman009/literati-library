      {/* Timer Widget */}
      <div className="timer-widget" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Reading Timer</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>00:00:00</div>
      </div>