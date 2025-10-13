// src/utils/noteSyncUtil.js
// Utility for syncing pending notes saved locally when auth/network was unavailable

import API from '../config/api';

/**
 * Sync pending notes from localStorage to backend
 * Called after successful login or when network is restored
 * @returns {Object} { synced: number, failed: number, errors: Array }
 */
export const syncPendingNotes = async () => {
  try {
    const pendingNotes = JSON.parse(localStorage.getItem('pendingNotes') || '[]');

    if (pendingNotes.length === 0) {
      console.log('📝 No pending notes to sync');
      return { synced: 0, failed: 0, errors: [] };
    }

    console.log(`📝 Syncing ${pendingNotes.length} pending notes...`);

    const results = {
      synced: 0,
      failed: 0,
      errors: []
    };

    // Sync each note
    for (const pendingNote of pendingNotes) {
      try {
        // Remove our tracking fields before sending to API
        const { timestamp, status, ...noteData } = pendingNote;

        const response = await API.post('/notes', noteData, {
          timeout: 10000
        });

        console.log(`✅ Synced note from ${timestamp}:`, response.data.id);
        results.synced++;
      } catch (error) {
        console.error(`❌ Failed to sync note:`, error);
        results.failed++;
        results.errors.push({
          note: pendingNote,
          error: error.message
        });
      }
    }

    // Clear successfully synced notes
    if (results.synced > 0) {
      if (results.failed === 0) {
        // All synced - clear all
        localStorage.removeItem('pendingNotes');
        console.log(`✅ All ${results.synced} pending notes synced successfully`);
      } else {
        // Some failed - keep only the failed ones
        const failedNotes = results.errors.map(e => e.note);
        localStorage.setItem('pendingNotes', JSON.stringify(failedNotes));
        console.log(`⚠️ ${results.synced} synced, ${results.failed} failed`);
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Error during note sync:', error);
    return {
      synced: 0,
      failed: 0,
      errors: [{ error: error.message }]
    };
  }
};

/**
 * Get count of pending notes
 * @returns {number} Number of pending notes
 */
export const getPendingNotesCount = () => {
  try {
    const pendingNotes = JSON.parse(localStorage.getItem('pendingNotes') || '[]');
    return pendingNotes.length;
  } catch (error) {
    console.error('Error reading pending notes:', error);
    return 0;
  }
};

/**
 * Clear all pending notes (use with caution)
 */
export const clearPendingNotes = () => {
  localStorage.removeItem('pendingNotes');
  console.log('🗑️ Cleared all pending notes');
};
