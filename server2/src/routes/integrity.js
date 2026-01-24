// src/routes/integrity.js
// Play Integrity API verification endpoints
import express from 'express';
import crypto from 'crypto';

/**
 * Play Integrity verification routes.
 *
 * Flow:
 * 1. Client requests a nonce from /api/integrity/nonce
 * 2. Client uses nonce to request integrity token from Android
 * 3. Client sends token to /api/integrity/verify
 * 4. Server decodes token via Google's API and returns verdict
 *
 * @param {Function} authenticateToken - Authentication middleware
 * @returns {express.Router}
 */
export function integrityRouter(authenticateToken) {
  const router = express.Router();

  // Store nonces temporarily (in production, use Redis or database)
  const nonceStore = new Map();
  const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate a nonce for integrity verification.
   * The nonce should be:
   * - At least 16 bytes (128 bits)
   * - Base64 URL-safe encoded (no padding)
   * - Single-use
   */
  router.post('/nonce', authenticateToken, (req, res) => {
    try {
      // Generate cryptographically secure random bytes
      const randomBytes = crypto.randomBytes(32);

      // Add timestamp and user ID for additional entropy
      const timestamp = Date.now().toString();
      const userId = req.user?.id || 'anonymous';

      // Combine and hash for the final nonce
      const combined = Buffer.concat([
        randomBytes,
        Buffer.from(timestamp),
        Buffer.from(userId)
      ]);

      const hash = crypto.createHash('sha256').update(combined).digest();

      // Base64 URL-safe encoding (required by Play Integrity)
      const nonce = hash.toString('base64url');

      // Store nonce with expiry
      nonceStore.set(nonce, {
        userId: req.user?.id,
        createdAt: Date.now(),
        used: false
      });

      // Clean up expired nonces periodically
      cleanupExpiredNonces();

      console.log(`[Integrity] Nonce generated for user ${req.user?.id}`);

      res.json({
        nonce,
        expiresIn: NONCE_EXPIRY_MS / 1000 // seconds
      });
    } catch (error) {
      console.error('[Integrity] Nonce generation error:', error);
      res.status(500).json({ error: 'Failed to generate nonce' });
    }
  });

  /**
   * Verify an integrity token from the Android app.
   *
   * The token is a JWT that must be decoded by Google's servers.
   * We send it to Google's playintegrity.googleapis.com API.
   */
  router.post('/verify', authenticateToken, async (req, res) => {
    try {
      const { token, nonce } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Integrity token is required' });
      }

      if (!nonce) {
        return res.status(400).json({ error: 'Nonce is required' });
      }

      // Verify nonce is valid and unused
      const nonceData = nonceStore.get(nonce);
      if (!nonceData) {
        return res.status(400).json({
          error: 'Invalid or expired nonce',
          code: 'INVALID_NONCE'
        });
      }

      if (nonceData.used) {
        return res.status(400).json({
          error: 'Nonce has already been used',
          code: 'NONCE_REUSED'
        });
      }

      if (Date.now() - nonceData.createdAt > NONCE_EXPIRY_MS) {
        nonceStore.delete(nonce);
        return res.status(400).json({
          error: 'Nonce has expired',
          code: 'NONCE_EXPIRED'
        });
      }

      // Mark nonce as used
      nonceData.used = true;

      // Decode the integrity token using Google's API
      const verdict = await decodeIntegrityToken(token, nonce);

      if (!verdict.success) {
        console.warn(`[Integrity] Verification failed for user ${req.user?.id}:`, verdict.error);
        return res.status(400).json({
          verified: false,
          error: verdict.error,
          code: verdict.code
        });
      }

      // Log successful verification
      console.log(`[Integrity] Verification successful for user ${req.user?.id}`);
      console.log(`[Integrity] Device verdict:`, verdict.deviceIntegrity);
      console.log(`[Integrity] App verdict:`, verdict.appIntegrity);

      // Return the verdict to the client
      res.json({
        verified: true,
        verdict: {
          requestDetails: verdict.requestDetails,
          appIntegrity: verdict.appIntegrity,
          deviceIntegrity: verdict.deviceIntegrity,
          accountDetails: verdict.accountDetails
        }
      });

    } catch (error) {
      console.error('[Integrity] Verification error:', error);
      res.status(500).json({
        error: 'Failed to verify integrity token',
        code: 'VERIFICATION_ERROR'
      });
    }
  });

  /**
   * Get the current integrity status (for debugging).
   * Only available in non-production environments.
   */
  router.get('/status', authenticateToken, (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    res.json({
      configured: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      activeNonces: nonceStore.size,
      packageName: process.env.ANDROID_PACKAGE_NAME || 'org.shelfquest.app'
    });
  });

  /**
   * Clean up expired nonces from the store.
   */
  function cleanupExpiredNonces() {
    const now = Date.now();
    for (const [nonce, data] of nonceStore.entries()) {
      if (now - data.createdAt > NONCE_EXPIRY_MS) {
        nonceStore.delete(nonce);
      }
    }
  }

  return router;
}

