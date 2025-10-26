import { Platform } from 'expo-modules-core';

export type BiometricAuthenticationResult =
	| { success: true }
	| {
			success: false;
			error: BiometricAuthenticationError;
			warning?: string;
	  };

export enum AuthenticationType {
	/**
	 * Indicates fingerprint support.
	 */
	FINGERPRINT = 1,
	/**
	 * Indicates facial recognition support.
	 */
	FACIAL_RECOGNITION = 2,
	/**
	 * Indicates iris recognition support.
	 * @platform android
	 */
	IRIS = 3,
}

export enum SecurityLevel {
	/**
	 * Indicates no enrolled authentication.
	 */
	NONE = 0,
	/**
	 * Indicates non-biometric authentication (e.g. PIN, Pattern).
	 */
	SECRET = 1,
	/**
	 * Indicates biometric authentication.
	 * @deprecated please use `BIOMETRIC_STRONG` or `BIOMETRIC_WEAK` instead.
	 * @hidden
	 */
	BIOMETRIC = Platform.OS === 'android'
		? SecurityLevel.BIOMETRIC_WEAK
		: SecurityLevel.BIOMETRIC_STRONG,
	/**
	 * Indicates weak biometric authentication. For example, a 2D image-based face unlock.
	 * > There are currently no weak biometric authentication options on iOS.
	 */
	BIOMETRIC_WEAK = 2,
	/**
	 * Indicates strong biometric authentication. For example, a fingerprint scan or 3D face unlock.
	 */
	BIOMETRIC_STRONG = 3,
}

Object.defineProperty(SecurityLevel, 'BIOMETRIC', {
	get() {
		const additionalMessage =
			Platform.OS === 'android'
				? '. `SecurityLevel.BIOMETRIC` is currently an alias for `SecurityLevel.BIOMETRIC_WEAK` on Android, which might lead to unexpected behaviour.'
				: '';
		console.warn(
			'`SecurityLevel.BIOMETRIC` has been deprecated. Use `SecurityLevel.BIOMETRIC_WEAK` or `SecurityLevel.BIOMETRIC_STRONG` instead' +
				additionalMessage,
		);
		return Platform.OS === 'android'
			? SecurityLevel.BIOMETRIC_WEAK
			: SecurityLevel.BIOMETRIC_STRONG;
	},
});

/**
 * Security level of the biometric authentication to allow.
 * @platform android
 */
export type BiometricsSecurityLevel = 'weak' | 'strong';

export type BiometricAuthenticationOptions = {
	/**
	 * A message that is shown alongside the TouchID or FaceID prompt.
	 */
	promptMessage?: string;
	/**
	 * A subtitle displayed below the prompt message in the authentication prompt.
	 * @platform android
	 */
	promptSubtitle?: string;
	/**
	 * A description displayed in the middle of the authentication prompt.
	 * @platform android
	 */
	promptDescription?: string;
	/**
	 * Allows customizing the default `Cancel` label shown.
	 */
	cancelLabel?: string;
	/**
	 * Sets a hint to the system for whether to require user confirmation after authentication.
	 * This may be ignored by the system if the user has disabled implicit authentication in Settings
	 * or if it does not apply to a particular biometric modality. Defaults to `true`.
	 * @platform android
	 */
	requireConfirmation?: boolean;
	/**
	 * Allows to customize the default `Use Passcode` label shown after several failed
	 * authentication attempts. Setting this option to an empty string disables this button from
	 * showing in the prompt.
	 * @platform ios
	 */
	fallbackLabel?: string;
};

export type CreateSignatureRequest = BiometricAuthenticationOptions & {
	/**
	 * `Payload` property is required in order to generate the encrypted signature.
	 */
	payload: string;
	keyAlias?: string;
};

export type CreateSignatureResponse = {
	signature: string;
	success: boolean;
	error?: string;
	/**
	 * the warning message is set (NSFaceIDUsageDescription is not configured) then we can't use authentication with biometrics
	 * @platform ios
	 */
	warning?: string;
};

export type SimplePromptRequest = BiometricAuthenticationOptions & {};

export type SimplePromptResponse = {
	success: boolean;
	error?: string;
	/**
	 * the warning message is set (NSFaceIDUsageDescription is not configured) then we can't use authentication with biometrics
	 * @platform ios
	 */
	warning?: string;
};

export type CreateKeysResponse = {
	publicKey: string;
	success: boolean;
	error?: string;
};

/**
 * One of the error values returned by the [`LocalAuthenticationResult`](#localauthenticationresult) object.
 */
export type BiometricAuthenticationError =
	| 'not_enrolled'
	| 'user_cancel'
	| 'app_cancel'
	| 'not_available'
	| 'lockout'
	| 'no_space'
	| 'timeout'
	| 'unable_to_process'
	| 'unknown'
	| 'system_cancel'
	| 'user_fallback'
	| 'invalid_context'
	| 'passcode_not_set'
	| 'authentication_failed';

export enum BiometricKeyType {
	RSA2048 = 'rsa2048',
	EC256 = 'ec256',
}
