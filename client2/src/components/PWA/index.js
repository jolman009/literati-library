// Export all PWA components
export { default as InstallPrompt } from './InstallPrompt';
export { default as NotificationPrompt } from './NotificationPrompt';
export { default as OfflineIndicator } from './OfflineIndicator';
export { default as UpdateNotification } from './UpdateNotification';
export { default as WindowControlsOverlay } from './WindowControlsOverlay';

// Import components for default export
import InstallPrompt from './InstallPrompt';
import NotificationPrompt from './NotificationPrompt';
import OfflineIndicator from './OfflineIndicator';
import UpdateNotification from './UpdateNotification';
import WindowControlsOverlay from './WindowControlsOverlay';

// Default export for grouped access
const PWA = {
  InstallPrompt,
  NotificationPrompt,
  OfflineIndicator,
  UpdateNotification,
  WindowControlsOverlay,
};

export default PWA;