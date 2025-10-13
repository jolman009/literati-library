// src/components/NoteSyncListener.jsx
// Listens for pending note sync events and shows notifications

import { useEffect } from 'react';
import { useSnackbar } from './Material3';

const NoteSyncListener = () => {
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const handleNoteSyncEvent = (event) => {
      const { synced, failed } = event.detail;

      if (synced > 0) {
        showSnackbar({
          message: `✅ ${synced} note${synced > 1 ? 's' : ''} synced successfully after login!`,
          variant: 'success',
          duration: 5000
        });
      }

      if (failed > 0) {
        showSnackbar({
          message: `⚠️ ${failed} note${failed > 1 ? 's' : ''} failed to sync - will retry later`,
          variant: 'warning',
          duration: 7000
        });
      }
    };

    window.addEventListener('pendingNotesSynced', handleNoteSyncEvent);

    return () => {
      window.removeEventListener('pendingNotesSynced', handleNoteSyncEvent);
    };
  }, [showSnackbar]);

  return null; // This is a listener-only component
};

export default NoteSyncListener;
