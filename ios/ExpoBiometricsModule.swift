import ExpoModulesCore
import LocalAuthentication
import Security

public class ExpoBiometricsModule: Module {
    
    private var configuredKeyAlias: String? =  UserDefaults.standard.string(forKey: "ExpoBiometricsKeyAlias")
    
    
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
        
        AsyncFunction("deleteKeysAsync") { (request:DeleteKeysRequest, promise:Promise) in
            let keyAlias = request.keyAlias
            let keyTag = getKeyAlias(keyAlias)
            
            // Query to find the key
            let query = createKeychainQuery(keyTag: keyTag, includeSecureEnclave: false)
            
            // Check if key exists first
            let checkStatus = SecItemCopyMatching(query as CFDictionary, nil)
            
            if checkStatus == errSecItemNotFound {
                print("No key found with tag '\(keyTag)' - nothing to delete")
                promise.resolve(["success": true])
                return
            }
            
            // Delete the key
            let deleteStatus = SecItemDelete(query as CFDictionary)
            
            switch deleteStatus {
            case errSecSuccess:
                print("Key with tag '\(keyTag)' deleted successfully")
                
                // Verify deletion
                let verifyStatus = SecItemCopyMatching(query as CFDictionary, nil)
                if verifyStatus == errSecItemNotFound {
                    print("Keys deleted and verified successfully")
                    promise.resolve(["success": true])
                } else {
                    print("deleteKeys failed - Key still exists after deletion attempt")
                    handleError(.keyDeletionFailed, promise:promise)
                }
                
            case errSecItemNotFound:
                print("No key found with tag '\(keyTag)' - nothing to delete")
                promise.resolve(["success": true])
                
            default:
                print("deleteKeys failed - Keychain error: status \(deleteStatus)")
                let biometricsError = BiometricsError.fromOSStatus(deleteStatus)
                handleError(biometricsError, promise: promise)
            }
            
            
        }
        
        AsyncFunction("doesKeyExistAsync") { (request:DoesKeyExistRequest, promise:Promise) in
            let keyAlias = request.keyAlias
            let keyTag = getKeyAlias(keyAlias)
            
            // Query to find the key (including Secure Enclave token for proper key lookup)
            let query = createKeychainQuery(
                keyTag: keyTag,
                includeSecureEnclave: true,
                returnRef: true,
                returnAttributes: true
            )
            
            var result: CFTypeRef?
            let status = SecItemCopyMatching(query as CFDictionary, &result)
            
            
            
            promise.resolve(["keyExists":status==errSecSuccess])
            return
        }
        
        AsyncFunction("createKeysAsync") { (request:CreateKeysRequest, promise:Promise) in
            let keyAlias = request.keyAlias
            let keyType = request.keyType
            let keyTag = getKeyAlias(keyAlias as String?)
            guard let keyTagData = keyTag.data(using: .utf8) else {
                handleError(.dataEncodingFailed, promise: promise)
                return
            }
            
            let biometricKeyType: BiometricKeyType
            if let keyTypeString = keyType as String?, keyTypeString.lowercased() == "rsa2048" {
                biometricKeyType = .rsa2048
            } else {
                biometricKeyType = .ec256
            }
            
            // Delete existing key if it exists
            // For RSA keys, we need to delete without Secure Enclave attributes
            // For EC keys, we include Secure Enclave attributes
            let deleteQuery = createKeychainQuery(keyTag: keyTag, includeSecureEnclave: biometricKeyType == .ec256)
            SecItemDelete(deleteQuery as CFDictionary)
            
            // Also try deleting without Secure Enclave attributes for RSA keys to ensure cleanup
            if biometricKeyType == .rsa2048 {
                let fallbackDeleteQuery = createKeychainQuery(keyTag: keyTag, includeSecureEnclave: false)
                SecItemDelete(fallbackDeleteQuery as CFDictionary)
            }
            
            // Create access control for biometric authentication
            guard let accessControl = createBiometricAccessControl(for: biometricKeyType) else {
                handleError(.accessControlCreationFailed, promise: promise)
                return
            }
            
            // Key generation parameters
            let keyAttributes = createKeyGenerationAttributes(keyTagData: keyTagData, accessControl: accessControl, keyType: biometricKeyType)
            
            
            var error: Unmanaged<CFError>?
            guard let privateKey = SecKeyCreateRandomKey(keyAttributes as CFDictionary, &error) else {
                let biometricsError = BiometricsError.keyCreationFailed
                if let cfError = error?.takeRetainedValue() {
                    print("createKeys failed - Key generation error: \(cfError.localizedDescription)")
                } else {
                    print("createKeys failed - Key generation error: Unknown")
                }
                handleError(biometricsError, promise: promise)
                return
            }
            
            // Get public key
            guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
                print("createKeys failed - Could not extract public key")
                handleError(.publicKeyExtractionFailed,promise: promise)
                return
            }
            
