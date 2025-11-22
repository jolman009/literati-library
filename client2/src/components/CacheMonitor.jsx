// src/components/CacheMonitor.jsx
// Development cache monitoring widget

import React, { useState, useEffect } from 'react';
import Icon from './ui/Icon';
import { getCacheMetrics, cacheManager } from '../utils/cacheManager';
import { getApiMetrics } from '../api/cachedApi';
import environmentConfig from '../config/environment.js';

const CacheMonitor = () => {
  const [metrics, setMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [storageInfo, setStorageInfo] = useState({});

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const cacheMetrics = getCacheMetrics();
        const apiMetrics = getApiMetrics();
        const storage = await getStorageEstimate();
        
        setMetrics({ cache: cacheMetrics, api: apiMetrics });
        setStorageInfo(storage);
      } catch (error) {
        console.warn('Cache metrics update failed:', error);
      }
    };

    // Update metrics every 2 seconds when visible
    let interval;
    if (isVisible) {
      updateMetrics();
      interval = setInterval(updateMetrics, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  const getStorageEstimate = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: Math.round(estimate.quota / 1024 / 1024), // MB
          usage: Math.round(estimate.usage / 1024 / 1024)   // MB
        };
      } catch {
        return { quota: 'n/a', usage: 'n/a' };
      }
    }
    return { quota: 'n/a', usage: 'n/a' };
  };

  const handleClearCache = () => {
    cacheManager.clearAll();
    setMetrics({});
    alert('All caches cleared successfully');
  };

  const handleWarmCache = () => {
    const userId = getUserId();
    if (userId) {
      cacheManager.warmCache(userId, ['books', 'stats'])
        .then(() => alert('Cache warming completed'))
        .catch(error => alert(`Cache warming failed: ${error.message}`));
    }
  };

  const getUserId = () => {
    try {
      const key = environmentConfig.getTokenKey();
      const token = localStorage.getItem(key) || localStorage.getItem('shelfquest_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.user_id || payload.id;
      }
    } catch {
      return null;
    }
    return null;
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getCacheEfficiencyColor = (hitRate) => {
    const rate = parseFloat(hitRate);
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FF9800';
    return '#F44336';
  };

  const getConnectionColor = (isOnline) => {
    return isOnline ? '#4CAF50' : '#F44336';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '20px',
      zIndex: 9998,
      fontFamily: 'monospace',
      fontSize: '11px'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          backgroundColor: '#673AB7',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          cursor: 'pointer',
          fontSize: '18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        title="Cache Monitor"
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
      >
        <Icon name="save" size={18} />
      </button>

      {/* Cache Monitor Panel */}
      {isVisible && (
        <div style={{
          position: 'absolute',
          bottom: '55px',
          left: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          color: 'white',
          padding: '16px',
          borderRadius: '8px',
          minWidth: '320px',
          maxWidth: '400px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '12px',
            borderBottom: '1px solid #444',
            paddingBottom: '8px'
          }}>
            <strong><Icon name="save" size={12} /> Cache Monitor</strong>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0'
              }}
            >
              <Icon name="close" size={14} />
            </button>
          </div>

          {/* Cache Metrics */}
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '10px', display: 'block', marginBottom: '6px' }}>
              CACHE PERFORMANCE
            </strong>
            {metrics.cache && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Hit Rate:</span>
                  <span style={{ 
                    color: getCacheEfficiencyColor(metrics.cache.hitRate),
                    fontWeight: 'bold'
                  }}>
                    {metrics.cache.hitRate}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Hits:</span>
                  <span style={{ color: '#4CAF50' }}>{metrics.cache.hits}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Misses:</span>
                  <span style={{ color: '#FF5722' }}>{metrics.cache.misses}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Memory Size:</span>
                  <span>{metrics.cache.memorySize} items</span>
                </div>
              </>
            )}
          </div>

          {/* API Metrics */}
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '10px', display: 'block', marginBottom: '6px' }}>
              API STATUS
            </strong>
            {metrics.api && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Connection:</span>
                  <span style={{ 
                    color: getConnectionColor(metrics.api.isOnline),
                    fontWeight: 'bold'
                  }}>
                    {metrics.api.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Queue Size:</span>
                  <span style={{ 
                    color: metrics.api.queueSize > 0 ? '#FF9800' : '#4CAF50'
                  }}>
                    {metrics.api.queueSize}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Storage Usage */}
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '10px', display: 'block', marginBottom: '6px' }}>
              STORAGE USAGE
            </strong>
            {metrics.cache?.storageUsage && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Cache Size:</span>
                  <span>{metrics.cache.storageUsage.totalSize} KB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Cache Items:</span>
                  <span>{metrics.cache.storageUsage.itemCount}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Total Usage:</span>
              <span>{storageInfo.usage} / {storageInfo.quota} MB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '6px',
            borderTop: '1px solid #444',
            paddingTop: '8px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleWarmCache}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '9px',
                flex: '1',
                minWidth: '70px'
              }}
            >
              <Icon name="fire" size={12} /> Warm Cache
            </button>
            <button
              onClick={handleClearCache}
              style={{
                backgroundColor: '#F44336',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '9px',
                flex: '1',
                minWidth: '70px'
              }}
            >
              <Icon name="delete" size={12} /> Clear All
            </button>
          </div>

          {/* Debug Commands */}
          <div style={{ 
            marginTop: '8px',
            padding: '6px 0',
            borderTop: '1px solid #444',
            fontSize: '9px',
            color: '#888'
          }}>
            <Icon name="tips" size={12} /> Console: <code>cacheManager.getMetrics()</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheMonitor;
