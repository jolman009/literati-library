import React, { useEffect, useState } from 'react';

const WindowControlsOverlay = ({ children }) => {
  const [titleBarArea, setTitleBarArea] = useState(null);
  const [isWCOEnabled, setIsWCOEnabled] = useState(false);

  useEffect(() => {
    if ('windowControlsOverlay' in navigator) {
      const updateTitleBarArea = () => {
        const { visible, width, height } = navigator.windowControlsOverlay;
        setIsWCOEnabled(visible);
        if (visible) {
          setTitleBarArea({ width, height });
        }
      };

      updateTitleBarArea();
      navigator.windowControlsOverlay.addEventListener(
        'geometrychange',
        updateTitleBarArea
      );

      return () => {
        navigator.windowControlsOverlay.removeEventListener(
          'geometrychange',
          updateTitleBarArea
        );
      };
    }
  }, []);

  return (
    <div className="min-h-screen">
      {isWCOEnabled && titleBarArea && (
        <div 
          className="fixed top-0 left-0 right-0 bg-blue-600 text-white flex items-center px-4"
          style={{ 
            height: `${titleBarArea.height}px`,
            paddingRight: `${titleBarArea.width}px`
          }}
        >
          <h1 className="text-lg font-semibold">Library App</h1>
        </div>
      )}
      <div 
        className={isWCOEnabled && titleBarArea ? 'pt-10' : ''}
      >
        {children}
      </div>
    </div>
  );
};

export default WindowControlsOverlay;