package org.shelfquest.app.integrity

import android.content.Context
import android.util.Log
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import com.google.android.gms.tasks.Task
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * PlayIntegrityManager handles Google Play Integrity API integration.
 *
 * This manager provides methods to request integrity tokens from Google Play
 * and send them to your backend server for verification.
 *
 * Usage:
 * ```kotlin
 * val integrityManager = PlayIntegrityManager(context)
 *
 * // Request an integrity token
 * val result = integrityManager.requestIntegrityToken("your-nonce-here")
 *
 * when (result) {
 *     is IntegrityResult.Success -> {
 *         // Send result.token to your backend for verification
 *     }
 *     is IntegrityResult.Error -> {
 *         // Handle error: result.errorCode, result.message
 *     }
 * }
 * ```
 *
 * Note: During Closed Testing, some integrity verdicts may return UNEVALUATED.
 * This is normal and will provide full verdicts once the app reaches production.
 */
class PlayIntegrityManager(private val context: Context) {

    companion object {
        private const val TAG = "PlayIntegrityManager"

        // Google Cloud Project Number
        // Found in Play Console > App integrity > Link a Cloud project
        private const val CLOUD_PROJECT_NUMBER = 238686787681L
    }

    private val integrityManager by lazy {
        IntegrityManagerFactory.create(context)
    }

    /**
     * Represents the result of an integrity token request.
     */
    sealed class IntegrityResult {
        /**
         * Successful token request.
         * @param token The integrity token to send to your backend for verification.
         */
        data class Success(val token: String) : IntegrityResult()

        /**
         * Failed token request.
         * @param errorCode The error code from Play Integrity API.
         * @param message A human-readable error message.
         */
        data class Error(val errorCode: Int, val message: String) : IntegrityResult()
    }

