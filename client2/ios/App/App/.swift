import Foundation
import Capacitor
import LocalAuthentication

/// Native biometric authentication plugin for ShelfQuest
/// Uses iOS LocalAuthentication framework for Face ID / Touch ID
@objc(BiometricAuthPlugin)
public class BiometricAuthPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "BiometricAuthPlugin"
    public let jsName = "BiometricAuth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "checkAvailability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise)
    ]

    /// Check if biometric authentication is available on this device
    @objc func checkAvailability(_ call: CAPPluginCall) {
        let context = LAContext()
        var error: NSError?

        let canEvaluate = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)

        var biometryType = "none"
        if canEvaluate {
            switch context.biometryType {
            case .faceID:
                biometryType = "faceId"
            case .touchID:
                biometryType = "touchId"
            case .opticID:
                biometryType = "opticId"
            @unknown default:
                biometryType = "unknown"
            }
        }

        call.resolve([
            "available": canEvaluate,
            "biometryType": biometryType,
            "errorCode": error?.code ?? 0,
            "errorMessage": error?.localizedDescription ?? ""
        ])
    }

    /// Authenticate user with Face ID or Touch ID
    @objc func authenticate(_ call: CAPPluginCall) {
        let context = LAContext()
        let reason = call.getString("reason") ?? "Sign in to ShelfQuest"

        // Check if biometrics are available
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            call.resolve([
                "success": false,
                "error": "Biometric authentication not available",
                "errorCode": error?.code ?? -1
            ])
            return
        }

        // Perform biometric authentication
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, authError in
            DispatchQueue.main.async {
                if success {
                    call.resolve([
                        "success": true
                    ])
                } else {
                    var errorMessage = "Authentication failed"
                    var errorCode = -1

                    if let laError = authError as? LAError {
                        errorCode = laError.code.rawValue
                        switch laError.code {
                        case .userCancel:
                            errorMessage = "cancelled"
                        case .userFallback:
                            errorMessage = "fallback"
                        case .biometryLockout:
                            errorMessage = "lockout"
                        case .biometryNotAvailable:
                            errorMessage = "not_available"
                        case .biometryNotEnrolled:
                            errorMessage = "not_enrolled"
                        default:
                            errorMessage = laError.localizedDescription
                        }
                    }

                    call.resolve([
                        "success": false,
                        "error": errorMessage,
                        "errorCode": errorCode
                    ])
                }
            }
        }
    }
}
