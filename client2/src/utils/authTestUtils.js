/**
 * Authentication Testing Utilities
 *
 * DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION
 *
 * These utilities help test the HttpOnly cookie authentication flow,
 * particularly the automatic token refresh mechanism.
 */

/**
 * Test automatic token refresh by making an API call that should trigger refresh
 *
 * Usage in browser console:
 * 1. Import this module in a component temporarily
 * 2. Call window.testTokenRefresh()
 * 3. Watch the console for refresh messages
 */
export function testTokenRefresh() {
  console.log('🧪 Testing automatic token refresh...');
  console.log('📝 Instructions:');
  console.log('1. Delete the accessToken cookie manually in DevTools');
  console.log('2. Make any API call (navigate to a page, refresh, etc.)');
  console.log('3. Watch for automatic refresh in console');
  console.log('4. Verify new accessToken appears in cookies');

  return {
    instructions: 'Delete accessToken cookie in DevTools → Application → Cookies, then navigate to trigger API call',
    expected: [
      '🔄 Token expired/invalid → attempting refresh',
      '🔄 Attempting token refresh via cookies...',
      '✅ Token refresh successful - new cookies set automatically',
      '🔄 Retrying original request with refreshed cookies'
    ]
  };
}

/**
 * Quick authentication status check
 */
export function checkAuthStatus() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  // Note: HttpOnly cookies won't be visible here, but we can check other indicators
  const userDataRaw = localStorage.getItem('literati_user');
  const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

  console.log('🔍 Auth Status Check:');
  console.log('User data in localStorage:', userData ? '✅ Present' : '❌ Missing');
  console.log('User:', userData);
  console.log('⚠️ Note: HttpOnly cookies are not visible to JavaScript (this is correct!)');
  console.log('To view auth cookies, use DevTools → Application → Cookies');

  return {
    hasUserData: !!userData,
    user: userData,
    note: 'HttpOnly cookies are hidden from JavaScript - check DevTools'
  };
}

/**
 * Test logout flow
 */
export async function testLogout() {
  console.log('🧪 Testing logout flow...');

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Logout API call successful:', data);
      console.log('📝 Check DevTools → Cookies to verify both tokens were cleared');
      return data;
    } else {
      console.error('❌ Logout failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Logout error:', error);
  }
}

// Expose to window for easy console testing
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.authTestUtils = {
    testTokenRefresh,
    checkAuthStatus,
    testLogout,
  };
  console.log('🧪 Auth test utilities loaded. Available commands:');
  console.log('  - window.authTestUtils.checkAuthStatus()');
  console.log('  - window.authTestUtils.testTokenRefresh()');
  console.log('  - window.authTestUtils.testLogout()');
}

export default {
  testTokenRefresh,
  checkAuthStatus,
  testLogout,
};
