import ExpoModulesCore
import LocalAuthentication

public class ExpoBiometricsModule: Module {
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
