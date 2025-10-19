// src/services/syncManager.js
// Sync Manager - processes sync queue and syncs with backend

import API, { gamificationAPI } from '../config/api';
import {
  getPendingActions,
  getRetryableActions,
  markActionSyncing,
  markActionCompleted,
  markActionFailed,
  SYNC_ACTIONS,
} from './syncQueue';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.listeners = new Set();
  }

  /**
   * Start sync manager - listen for network changes and process queue
   */
  start() {
    console.log('🔄 Sync Manager started');

    // Listen for network online events
    window.addEventListener('network-online', () => this.processQueue());

    // Listen for queue updates
    window.addEventListener('sync-queue-updated', () => {
      if (navigator.onLine) {
        this.processQueue();
      }
    });

    // Periodic sync check (every 30 seconds when online)
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.processQueue();
      }
    }, 30000);

    // Process any pending actions immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Stop sync manager
   */
  stop() {
    console.log('🛑 Sync Manager stopped');
    window.removeEventListener('network-online', () => this.processQueue());
    window.removeEventListener('sync-queue-updated', () => this.processQueue());

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Process sync queue
   */
  async processQueue() {
    if (this.isSyncing || !navigator.onLine) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ status: 'syncing' });

    try {
      // Get pending and retryable failed actions
      const pending = await getPendingActions();
      const retryable = await getRetryableActions();
      const actions = [...pending, ...retryable];

      if (actions.length === 0) {
        this.isSyncing = false;
        this.notifyListeners({ status: 'idle', message: 'No actions to sync' });
        return;
      }

      console.log(`🔄 Processing ${actions.length} sync actions...`);

      let successCount = 0;
      let failCount = 0;

      for (const action of actions) {
        try {
          await markActionSyncing(action.id);
          await this.executeAction(action);
          await markActionCompleted(action.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          await markActionFailed(action.id, error);
          failCount++;
        }
      }

      const message = `Synced ${successCount} actions${failCount > 0 ? `, ${failCount} failed` : ''}`;
      console.log(`✅ ${message}`);

      this.notifyListeners({
        status: 'completed',
        message,
        successCount,
        failCount,
      });

    } catch (error) {
      console.error('Sync queue processing error:', error);
      this.notifyListeners({
        status: 'error',
        message: error.message,
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Execute a specific sync action
   */
  async executeAction(action) {
    const { type, payload } = action;

    switch (type) {
      case SYNC_ACTIONS.UPDATE_PROGRESS:
        return await this.syncReadingProgress(payload);

      case SYNC_ACTIONS.CREATE_NOTE:
        return await this.syncCreateNote(payload);

      case SYNC_ACTIONS.UPDATE_NOTE:
        return await this.syncUpdateNote(payload);

      case SYNC_ACTIONS.DELETE_NOTE:
        return await this.syncDeleteNote(payload);

      case SYNC_ACTIONS.CREATE_HIGHLIGHT:
        return await this.syncCreateHighlight(payload);

      case SYNC_ACTIONS.DELETE_HIGHLIGHT:
        return await this.syncDeleteHighlight(payload);

      case SYNC_ACTIONS.UPDATE_BOOKMARK:
        return await this.syncUpdateBookmark(payload);

      default:
        throw new Error(`Unknown sync action type: ${type}`);
    }
  }

  /**
   * Sync reading progress to backend
   */
  async syncReadingProgress(payload) {
    const { bookId, currentPage, totalPages, percentage, timestamp } = payload;

    const response = await API.put(`/books/${bookId}/progress`, {
      current_page: currentPage,
      total_pages: totalPages,
      percentage,
      updated_at: timestamp || new Date().toISOString(),
    });

    return response.data;
  }

  /**
   * Sync new note to backend
   */
  async syncCreateNote(payload) {
    const { bookId, content, page, position, timestamp, noteId } = payload;

    const token = localStorage.getItem('shelfquest_token');
    const data = await gamificationAPI.createNote(token, {
      book_id: bookId,
      content,
      page_number: page,
      position,
      type: 'note',
    });

    return data;
  }

  /**
   * Sync note update to backend
   */
  async syncUpdateNote(payload) {
    const { noteId, content, timestamp } = payload;

    const token = localStorage.getItem('shelfquest_token');
    const data = await gamificationAPI.updateNote(token, noteId, {
      content,
      type: 'note',
    });

    return data;
  }

  /**
   * Sync note deletion to backend
   */
  async syncDeleteNote(payload) {
    const { noteId } = payload;

    const token = localStorage.getItem('shelfquest_token');
    const data = await gamificationAPI.deleteNote(token, noteId);

    return data;
  }

  /**
   * Sync highlight to backend
   */
  async syncCreateHighlight(payload) {
    const { bookId, text, color, page, position, timestamp } = payload;

    const response = await API.post(`/books/${bookId}/highlights`, {
      text,
      color,
      page,
      position,
      created_at: timestamp || new Date().toISOString(),
    });

    return response.data;
  }

  /**
   * Sync highlight deletion to backend
   */
  async syncDeleteHighlight(payload) {
    const { highlightId } = payload;

    const response = await API.delete(`/highlights/${highlightId}`);
    return response.data;
  }

  /**
   * Sync bookmark update to backend
   */
  async syncUpdateBookmark(payload) {
    const { bookId, page, timestamp } = payload;

    const response = await API.put(`/books/${bookId}/bookmark`, {
      page,
      updated_at: timestamp || new Date().toISOString(),
    });

    return response.data;
  }

  /**
   * Add listener for sync events
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Manually trigger sync
   */
  async sync() {
    return await this.processQueue();
  }

  /**
   * Get current sync status
   */
  getStatus() {
    return {
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine,
    };
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
export default syncManager;