            // Export public key
            guard let publicKeyBase64 = exportPublicKeyToBase64(publicKey) else {
                print("createKeys failed - Public key export error")
                handleError(.keyExportFailed, promise: promise)
                return
            }
            
            
            promise.resolve([
                "success":true,
                "publicKey":publicKeyBase64
            ])
        }
        
        
        
        
        
        AsyncFunction("createSignatureAsync") { (request: CreateSignatureRequest) async -> CreateSignatureResponse in
            var response = CreateSignatureResponse()
            var warningMessage: String?
            
            // Initialize biometric context
            let context = LAContext()
            context.localizedCancelTitle = request.cancelLabel
            context.localizedFallbackTitle = request.fallbackLabel
            
            // Validate Face ID usage description
            if isFaceIdDevice() {
                let usageDescription = Bundle.main.object(forInfoDictionaryKey: "NSFaceIDUsageDescription")
                if usageDescription == nil {
                    warningMessage = "FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription` in Info.plist."
                }
            }
            
            if let warning = warningMessage {
                response.success = false
                response.warning = warning
                return response
            }
            
            let policy = LAPolicy.deviceOwnerAuthenticationWithBiometrics
            let reason = request.promptMessage ?? "Authenticate to sign payload"
            
            do {
                // 1️⃣ Always show biometric prompt before signing
                let success = try await self.evaluateBiometricPolicy(context: context, reason: reason, policy: policy)
                
                guard success else {
                    response.success = false
                    response.error = "User canceled or failed biometric authentication."
                    return response
                }
                
                // 2️⃣ Retrieve Secure Enclave key
                let keyTag = getKeyAlias(request.keyAlias)
                let query = createKeychainQuery(
                    keyTag: keyTag,
                    includeSecureEnclave: true,
                    returnRef: true
                )
                
                var keyResult: CFTypeRef?
                let status = SecItemCopyMatching(query as CFDictionary, &keyResult)
                guard status == errSecSuccess, let keyRef = (keyResult as! SecKey?) else {
                    response.success = false
                    response.error = "Failed to retrieve Secure Enclave key."
                    return response
                }
                
                // 3️⃣ Create digital signature
                guard let dataToSign = request.payload.data(using: .utf8) else {
                    response.success = false
                    response.error = "Invalid payload data."
                    return response
                }
                
                let algorithm = getSignatureAlgorithm(for: keyRef)
                var signingError: Unmanaged<CFError>?
                guard let signature = SecKeyCreateSignature(keyRef, algorithm, dataToSign as CFData, &signingError) else {
                    if let cfError = signingError?.takeRetainedValue() {
                        let code = CFErrorGetCode(cfError)
                        if code == errSecUserCanceled {
                            response.error = "User canceled biometric prompt."
                        } else if code == errSecAuthFailed {
                            response.error = "Biometric authentication failed."
                        } else {
                            response.error = "Signature creation failed: \(cfError.localizedDescription)"
                        }
                    } else {
                        response.error = "Unknown error while creating signature."
                    }
                    response.success = false
                    return response
                }
                
                // 4️⃣ Return Base64 signature
                response.signature = (signature as Data).base64EncodedString()
                response.success = true
                
            } catch {
                response.success = false
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
    
    private func getKeyAlias(_ customAlias: String? = nil) -> String {
        return generateKeyAlias(customAlias: customAlias, configuredAlias: configuredKeyAlias)
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
