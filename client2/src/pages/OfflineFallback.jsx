// src/pages/OfflineFallback.jsx
import React from 'react';
import { WifiOff, BookOpen, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MD3Button } from '../components/Material3';

const OfflineFallback = () => {
  const navigate = useNavigate();

  const handleGoToLibrary = () => {
    navigate('/library');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mx-auto w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <WifiOff size={40} className="text-gray-600 dark:text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This content isn't available offline. Download books to your device to read them without an internet connection.
        </p>

        {/* Tips */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 text-left border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Download size={16} />
            How to read offline:
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              <span>Open a book while online</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              <span>Click the download icon to save it for offline reading</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              <span>Your notes and progress will sync when you reconnect</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <MD3Button
            variant="filled"
            onClick={handleRetry}
            className="w-full sm:w-auto"
          >
            Retry
          </MD3Button>

          <MD3Button
            variant="outlined"
            onClick={handleGoToLibrary}
            icon={<BookOpen size={18} />}
            className="w-full sm:w-auto"
          >
            Go to Library
          </MD3Button>
        </div>

        {/* Network Status */}
        <div className="mt-8 text-xs text-gray-500 dark:text-gray-500">
          <p>You'll be automatically redirected when connection is restored</p>
        </div>
      </div>
    </div>
  );
};

export default OfflineFallback;
