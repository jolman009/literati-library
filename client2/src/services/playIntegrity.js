// src/services/playIntegrity.js
// Play Integrity API integration for Android TWA
import API from '../config/api';

/**
 * Play Integrity service for verifying app integrity on Android.
 *
 * This service communicates with the native Android layer via the
 * IntegrityBridge JavaScript interface exposed by the TWA.
 *
 * Flow:
 * 1. Request a nonce from the backend
 * 2. Use the nonce to request an integrity token from Android
 * 3. Send the token to the backend for verification
 * 4. Backend decodes the token via Google's API and returns the verdict
 *
 * Usage:
 * ```javascript
 * import { verifyIntegrity, isAndroidTWA } from './services/playIntegrity';
 *
 * if (isAndroidTWA()) {
 *   const result = await verifyIntegrity();
 *   if (result.verified) {
 *     console.log('Device is genuine');
 *   }
 * }
 * ```
 */

/**
 * Check if the app is running inside an Android TWA with integrity support.
 * @returns {boolean}
 */
export function isAndroidTWA() {
  return typeof window !== 'undefined' && typeof window.IntegrityBridge !== 'undefined';
}

/**
 * Check if Play Integrity is available on the device.
 * @returns {boolean}
 */
export function isIntegrityAvailable() {
  if (!isAndroidTWA()) {
    return false;
  }

  try {
    return window.IntegrityBridge.isAvailable();
  } catch (error) {
    console.warn('[PlayIntegrity] Error checking availability:', error);
    return false;
  }
}

/**
 * Get the native app version from Android.
 * @returns {string|null}
 */
export function getNativeAppVersion() {
  if (!isAndroidTWA()) {
    return null;
  }

  try {
    return window.IntegrityBridge.getAppVersion();
  } catch (error) {
    console.warn('[PlayIntegrity] Error getting app version:', error);
    return null;
  }
}

/**
 * Verify the integrity of the device and app.
 *
 * @returns {Promise<IntegrityResult>}
 */
export async function verifyIntegrity() {
  // Check if we're running in Android TWA
  if (!isAndroidTWA()) {
    return {
      verified: false,
      error: 'Not running in Android TWA',
      code: 'NOT_ANDROID_TWA'
    };
  }

  // Check if Play Integrity is available
  if (!isIntegrityAvailable()) {
    return {
      verified: false,
      error: 'Play Integrity not available on this device',
      code: 'INTEGRITY_NOT_AVAILABLE'
    };
  }

  try {
    // Step 1: Get a nonce from the backend
    console.warn('[PlayIntegrity] Requesting nonce from backend...');
    const nonceResponse = await API.post('/api/integrity/nonce');
    const { nonce } = nonceResponse.data;

    if (!nonce) {
      return {
        verified: false,
        error: 'Failed to get nonce from server',
        code: 'NONCE_FETCH_FAILED'
      };
    }

    console.warn('[PlayIntegrity] Nonce received, requesting token from Android...');

    // Step 2: Request integrity token from Android
    const tokenResultJson = window.IntegrityBridge.requestTokenSync(nonce);
    const tokenResult = JSON.parse(tokenResultJson);

    if (!tokenResult.success) {
      console.warn('[PlayIntegrity] Android token request failed:', tokenResult.message);
      return {
        verified: false,
        error: tokenResult.message,
        code: `ANDROID_ERROR_${tokenResult.errorCode}`
      };
    }

    console.warn('[PlayIntegrity] Token received, sending to backend for verification...');

    // Step 3: Send token to backend for verification
    const verifyResponse = await API.post('/api/integrity/verify', {
      token: tokenResult.token,
      nonce
    });

    const { verified, verdict, error, code } = verifyResponse.data;

    if (verified) {
      console.warn('[PlayIntegrity] Verification successful');
      return {
        verified: true,
        verdict
      };
    } else {
      console.warn('[PlayIntegrity] Verification failed:', error);
      return {
        verified: false,
        error: error || 'Verification failed',
        code: code || 'VERIFICATION_FAILED'
      };
    }

  } catch (error) {
    console.error('[PlayIntegrity] Error during verification:', error);

    // Handle specific error types
    if (error.response?.status === 401) {
      return {
        verified: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      };
    }

    if (error.response?.data?.code) {
      return {
        verified: false,
        error: error.response.data.error || 'Verification failed',
        code: error.response.data.code
      };
    }

    return {
      verified: false,
      error: error.message || 'Unknown error during integrity check',
      code: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Analyze the integrity verdict.
 *
 * @param {Object} verdict - The verdict from the backend
 * @returns {Object} Analysis of the verdict
 */
export function analyzeVerdict(verdict) {
  if (!verdict) {
    return {
      isGenuine: false,
      reason: 'No verdict provided'
    };
  }

  const deviceIntegrity = verdict.deviceIntegrity?.deviceRecognitionVerdict || [];
  const appIntegrity = verdict.appIntegrity;
  const accountDetails = verdict.accountDetails;

  // Check device integrity
  const hasBasicIntegrity = deviceIntegrity.includes('MEETS_BASIC_INTEGRITY');
  const hasDeviceIntegrity = deviceIntegrity.includes('MEETS_DEVICE_INTEGRITY');
  const hasStrongIntegrity = deviceIntegrity.includes('MEETS_STRONG_INTEGRITY');

  // Check app integrity
  const isAppRecognized = appIntegrity?.appRecognitionVerdict === 'PLAY_RECOGNIZED';
  const isAppLicensed = appIntegrity?.appLicensingVerdict === 'LICENSED';

  // Check account
  const hasLicensedAccount = accountDetails?.appLicensingVerdict === 'LICENSED';

  return {
    isGenuine: hasBasicIntegrity && isAppRecognized,
    deviceIntegrity: {
      basic: hasBasicIntegrity,
      device: hasDeviceIntegrity,
      strong: hasStrongIntegrity,
      raw: deviceIntegrity
    },
    appIntegrity: {
      recognized: isAppRecognized,
      licensed: isAppLicensed,
      packageName: appIntegrity?.packageName,
      versionCode: appIntegrity?.versionCode
    },
    accountDetails: {
      licensed: hasLicensedAccount
    },
    recommendations: generateRecommendations(deviceIntegrity, appIntegrity)
  };
}

/**
 * Generate recommendations based on the verdict.
 * @private
 */
function generateRecommendations(deviceIntegrity, appIntegrity) {
  const recommendations = [];

  if (!deviceIntegrity?.includes('MEETS_BASIC_INTEGRITY')) {
    recommendations.push('Device may be rooted or running a custom ROM');
  }

  if (!deviceIntegrity?.includes('MEETS_DEVICE_INTEGRITY')) {
    recommendations.push('Device may be an emulator or have an unlocked bootloader');
  }

  if (appIntegrity?.appRecognitionVerdict === 'UNRECOGNIZED_VERSION') {
    recommendations.push('App version is not recognized - may be modified');
  }

  if (appIntegrity?.appRecognitionVerdict === 'UNEVALUATED') {
    recommendations.push('App not yet evaluated - this is normal during closed testing');
  }

  return recommendations;
}

/**
 * @typedef {Object} IntegrityResult
 * @property {boolean} verified - Whether the verification was successful
 * @property {Object} [verdict] - The integrity verdict (if verified)
 * @property {string} [error] - Error message (if not verified)
 * @property {string} [code] - Error code (if not verified)
 */

export default {
  isAndroidTWA,
  isIntegrityAvailable,
  getNativeAppVersion,
  verifyIntegrity,
  analyzeVerdict
};
