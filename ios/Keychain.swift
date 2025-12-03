import Foundation
import Security
import ExpoModulesCore

public func getSignatureAlgorithm(for keyRef: SecKey) -> SecKeyAlgorithm {
    let keyAttributes = SecKeyCopyAttributes(keyRef) as? [String: Any] ?? [:]
    let keyType = keyAttributes[kSecAttrKeyType as String] as? String ?? "Unknown"
    
    return keyType == kSecAttrKeyTypeRSA as String
    ? .rsaSignatureMessagePKCS1v15SHA256
    : .ecdsaSignatureMessageX962SHA256
}

public func generateKeyAlias(customAlias: String? = nil, configuredAlias: String? = nil) -> String {
    if let customAlias = customAlias {
        return customAlias
    }
    if let configuredAlias = configuredAlias {
        return configuredAlias
    }
    
    let bundleId = Bundle.main.bundleIdentifier ?? "unknown"
    return "\(bundleId).ExpoBiometricsKey"
}

public func createKeychainQuery(
    keyTag: String,
    includeSecureEnclave: Bool = true,
    returnRef: Bool = false,
    returnAttributes: Bool = false
) -> [String: Any] {
    guard let keyTagData = keyTag.data(using: .utf8) else { return [:] }
    
    var query: [String: Any] = [
        kSecClass as String: kSecClassKey,
        kSecAttrApplicationTag as String: keyTagData
    ]
    
    if includeSecureEnclave {
        query[kSecAttrTokenID as String] = kSecAttrTokenIDSecureEnclave
    }
    
    if returnRef {
        query[kSecReturnRef as String] = true
    }
    
    if returnAttributes {
        query[kSecReturnAttributes as String] = true
    }
    
    return query
}

public func createBiometricAccessControl(for keyType: BiometricKeyType = .ec256) -> SecAccessControl? {
    if keyType == .rsa2048 {
        return SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.biometryAny],
            nil
        )
    } else {
        return SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.biometryAny, .privateKeyUsage],
            nil
        )
    }
}

public func createKeyGenerationAttributes(
    keyTagData: Data,
    accessControl: SecAccessControl,
    keyType: BiometricKeyType = .ec256
) -> [String: Any] {
    switch keyType {
    case .rsa2048:
        return [
            kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
            kSecAttrKeySizeInBits as String: 2048,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: keyTagData,
                kSecAttrAccessControl as String: accessControl
            ]
        ]
    case .ec256:
        return [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: keyTagData,
                kSecAttrAccessControl as String: accessControl
            ]
        ]
    }
}

public func exportPublicKeyToBase64(_ publicKey: SecKey) -> String? {
    var error: Unmanaged<CFError>?
    guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) else {
        if let cfError = error?.takeRetainedValue() {
            print("Public key export error: \(cfError.localizedDescription)")
        }
        return nil
    }
    return (publicKeyData as Data).base64EncodedString()
}


public enum BiometricKeyType {
    case rsa2048
    case ec256
}
