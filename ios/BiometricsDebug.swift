import Foundation

public class BiometricsDebug{
    /**
     * Logs a debug message if debug mode is enabled
     * - Parameter message: The message to log
     */
    public static func debugLog(_ message: String) {
        if isDebugModeEnabled() {
            debugPrint("[ReactNativeBiometrics Debug] \(message)")
        }
    }
    
    /**
     * Checks if debug mode is enabled
     * - Returns: True if debug mode is enabled, false otherwise
     */
    static func isDebugModeEnabled() -> Bool {
        return UserDefaults.standard.bool(forKey: "BiometricsDebugMode")
    }
}
