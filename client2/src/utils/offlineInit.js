// src/utils/offlineInit.js
// Initialize offline functionality

import { initDB, isStorageAvailable } from './indexedDB';
import { syncManager } from '../services/syncManager';
import { cleanupExpiredBooks } from '../services/bookCacheService';

/**
 * Initialize offline reading infrastructure
 */
export async function initOfflineReading() {
  console.warn('🚀 Initializing offline reading...');

  try {
    // Check storage availability
    const storageCheck = await isStorageAvailable();

    if (!storageCheck.available) {
      console.warn('⚠️ Storage not available:', storageCheck.reason);
      return { success: false, error: storageCheck.reason };
    }

    console.warn('💾 Storage available:', {
      usage: storageCheck.estimate?.usageInMB + ' MB',
      quota: storageCheck.estimate?.quotaInMB + ' MB',
      percentage: storageCheck.estimate?.percentage + '%',
    });

    // Initialize IndexedDB
    await initDB();
    console.warn('✅ IndexedDB initialized');

    // Start sync manager
    syncManager.start();
    console.warn('✅ Sync manager started');

    // Clean up old cached books (run in background)
    setTimeout(async () => {
      try {
        await cleanupExpiredBooks();
        console.warn('✅ Cache cleanup complete');
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    }, 5000);

    // Listen for visibility changes to sync when app becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        console.warn('📱 App visible, triggering sync...');
        syncManager.sync();
      }
    });

    // Listen for app going to background (pause event on mobile)
    window.addEventListener('pagehide', () => {
      console.warn('📱 App going to background');
      // Could save current state here
    });

    // Listen for permanent sync failures
    window.addEventListener('sync-action-failed-permanently', (event) => {
      const { action, error } = event.detail;
      console.error('❌ Sync action failed permanently:', action.type, error);

      // Could show user notification here
      // showNotification({
      //   type: 'error',
      //   message: `Failed to sync ${action.type}: ${error}`,
      //   action: 'Retry',
      //   onAction: () => syncManager.sync()
      // });
    });

    return { success: true, storage: storageCheck.estimate };

  } catch (error) {
    console.error('❌ Failed to initialize offline reading:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if offline reading is ready
 */
export async function isOfflineReadyReady() {
  try {
    const storageCheck = await isStorageAvailable();
    return storageCheck.available && 'indexedDB' in window && 'serviceWorker' in navigator;
  } catch (_error) {
    return false;
  }
}

/**
 * Get offline reading status
 */
export async function getOfflineStatus() {
  try {
    const isReady = await isOfflineReadyReady();
    const storageCheck = await isStorageAvailable();

    return {
      ready: isReady,
      storage: storageCheck,
      serviceWorker: 'serviceWorker' in navigator,
      indexedDB: 'indexedDB' in window,
      syncManager: syncManager.getStatus(),
    };
  } catch (error) {
    return {
      ready: false,
      error: error.message,
    };
  }
}
