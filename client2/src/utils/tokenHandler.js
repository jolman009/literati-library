// Token expiration handler utility
// Tokens are now in httpOnly cookies — detect expiry from server error responses
export const handleTokenExpiration = (error, logout) => {
  const msg = error?.message || '';
  if (error.name === 'TokenExpiredError' ||
      msg.includes('jwt expired') ||
      msg.includes('Token verification failed') ||
      msg.includes('401') ||
      msg.includes('Session expired')) {

    console.warn('Token expired, logging out...');
    logout();
    return true; // Token was expired
  }
  return false; // Not a token expiration error
};
