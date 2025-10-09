// src/components/OfflineIndicator.jsx
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useOfflineDetection';
import { syncManager } from '../services/syncManager';
import { getSyncQueueStats } from '../services/syncQueue';

const OfflineIndicator = ({ className = '' }) => {
  const networkStatus = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState({ status: 'idle' });
  const [queueStats, setQueueStats] = useState({ total: 0, pending: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for sync events
    const unsubscribe = syncManager.addListener(setSyncStatus);

    // Update queue stats periodically
    const updateStats = async () => {
      const stats = await getSyncQueueStats();
      setQueueStats(stats);
    };

    updateStats();
    const statsInterval = setInterval(updateStats, 5000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    // Show indicator when offline or syncing
    setIsVisible(
      networkStatus.isOffline ||
      syncStatus.status === 'syncing' ||
      queueStats.hasPendingActions
    );
  }, [networkStatus.isOffline, syncStatus.status, queueStats.hasPendingActions]);

  if (!isVisible && networkStatus.isOnline) {
    return null;
  }

  const getStatusColor = () => {
    if (networkStatus.isOffline) return 'bg-red-500';
    if (syncStatus.status === 'syncing') return 'bg-blue-500';
    if (queueStats.hasPendingActions) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (networkStatus.isOffline) {
      return 'Offline - Changes will sync when reconnected';
    }
    if (syncStatus.status === 'syncing') {
      return `Syncing ${queueStats.total} ${queueStats.total === 1 ? 'item' : 'items'}...`;
    }
    if (queueStats.hasPendingActions) {
      return `${queueStats.pending} ${queueStats.pending === 1 ? 'change' : 'changes'} pending sync`;
    }
    return 'All changes synced';
  };

  const getIcon = () => {
    if (networkStatus.isOffline) return <WifiOff size={16} />;
    if (syncStatus.status === 'syncing') return <RefreshCw size={16} className="animate-spin" />;
    if (queueStats.hasPendingActions) return <CloudOff size={16} />;
    return <Cloud size={16} />;
  };

  const handleManualSync = () => {
    if (networkStatus.isOnline) {
      syncManager.sync();
    }
  };

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
      <div className={`${getStatusColor()} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] transition-all`}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        <div className="flex-1 text-sm">
          {getStatusText()}
        </div>

        {networkStatus.isOnline && queueStats.hasPendingActions && (
          <button
            onClick={handleManualSync}
            className="flex-shrink-0 px-2 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors text-xs font-medium"
            disabled={syncStatus.status === 'syncing'}
          >
            Sync Now
          </button>
        )}
      </div>

      {/* Network quality indicator */}
      {networkStatus.isOnline && networkStatus.effectiveType && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 px-4">
          Network: {networkStatus.effectiveType.toUpperCase()}
          {networkStatus.downlink && ` • ${networkStatus.downlink} Mbps`}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
