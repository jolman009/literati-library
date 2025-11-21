import React, { useState } from 'react';

const NotificationPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Check if Notification API is available
  const notificationSupported = typeof window !== 'undefined' && 
                               'Notification' in window && 
                               Notification.permission === 'default';

  // Don't show if not supported or already decided
  if (!notificationSupported || !isVisible) return null;

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.warn('Notifications enabled');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
    setIsVisible(false);
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 z-40">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">Enable notifications</p>
          <p className="mt-1 text-sm text-gray-600">
            Get notified when new books are available or updates occur
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={handleEnable}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Enable
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;