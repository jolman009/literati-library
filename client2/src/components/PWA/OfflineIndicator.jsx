import React from 'react';
import { usePWA } from '../../hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center z-50">
      <p className="text-sm font-medium">
        You're offline. Some features may be limited.
      </p>
    </div>
  );
};

export default OfflineIndicator;