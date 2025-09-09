// src/components/PWA/UpdateNotification.jsx
import React from 'react';

const UpdateNotification = ({ onUpdate }) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white rounded-lg shadow-xl p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">Update Available!</h3>
          <p className="text-sm mt-1 text-blue-100">
            A new version of the app is available. Update now for the latest features.
          </p>
        </div>
        <button
          onClick={onUpdate}
          className="ml-4 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium flex-shrink-0"
        >
          Update
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;