/**
 * Decode an integrity token using Google's Play Integrity API.
 *
 * This requires:
 * 1. A Google Cloud project linked to your Play Console app
 * 2. Play Integrity API enabled in Google Cloud
 * 3. A service account with playintegrity.verifier role
 *
 * @param {string} token - The integrity token from the Android app
 * @param {string} expectedNonce - The nonce we sent to the app
 * @returns {Promise<Object>} The decoded verdict
 */
async function decodeIntegrityToken(token, expectedNonce) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const packageName = process.env.ANDROID_PACKAGE_NAME || 'org.shelfquest.app';

  if (!projectId) {
    console.warn('[Integrity] GOOGLE_CLOUD_PROJECT_ID not configured');
    return {
      success: false,
      error: 'Play Integrity API not configured on server',
      code: 'NOT_CONFIGURED'
    };
  }

  try {
    // Get access token for Google API
    const accessToken = await getGoogleAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to authenticate with Google',
        code: 'AUTH_FAILED'
      };
    }

    // Call Google's decodeIntegrityToken API
    const response = await fetch(
      `https://playintegrity.googleapis.com/v1/${packageName}:decodeIntegrityToken`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          integrityToken: token
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Integrity] Google API error:', response.status, errorData);
      return {
        success: false,
        error: `Google API error: ${response.status}`,
        code: 'GOOGLE_API_ERROR',
        details: errorData
      };
    }

    const data = await response.json();
    const payload = data.tokenPayloadExternal;

    if (!payload) {
      return {
        success: false,
        error: 'Invalid response from Google API',
        code: 'INVALID_RESPONSE'
      };
    }

    // Verify the nonce matches
    if (payload.requestDetails?.nonce !== expectedNonce) {
      return {
        success: false,
        error: 'Nonce mismatch - possible replay attack',
        code: 'NONCE_MISMATCH'
      };
    }

    // Verify the package name
    if (payload.appIntegrity?.packageName !== packageName) {
      return {
        success: false,
        error: 'Package name mismatch',
        code: 'PACKAGE_MISMATCH'
      };
    }

    return {
      success: true,
      requestDetails: payload.requestDetails,
      appIntegrity: payload.appIntegrity,
      deviceIntegrity: payload.deviceIntegrity,
      accountDetails: payload.accountDetails
    };

  } catch (error) {
    console.error('[Integrity] Token decode error:', error);
    return {
      success: false,
      error: error.message,
      code: 'DECODE_ERROR'
    };
  }
}

/**
 * Get a Google API access token using service account credentials.
 *
 * In production, you should use Google's official client library:
 * npm install google-auth-library
 *
 * @returns {Promise<string|null>} The access token
 */
async function getGoogleAccessToken() {
  // Option 1: Use service account key from environment
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      // Parse the service account JSON
      const credentials = JSON.parse(serviceAccountKey);

      // Create JWT for service account authentication
      const jwt = await createServiceAccountJWT(credentials);

      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      if (!response.ok) {
        console.error('[Integrity] Token exchange failed:', response.status);
        return null;
      }

      const data = await response.json();
      return data.access_token;

    } catch (error) {
      console.error('[Integrity] Service account auth error:', error);
      return null;
    }
  }

  // Option 2: Use Application Default Credentials (when running on GCP)
  // This works automatically on Cloud Run, App Engine, etc.
  try {
    // GCP metadata service ONLY accepts HTTP (not HTTPS) - this is by design
    // See: https://cloud.google.com/compute/docs/metadata/overview
    const metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
    // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
    const response = await fetch(metadataUrl, {
      headers: {
        'Metadata-Flavor': 'Google'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
  } catch (error) {
    // Not running on GCP - this is expected locally
  }

  console.warn('[Integrity] No authentication method available');
  return null;
}

/**
 * Create a JWT for service account authentication.
 *
 * @param {Object} credentials - Service account credentials
 * @returns {Promise<string>} The signed JWT
 */
async function createServiceAccountJWT(credentials) {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials.private_key_id
  };

  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
    scope: 'https://www.googleapis.com/auth/playintegrity'
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Sign with the private key
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');

  return `${signatureInput}.${signature}`;
}

export default integrityRouter;
