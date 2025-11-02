// Utility to clear expired tokens - run this once to fix the immediate issue
import environmentConfig from '../config/environment.js';

export const clearExpiredToken = () => {
  try {
    const tokenKey = environmentConfig.getTokenKey();
    const token = localStorage.getItem(tokenKey);
    
    if (token) {
      // Try to decode the token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (now >= exp) {
        console.log('Token is expired, clearing...');
        localStorage.removeItem(tokenKey);
        localStorage.removeItem('shelfquest_user');
        
        // Reload the page to reset the app state
        window.location.reload();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking token:', error);
    // If we can't parse the token, it's probably invalid
    const tokenKey = environmentConfig.getTokenKey();
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('shelfquest_user');
    window.location.reload();
    return true;
  }
};

// Call this function immediately when the app loads
if (typeof window !== 'undefined') {
  clearExpiredToken();
}
