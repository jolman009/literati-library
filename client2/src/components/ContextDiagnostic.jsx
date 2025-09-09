// src/components/ContextDiagnostic.jsx
// Temporary diagnostic component to check provider wrapping
import React from 'react';

// Safe context hook wrapper
const useSafeContext = (hookFn, contextName) => {
  try {
    return hookFn();
  } catch (error) {
    console.warn(`⚠️ Context ${contextName} not available:`, error.message);
    return null;
  }
};

const ContextDiagnostic = () => {
  // Test each context safely
  const contexts = [];

  // Test AuthContext
  try {
    // const { useAuth } = require('../contexts/AuthContext');
    const authContext = useSafeContext(useAuth, 'AuthContext');
    contexts.push({
      name: 'AuthContext',
      available: !!authContext,
      methods: authContext ? Object.keys(authContext) : [],
      critical: true
    });
  } catch (error) {
    contexts.push({
      name: 'AuthContext',
      available: false,
      error: error.message,
      critical: true
    });
  }

  // Test GamificationContext
  try {
    // const { useGamification } = require('../contexts/GamificationContext');
    const gamificationContext = useSafeContext(useGamification, 'GamificationContext');
    contexts.push({
      name: 'GamificationContext',
      available: !!gamificationContext,
      methods: gamificationContext ? Object.keys(gamificationContext) : [],
      critical: false
    });
  } catch (error) {
    contexts.push({
      name: 'GamificationContext',
      available: false,
      error: error.message,
      critical: false
    });
  }

  // Test ReadingSessionContext
  try {
   // const { useReadingSession } = require('../contexts/ReadingSessionContext');
    const readingSessionContext = useSafeContext(useReadingSession, 'ReadingSessionContext');
    contexts.push({
      name: 'ReadingSessionContext',
      available: !!readingSessionContext,
      methods: readingSessionContext ? Object.keys(readingSessionContext) : [],
      critical: false
    });
  } catch (error) {
    contexts.push({
      name: 'ReadingSessionContext',
      available: false,
      error: error.message,
      critical: false
    });
  }

  // Test Material3 contexts
  try {
   // const { useMaterial3Theme } = require('../components/Material3');
    const themeContext = useSafeContext(useMaterial3Theme, 'Material3Theme');
    contexts.push({
      name: 'Material3Theme',
      available: !!themeContext,
      methods: themeContext ? Object.keys(themeContext) : [],
      critical: false
    });
  } catch (error) {
    contexts.push({
      name: 'Material3Theme',
      available: false,
      error: error.message,
      critical: false
    });
  }

  const criticalIssues = contexts.filter(ctx => !ctx.available && ctx.critical);
  const warnings = contexts.filter(ctx => !ctx.available && !ctx.critical);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      fontSize: '14px',
      zIndex: 10000,
      maxWidth: '500px',
      maxHeight: '400px',
      overflow: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      fontFamily: 'monospace'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>🔍</span>
        <h4 style={{ margin: 0, color: '#4CAF50', fontSize: '16px' }}>
          Context Diagnostic
        </h4>
        <button 
          onClick={() => {
            const diagnostic = document.querySelector('[data-context-diagnostic]');
            if (diagnostic) diagnostic.remove();
          }}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: '1px solid #666',
            color: 'white',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            color: '#f44336', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span>🚨</span> Critical Issues ({criticalIssues.length})
          </div>
          {criticalIssues.map(({ name, error }) => (
            <div key={name} style={{ 
              marginLeft: '20px', 
              marginBottom: '5px',
              fontSize: '12px',
              color: '#ffcdd2'
            }}>
              <strong>{name}:</strong> {error || 'Not available'}
            </div>
          ))}
        </div>
      )}

      {/* Context Status */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          color: '#2196F3', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <span>📊</span> Context Status
        </div>
        
        {contexts.map(({ name, available, methods, critical }) => (
          <div key={name} style={{ 
            marginBottom: '8px',
            padding: '8px',
            background: available ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            borderRadius: '6px',
            border: `1px solid ${available ? '#4CAF50' : '#f44336'}`
          }}>
            <div style={{ 
              fontWeight: 'bold',
              color: available ? '#4CAF50' : '#f44336',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span>{available ? '✅' : '❌'}</span>
              {name}
              {critical && <span style={{ fontSize: '10px', color: '#ff9800' }}>(CRITICAL)</span>}
            </div>
            
            {available && methods && methods.length > 0 && (
              <div style={{ 
                marginLeft: '20px', 
                fontSize: '11px', 
                color: '#ccc',
                marginTop: '4px'
              }}>
                Methods: {methods.slice(0, 5).join(', ')}
                {methods.length > 5 && `... (+${methods.length - 5} more)`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            color: '#ff9800', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span>⚠️</span> Warnings ({warnings.length})
          </div>
          {warnings.map(({ name }) => (
            <div key={name} style={{ 
              marginLeft: '20px', 
              fontSize: '12px',
              color: '#ffcc80'
            }}>
              {name} context not available (optional)
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div style={{ 
        background: 'rgba(33, 150, 243, 0.1)',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #2196F3'
      }}>
        <div style={{ 
          color: '#2196F3', 
          fontWeight: 'bold', 
          marginBottom: '5px',
          fontSize: '12px'
        }}>
          💡 Recommendations:
        </div>
        <div style={{ fontSize: '11px', color: '#bbdefb', lineHeight: '1.4' }}>
          {criticalIssues.length > 0 ? (
            <>
              • Fix critical context issues first<br />
              • Check App.jsx provider wrapping<br />
              • Ensure contexts are imported correctly<br />
              • Restart development server
            </>
          ) : (
            <>
              • All critical contexts are working<br />
              • Optional contexts can be ignored if not needed<br />
              • System should function normally
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Auto-inject diagnostic in development
if (process.env.NODE_ENV === 'development') {
  const injectDiagnostic = () => {
    const existing = document.querySelector('[data-context-diagnostic]');
    if (existing) return;

    const diagnosticContainer = document.createElement('div');
    diagnosticContainer.setAttribute('data-context-diagnostic', 'true');
    document.body.appendChild(diagnosticContainer);

    // Render the diagnostic
    import('react-dom').then(({ render }) => {
      render(React.createElement(ContextDiagnostic), diagnosticContainer);
    }).catch(error => {
      console.warn('Failed to render context diagnostic:', error);
    });
  };

  // Add to window for manual triggering
  window.showContextDiagnostic = injectDiagnostic;
  
  // Auto-show after a delay
  setTimeout(injectDiagnostic, 2000);
}

export default ContextDiagnostic;