// src/services/syncQueue.js
// Sync Queue Manager - handles offline actions and syncs when online

import { setItem, getItemsByIndex, deleteItem, STORES } from '../utils/indexedDB';

export const SYNC_ACTIONS = {
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  CREATE_NOTE: 'CREATE_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  CREATE_HIGHLIGHT: 'CREATE_HIGHLIGHT',
  DELETE_HIGHLIGHT: 'DELETE_HIGHLIGHT',
  UPDATE_BOOKMARK: 'UPDATE_BOOKMARK',
};

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Add action to sync queue
 */
export async function queueAction(type, payload, options = {}) {
  const action = {
    type,
    payload,
    status: SYNC_STATUS.PENDING,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: options.maxRetries || 3,
    priority: options.priority || 5, // 1-10, higher = more important
  };

  try {
    const id = await setItem(STORES.SYNC_QUEUE, action);
    console.log(`📤 Queued ${type} action (ID: ${id})`);

    // Dispatch event for sync manager
    window.dispatchEvent(new CustomEvent('sync-queue-updated', { detail: { actionId: id, action } }));

    return id;
  } catch (error) {
    console.error('Failed to queue action:', error);
    throw error;
  }
}

/**
 * Get all pending sync actions
 */
export async function getPendingActions() {
  try {
    const allActions = await getItemsByIndex(STORES.SYNC_QUEUE, 'status', SYNC_STATUS.PENDING);

    // Sort by priority (higher first) then timestamp (older first)
    return allActions.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  } catch (error) {
    console.error('Failed to get pending actions:', error);
    return [];
  }
}

/**
 * Get failed actions that can be retried
 */
export async function getRetryableActions() {
  try {
    const failed = await getItemsByIndex(STORES.SYNC_QUEUE, 'status', SYNC_STATUS.FAILED);
    return failed.filter(action => action.retryCount < action.maxRetries);
  } catch (error) {
    console.error('Failed to get retryable actions:', error);
    return [];
  }
}

/**
 * Mark action as syncing
 */
export async function markActionSyncing(actionId) {
  try {
    const action = await getItem(STORES.SYNC_QUEUE, actionId);
    if (action) {
      action.status = SYNC_STATUS.SYNCING;
      action.lastAttempt = Date.now();
      await setItem(STORES.SYNC_QUEUE, action);
    }
  } catch (error) {
    console.error('Failed to mark action as syncing:', error);
  }
}

/**
 * Mark action as completed and remove from queue
 */
export async function markActionCompleted(actionId, result = null) {
  try {
    await deleteItem(STORES.SYNC_QUEUE, actionId);
    console.log(`✅ Action ${actionId} completed and removed from queue`);

    // Optionally store result for audit
    if (result) {
      // Could save to a completed actions log if needed
    }
  } catch (error) {
    console.error('Failed to mark action as completed:', error);
  }
}

/**
 * Mark action as failed
 */
export async function markActionFailed(actionId, error) {
  try {
    const action = await getItem(STORES.SYNC_QUEUE, actionId);
    if (action) {
      action.status = SYNC_STATUS.FAILED;
      action.retryCount += 1;
      action.lastError = error.message || String(error);
      action.lastAttempt = Date.now();

      await setItem(STORES.SYNC_QUEUE, action);

      console.error(`❌ Action ${actionId} failed (retry ${action.retryCount}/${action.maxRetries}):`, error);

      // If max retries exceeded, could dispatch event for user notification
      if (action.retryCount >= action.maxRetries) {
        window.dispatchEvent(new CustomEvent('sync-action-failed-permanently', {
          detail: { actionId, action, error }
        }));
      }
    }
  } catch (err) {
    console.error('Failed to mark action as failed:', err);
  }
}

/**
 * Clear all completed actions
 */
export async function clearCompletedActions() {
  try {
    const completed = await getItemsByIndex(STORES.SYNC_QUEUE, 'status', SYNC_STATUS.COMPLETED);
    for (const action of completed) {
      await deleteItem(STORES.SYNC_QUEUE, action.id);
    }
    console.log(`🗑️ Cleared ${completed.length} completed actions`);
  } catch (error) {
    console.error('Failed to clear completed actions:', error);
  }
}

/**
 * Get sync queue statistics
 */
export async function getSyncQueueStats() {
  try {
    const pending = await getItemsByIndex(STORES.SYNC_QUEUE, 'status', SYNC_STATUS.PENDING);
    const syncing = await getItemsByIndex(STORES.SYNC_QUEUE, 'status', SYNC_STATUS.SYNCING);
    const failed = await getItemsByIndex(STORES.SYNC_QUEUE, 'status', SYNC_STATUS.FAILED);

    return {
      pending: pending.length,
      syncing: syncing.length,
      failed: failed.length,
      total: pending.length + syncing.length + failed.length,
      hasPendingActions: pending.length > 0 || failed.filter(a => a.retryCount < a.maxRetries).length > 0,
    };
  } catch (error) {
    console.error('Failed to get sync queue stats:', error);
    return { pending: 0, syncing: 0, failed: 0, total: 0, hasPendingActions: false };
  }
}

// Export for backwards compatibility
import { getItem } from '../utils/indexedDB';
