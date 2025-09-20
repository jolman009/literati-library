import React, { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';

const InstallPrompt = () => {
  const { canInstall, installPWA, isInstalled } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!canInstall || isInstalled || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-xl p-4 border border-gray-200 z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <img src="/icon-72x72.png" alt="App icon" className="w-12 h-12 rounded-lg" loading="lazy"/>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Install Library App</h3>
          <p className="text-sm text-gray-600 mt-1">
            Install our app for offline access and a better experience
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={installPWA}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Install
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors text-sm"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;