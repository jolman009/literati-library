// Token expiration handler utility
export const handleTokenExpiration = (error, logout) => {
  if (error.name === 'TokenExpiredError' || 
      error.message.includes('jwt expired') ||
      error.message.includes('Token verification failed')) {
    
    console.warn('Token expired, logging out...');
    logout();
    
    // Optional: Show user-friendly message
    alert('Your session has expired. Please log in again.');
    
    return true; // Token was expired
  }
  return false; // Not a token expiration error
};

// Check if token is close to expiring (optional)
export const isTokenNearExpiry = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = exp - now;
    
    // Return true if token expires in less than 5 minutes
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (_error) {
    return true; // If we can't parse, assume expired
  }
};