    /**
     * Requests an integrity token from the Play Integrity API.
     *
     * @param nonce A unique, one-time use string to prevent replay attacks.
     *              Should be generated server-side and be at least 16 characters.
     *              The nonce should be Base64-encoded (URL-safe, no padding).
     * @return IntegrityResult containing either the token or an error.
     */
    suspend fun requestIntegrityToken(nonce: String): IntegrityResult {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Requesting integrity token...")

                val tokenRequestBuilder = IntegrityTokenRequest.builder()
                    .setNonce(nonce)

                // Only set cloud project number if configured
                if (CLOUD_PROJECT_NUMBER > 0) {
                    tokenRequestBuilder.setCloudProjectNumber(CLOUD_PROJECT_NUMBER)
                }

                val tokenResponse = integrityManager
                    .requestIntegrityToken(tokenRequestBuilder.build())
                    .await()

                val token = tokenResponse.token()
                Log.d(TAG, "Successfully obtained integrity token")

                IntegrityResult.Success(token)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to get integrity token", e)
                val errorCode = extractErrorCode(e)
                IntegrityResult.Error(
                    errorCode = errorCode,
                    message = getErrorMessage(errorCode, e)
                )
            }
        }
    }

    /**
     * Extension function to convert Google Play Task to a suspending function.
     */
    private suspend fun <T> Task<T>.await(): T {
        return suspendCancellableCoroutine { continuation ->
            addOnSuccessListener { result ->
                continuation.resume(result)
            }
            addOnFailureListener { exception ->
                continuation.resumeWithException(exception)
            }
            addOnCanceledListener {
                continuation.cancel()
            }
        }
    }

    /**
     * Extracts error code from exception.
     */
    private fun extractErrorCode(e: Exception): Int {
        val message = e.message ?: return IntegrityErrorCodes.UNKNOWN
        return when {
            "API_NOT_AVAILABLE" in message -> IntegrityErrorCodes.API_NOT_AVAILABLE
            "PLAY_STORE_NOT_FOUND" in message -> IntegrityErrorCodes.PLAY_STORE_NOT_FOUND
            "NETWORK_ERROR" in message -> IntegrityErrorCodes.NETWORK_ERROR
            "PLAY_STORE_ACCOUNT_NOT_FOUND" in message -> IntegrityErrorCodes.PLAY_STORE_ACCOUNT_NOT_FOUND
            "APP_NOT_INSTALLED" in message -> IntegrityErrorCodes.APP_NOT_INSTALLED
            "PLAY_SERVICES_NOT_FOUND" in message -> IntegrityErrorCodes.PLAY_SERVICES_NOT_FOUND
            "APP_UID_MISMATCH" in message -> IntegrityErrorCodes.APP_UID_MISMATCH
            "TOO_MANY_REQUESTS" in message -> IntegrityErrorCodes.TOO_MANY_REQUESTS
            "CANNOT_BIND_TO_SERVICE" in message -> IntegrityErrorCodes.CANNOT_BIND_TO_SERVICE
            "NONCE_TOO_SHORT" in message -> IntegrityErrorCodes.NONCE_TOO_SHORT
            "NONCE_TOO_LONG" in message -> IntegrityErrorCodes.NONCE_TOO_LONG
            "GOOGLE_SERVER_UNAVAILABLE" in message -> IntegrityErrorCodes.GOOGLE_SERVER_UNAVAILABLE
            "NONCE_IS_NOT_BASE64" in message -> IntegrityErrorCodes.NONCE_IS_NOT_BASE64
            "CLOUD_PROJECT_NUMBER_IS_INVALID" in message -> IntegrityErrorCodes.CLOUD_PROJECT_NUMBER_IS_INVALID
            else -> IntegrityErrorCodes.UNKNOWN
        }
    }

    /**
     * Returns a human-readable error message based on error code.
     */
    private fun getErrorMessage(errorCode: Int, e: Exception): String {
        return when (errorCode) {
            IntegrityErrorCodes.API_NOT_AVAILABLE -> "Play Integrity API is not available on this device"
            IntegrityErrorCodes.PLAY_STORE_NOT_FOUND -> "Google Play Store is not installed"
            IntegrityErrorCodes.NETWORK_ERROR -> "Network error. Please check your internet connection"
            IntegrityErrorCodes.PLAY_STORE_ACCOUNT_NOT_FOUND -> "No Google Play Store account found"
            IntegrityErrorCodes.APP_NOT_INSTALLED -> "App is not installed through Google Play Store"
            IntegrityErrorCodes.PLAY_SERVICES_NOT_FOUND -> "Google Play Services is not available"
            IntegrityErrorCodes.APP_UID_MISMATCH -> "App UID mismatch. The app may have been tampered with"
            IntegrityErrorCodes.TOO_MANY_REQUESTS -> "Too many requests. Please try again later"
            IntegrityErrorCodes.CANNOT_BIND_TO_SERVICE -> "Cannot bind to Play Integrity service"
            IntegrityErrorCodes.NONCE_TOO_SHORT -> "Nonce is too short. Must be at least 16 bytes"
            IntegrityErrorCodes.NONCE_TOO_LONG -> "Nonce is too long. Must be at most 500 bytes"
            IntegrityErrorCodes.GOOGLE_SERVER_UNAVAILABLE -> "Google server is temporarily unavailable"
            IntegrityErrorCodes.NONCE_IS_NOT_BASE64 -> "Nonce must be Base64 encoded (URL-safe, no padding)"
            IntegrityErrorCodes.CLOUD_PROJECT_NUMBER_IS_INVALID -> "Cloud project number is invalid"
            else -> "Unknown error: ${e.message}"
        }
    }
}

/**
 * Error codes for Play Integrity API.
 * Reference: https://developer.android.com/google/play/integrity/reference/com/google/android/play/core/integrity/model/IntegrityErrorCode
 */
object IntegrityErrorCodes {
    const val API_NOT_AVAILABLE = -1
    const val PLAY_STORE_NOT_FOUND = -2
    const val NETWORK_ERROR = -3
    const val PLAY_STORE_ACCOUNT_NOT_FOUND = -4
    const val APP_NOT_INSTALLED = -5
    const val PLAY_SERVICES_NOT_FOUND = -6
    const val APP_UID_MISMATCH = -7
    const val TOO_MANY_REQUESTS = -8
    const val CANNOT_BIND_TO_SERVICE = -9
    const val NONCE_TOO_SHORT = -10
    const val NONCE_TOO_LONG = -11
    const val GOOGLE_SERVER_UNAVAILABLE = -12
    const val NONCE_IS_NOT_BASE64 = -13
    const val CLOUD_PROJECT_NUMBER_IS_INVALID = -14
    const val UNKNOWN = -999
}
