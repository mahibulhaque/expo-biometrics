import ExpoModulesCore
import LocalAuthentication
import Security

public class ExpoBiometricsModule: Module {
    
    
    private var defaultKeyTag: String {
        let bundleID = Bundle.main.bundleIdentifier ?? "com.expo.biometrics"
        let timestamp = Int(Date().timeIntervalSince1970)
        return "\(bundleID).biometricKey.\(timestamp)"
    }
    
    public func definition() -> ModuleDefinition {
        Name("ExpoBiometrics")
        
        AsyncFunction("hasHardwareAsync") { () -> Bool in
            let context = LAContext()
            var error: NSError?
            let isSupported: Bool = context.canEvaluatePolicy(
                LAPolicy.deviceOwnerAuthenticationWithBiometrics,
                error: &error
            )
            let isAvailable: Bool =
            isSupported
            || error?.code != LAError.biometryNotAvailable.rawValue
            
            return isAvailable
        }
        
        AsyncFunction("isEnrolledAsync") { () -> Bool in
            let context = LAContext()
            var error: NSError?
            let isSupported: Bool = context.canEvaluatePolicy(
                LAPolicy.deviceOwnerAuthenticationWithBiometrics,
                error: &error
            )
            let isEnrolled: Bool =
            (isSupported && error == nil)
            || error?.code == LAError.biometryLockout.rawValue
            
            return isEnrolled
        }
        
        AsyncFunction("getEnrolledLevelAsync") { () -> Int in
            let context = LAContext()
            var error: NSError?
            
            var level: Int = SecurityLevel.none.rawValue
            
            let isAuthenticationSupported: Bool = context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthentication, error: &error)
            if isAuthenticationSupported && error == nil {
                level = SecurityLevel.secret.rawValue
            }
            
            let isBiometricsSupported: Bool = context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, error: &error)
            
            if isBiometricsSupported && error == nil {
                level = SecurityLevel.biometric.rawValue
            }
            
            return level
        }
        
        AsyncFunction("supportedAuthenticationTypesAsync") { () -> [Int] in
            var supportedAuthenticationTypes: [Int] = []
            
            if isTouchIdDevice() {
                supportedAuthenticationTypes.append(
                    AuthenticationType.fingerprint.rawValue
                )
            }
            
            if isFaceIdDevice() {
                supportedAuthenticationTypes.append(
                    AuthenticationType.facialRecognition.rawValue
                )
            }
            
            return supportedAuthenticationTypes
        }
        
        AsyncFunction("createKeysAsync") { () throws -> [String: Any] in
            guard let publicKey = try KeychainHelper.createSecureEnclaveKey(tag: self.defaultKeyTag) else {
                throw GenericError("Unable to create secure enclave key")
            }
            
            return ["publicKey": publicKey]
        }
        
        AsyncFunction("deleteKeysAsync") { () throws -> Bool in
            try KeychainHelper.deleteKey(tag: self.defaultKeyTag)
            return true
        }
        
        AsyncFunction("doesKeyExistAsync") { () -> Bool in
            return KeychainHelper.keyExists(tag: self.defaultKeyTag)
        }
        
        
        AsyncFunction("createSignatureAsync") { (options:CreateSignatureOptions) async throws -> [String: Any] in
            let context = LAContext()
            let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics
            
            let reason = options.promptMessage ?? ""
            let cancelLabel = options.cancelLabel
            let fallbackLabel = options.fallbackLabel
            
            if fallbackLabel != nil {
                context.localizedFallbackTitle = fallbackLabel
            }
            
            if cancelLabel != nil {
                context.localizedCancelTitle = cancelLabel
            }
            
            let authSuccess:Bool = try await withCheckedThrowingContinuation { continuation in
                context.evaluatePolicy(policy, localizedReason: reason) { success, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                    } else {
                        continuation.resume(returning: success)
                    }
                }
            }
            
            guard authSuccess else {
                throw GenericError("Authentication failed")
            }
            
            let signature = try KeychainHelper.signPayload(tag: self.defaultKeyTag, payload: options.payload, context: context)
            return ["signature": signature]
        }
        
        
        AsyncFunction("simplePromptAsync") { (options:SimplePromptOptions) async throws -> [String: Any] in
            let context = LAContext()
            
            let reason = options.promptMessage ?? ""
            let cancelLabel = options.cancelLabel
            let fallbackLabel = options.fallbackLabel
            
            if fallbackLabel != nil {
                context.localizedFallbackTitle = fallbackLabel
            }
            
            if cancelLabel != nil {
                context.localizedCancelTitle = cancelLabel
            }
            
            let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics
            
            return try await withCheckedThrowingContinuation { continuation in
                context.evaluatePolicy(policy, localizedReason: reason) { success, error in
                    if let error = error {
                        continuation.resume(throwing: error)
                        return
                    }
                    
                    continuation.resume(returning: ["success": success])
                }
            }
        }
    }
}

func isFaceIdDevice() -> Bool {
    let context = LAContext()
    context.canEvaluatePolicy(
        LAPolicy.deviceOwnerAuthenticationWithBiometrics,
        error: nil
    )
    
    return context.biometryType == LABiometryType.faceID
}

func isTouchIdDevice() -> Bool {
    let context = LAContext()
    context.canEvaluatePolicy(
        LAPolicy.deviceOwnerAuthenticationWithBiometrics,
        error: nil
    )
    
    return context.biometryType == LABiometryType.touchID
}

enum AuthenticationType: Int {
    case fingerprint = 1
    case facialRecognition = 2
}

enum SecurityLevel: Int {
    case none = 0
    case secret = 1
    // We return any biometric as strong biometric, because there are currently no iOS devices with weak biometric options.
    case biometric = 3
}
