import ExpoModulesCore
import LocalAuthentication
import Security

public class ExpoBiometricsModule: Module {
    
    
    private lazy var defaultKeyTag: String = {
        let bundleID = Bundle.main.bundleIdentifier ?? "com.expo.biometrics"
        return "\(bundleID).biometricKey"
    }()

    
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
        
        AsyncFunction("createKeysAsync") { () async -> CreateKeysResponse in
            var response = CreateKeysResponse()
            
            guard let publicKey = self.createSecureEnclaveKey(tag: self.defaultKeyTag) else {
                response.error = "Failed to create key pair"
                return response
            }
            
            response.publicKey = publicKey
            response.success = true
            return response
        }
        
        AsyncFunction("deleteKeysAsync") { () -> Bool in
            return self.deleteKey(tag: self.defaultKeyTag)
        }
        
        AsyncFunction("doesKeyExistAsync") { () -> Bool in
            return self.keyExists(tag: self.defaultKeyTag)
        }
        
        
        
        AsyncFunction("createSignatureAsync") { (request: CreateSignatureRequest) async -> CreateSignatureResponse in
            var response = CreateSignatureResponse()
            var warningMessage:String?
            let context = LAContext()
            
            context.localizedCancelTitle = request.cancelLabel
            context.localizedFallbackTitle = request.fallbackLabel
            
            if isFaceIdDevice() {
                let usageDescription = Bundle.main.object(forInfoDictionaryKey: "NSFaceIDUsageDescription")
                
                if usageDescription == nil {
                    warningMessage = "FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`."
                }
            }
            
            
            let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics
            
            if warningMessage != nil {
                // If the warning message is set (NSFaceIDUsageDescription is not configured) then we can't use
                // authentication with biometrics — it would crash, so let's just resolve with no success.
                // We could reject, but we already resolve even if there are any errors, so sadly we would need to introduce a breaking change.
                response.success = false
                response.warning = warningMessage
                return response
            }
            
            do {
                let success = try await self.evaluateBiometricPolicy(
                    context: context,
                    reason: request.promptMessage ?? "Authenticate to sign payload",
                    policy: policy
                )
                
                guard success else {
                    response.error = "User authentication failed or was canceled"
                    return response
                }
                
                if let signature = self.signPayload(tag: self.defaultKeyTag, payload: request.payload, context: context) {
                    response.signature = signature
                    response.success = true
                } else {
                    response.error = "Failed to sign payload"
                }
            } catch {
                response.error = error.localizedDescription
            }
            
            return response
        }
        
        
        AsyncFunction("simplePromptAsync") { (request:SimplePromptRequest) async -> SimplePromptResponse in
            var warningMessage:String?
            let context = LAContext()
            let response = SimplePromptResponse()
            
            let reason = request.promptMessage ?? ""
            let cancelLabel = request.cancelLabel
            let fallbackLabel = request.fallbackLabel
            
            
            if fallbackLabel != nil {
                context.localizedFallbackTitle = fallbackLabel
            }
            
            if cancelLabel != nil {
                context.localizedCancelTitle = cancelLabel
            }
            
            if isFaceIdDevice() {
                let usageDescription = Bundle.main.object(forInfoDictionaryKey: "NSFaceIDUsageDescription")
                
                if usageDescription == nil {
                    warningMessage = "FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`."
                }
            }
            
            if warningMessage != nil {
                // If the warning message is set (NSFaceIDUsageDescription is not configured) then we can't use
                // authentication with biometrics — it would crash, so let's just resolve with no success.
                // We could reject, but we already resolve even if there are any errors, so sadly we would need to introduce a breaking change.
                response.success = false
                response.warning = warningMessage
                return response
            }
            
            let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics
            
            do {
                let success = try await self.evaluateBiometricPolicy(
                    context: context,
                    reason: request.promptMessage ?? "Authenticate to sign payload",
                    policy: policy
                )
                response.success = true
                
                guard success else {
                    response.success = false
                    response.error = "User authentication failed or was canceled"
                    return response
                }
            } catch {
                response.success = false
                response.error = error.localizedDescription
            }
            
            return response
        }
    }
    
    private func evaluateBiometricPolicy(
        context: LAContext,
        reason: String,
        policy: LAPolicy
    ) async throws -> Bool {
        return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Bool, Error>) in
            context.evaluatePolicy(policy, localizedReason: reason) { success, error in
                if let nsError = error as? NSError {
                    let code = convertErrorCode(error: nsError)
                    continuation.resume(throwing: GenericError(code))
                } else {
                    continuation.resume(returning: success)
                }
            }
        }
    }
    
    private func createSecureEnclaveKey(tag: String) -> String? {
        let tagData = tag.data(using: .utf8)!
        
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tagData
        ]
        SecItemDelete(deleteQuery as CFDictionary)
        
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.privateKeyUsage, .biometryAny],
            nil
        ) else {
            return nil
        }
        
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: tagData,
                kSecAttrAccessControl as String: access
            ]
        ]
        
        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            return nil
        }
        
        guard let publicKey = SecKeyCopyPublicKey(privateKey),
              let data = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
            return nil
        }
        return data.base64EncodedString()
    }
    
    private func deleteKey(tag: String) -> Bool {
        let tagData = tag.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tagData
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
    
    private func keyExists(tag: String) -> Bool {
        let tagData = tag.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tagData,
            kSecReturnAttributes as String: true
        ]
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        return status == errSecSuccess
    }
    
    private func signPayload(tag: String, payload: String, context: LAContext) -> String? {
        let tagData = tag.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tagData,
            kSecReturnRef as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let privateKey = item as! SecKey? else {
            return nil
        }
        
        guard let data = payload.data(using: .utf8) else { return nil }
        var error: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(privateKey, .ecdsaSignatureMessageX962SHA256, data as CFData, &error) as Data? else {
            return nil
        }
        
        return signature.base64EncodedString()
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
    case biometric = 3
}


func convertErrorCode(error: NSError) -> String {
    switch error.code {
    case LAError.systemCancel.rawValue:
        return "system_cancel"
    case LAError.appCancel.rawValue:
        return "app_cancel"
    case LAError.biometryLockout.rawValue:
        return "lockout"
    case LAError.userFallback.rawValue:
        return "user_fallback"
    case LAError.userCancel.rawValue:
        return "user_cancel"
    case LAError.biometryNotAvailable.rawValue:
        return "not_available"
    case LAError.invalidContext.rawValue:
        return "invalid_context"
    case LAError.biometryNotEnrolled.rawValue:
        return "not_enrolled"
    case LAError.passcodeNotSet.rawValue:
        return "passcode_not_set"
    case LAError.authenticationFailed.rawValue:
        return "authentication_failed"
    default:
        return "unknown: \(error.code), \(error.localizedDescription)"
    }
}

struct GenericError: LocalizedError {
    let code: String
    
    init(_ code: String) { self.code = code }
    
    var errorDescription: String? {
        return code
    }
}
