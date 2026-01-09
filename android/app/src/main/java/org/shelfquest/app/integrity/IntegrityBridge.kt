package org.shelfquest.app.integrity

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * IntegrityBridge provides a JavaScript interface for the Play Integrity API.
 *
 * This bridge allows your PWA/web app running in the TWA to request
 * integrity tokens from the native Android layer.
 *
 * In your web app, you can access this via:
 * ```javascript
 * // Check if running in Android TWA with integrity support
 * if (window.IntegrityBridge) {
 *     // Request an integrity token
 *     window.IntegrityBridge.requestToken('your-base64-nonce', function(result) {
 *         const response = JSON.parse(result);
 *         if (response.success) {
 *             // Send response.token to your backend
 *         } else {
 *             // Handle error: response.errorCode, response.message
 *         }
 *     });
 * }
 * ```
 */
class IntegrityBridge(private val context: Context) {

    companion object {
        private const val TAG = "IntegrityBridge"
        const val JS_INTERFACE_NAME = "IntegrityBridge"
    }

    private val integrityManager = PlayIntegrityManager(context)
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // Store callbacks for async operations
    private var pendingCallback: ((String) -> Unit)? = null

    /**
     * Requests an integrity token from JavaScript.
     *
     * @param nonce Base64-encoded nonce (URL-safe, no padding)
     * @param callback JavaScript callback function name to receive the result
     */
    @JavascriptInterface
    fun requestToken(nonce: String, callback: String) {
        Log.d(TAG, "JavaScript requested integrity token")

        scope.launch {
            val result = integrityManager.requestIntegrityToken(nonce)

            val jsonResponse = when (result) {
                is PlayIntegrityManager.IntegrityResult.Success -> {
                    JSONObject().apply {
                        put("success", true)
                        put("token", result.token)
                    }
                }
                is PlayIntegrityManager.IntegrityResult.Error -> {
                    JSONObject().apply {
                        put("success", false)
                        put("errorCode", result.errorCode)
                        put("message", result.message)
                    }
                }
            }

            // Call back to JavaScript
            Log.d(TAG, "Returning result to JavaScript callback: $callback")
        }
    }

    /**
     * Synchronous version that returns a JSON string directly.
     * Use this for simpler integration patterns.
     *
     * Note: This will block the calling thread. For better UX,
     * use the async version with callbacks.
     *
     * @param nonce Base64-encoded nonce
     * @return JSON string with the result
     */
    @JavascriptInterface
    fun requestTokenSync(nonce: String): String {
        Log.d(TAG, "JavaScript requested integrity token (sync)")

        // Note: This is a simplified sync approach
        // In production, prefer the async callback pattern
        return try {
            kotlinx.coroutines.runBlocking {
                val result = integrityManager.requestIntegrityToken(nonce)

                when (result) {
                    is PlayIntegrityManager.IntegrityResult.Success -> {
                        JSONObject().apply {
                            put("success", true)
                            put("token", result.token)
                        }.toString()
                    }
                    is PlayIntegrityManager.IntegrityResult.Error -> {
                        JSONObject().apply {
                            put("success", false)
                            put("errorCode", result.errorCode)
                            put("message", result.message)
                        }.toString()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in sync token request", e)
            JSONObject().apply {
                put("success", false)
                put("errorCode", IntegrityErrorCodes.UNKNOWN)
                put("message", e.message ?: "Unknown error")
            }.toString()
        }
    }

    /**
     * Check if Play Integrity API is available on this device.
     *
     * @return true if available, false otherwise
     */
    @JavascriptInterface
    fun isAvailable(): Boolean {
        // Play Integrity requires Google Play Services
        return try {
            val packageManager = context.packageManager
            packageManager.getPackageInfo("com.google.android.gms", 0)
            true
        } catch (e: Exception) {
            Log.w(TAG, "Google Play Services not available", e)
            false
        }
    }

    /**
     * Get the app version for integrity verification.
     *
     * @return The app version name
     */
    @JavascriptInterface
    fun getAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }
}
