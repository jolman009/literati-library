// src/components/PerformanceMonitor.jsx
// Development performance monitoring widget

import React, { useState, useEffect } from 'react';
import { getPerformanceSummary, showPerformanceDashboard } from '../utils/webVitals';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [overallRating, setOverallRating] = useState('unknown');

  useEffect(() => {
    // Listen for Web Vitals updates
    const handleWebVital = (event) => {
      const { name, value, rating, formattedValue } = event.detail;
      setMetrics(prev => ({
        ...prev,
        [name]: { value, rating, formattedValue }
      }));
    };

    window.addEventListener('webvital', handleWebVital);

    // Update overall rating periodically
    const interval = setInterval(() => {
      const summary = getPerformanceSummary();
      setOverallRating(summary.overallRating);
    }, 2000);

    return () => {
      window.removeEventListener('webvital', handleWebVital);
      clearInterval(interval);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return '#4CAF50';
      case 'needs-improvement': return '#FF9800'; 
      case 'poor': return '#F44336';
      default: return '#757575';
    }
  };

  const getOverallColor = (rating) => {
    switch (rating) {
      case 'excellent': return '#2E7D32';
      case 'good': return '#4CAF50';
      case 'needs-improvement': return '#FF9800';
      case 'poor': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          backgroundColor: getOverallColor(overallRating),
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          cursor: 'pointer',
          fontSize: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        title={`Performance: ${overallRating.toUpperCase()}`}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
      >
        ⚡
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          minWidth: '300px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '12px',
            borderBottom: '1px solid #333',
            paddingBottom: '8px'
          }}>
            <strong>🎯 Web Vitals Monitor</strong>
            <span style={{ 
              color: getOverallColor(overallRating),
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '10px'
            }}>
              {overallRating}
            </span>
          </div>

          {/* Core Web Vitals */}
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>
              Core Web Vitals
            </strong>
            {['LCP', 'FID', 'CLS'].map(metric => (
              <div key={metric} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '4px',
                padding: '4px 0'
              }}>
                <span>{metric}:</span>
                <span style={{ 
                  color: getRatingColor(metrics[metric]?.rating),
                  fontWeight: 'bold'
                }}>
                  {metrics[metric]?.formattedValue || 'measuring...'}
                </span>
              </div>
            ))}
          </div>

          {/* Other Vitals */}
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>
              Loading Performance
            </strong>
            {['FCP', 'TTFB'].map(metric => (
              <div key={metric} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '4px',
                padding: '4px 0'
              }}>
                <span>{metric}:</span>
                <span style={{ 
                  color: getRatingColor(metrics[metric]?.rating),
                  fontWeight: 'bold'
                }}>
                  {metrics[metric]?.formattedValue || 'measuring...'}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            borderTop: '1px solid #333',
            paddingTop: '8px',
            marginTop: '8px'
          }}>
            <button
              onClick={showPerformanceDashboard}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                flex: 1
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;