import { UnavailabilityError } from 'expo-modules-core';
import invariant from 'invariant';

import ExpoBiometricsModule from './ExpoBiometricsModule';

import {
	CreateSignatureOptions,
	BiometricAuthenticationResult,
	AuthenticationType,
	SecurityLevel,
	BiometricsSecurityLevel,
	BiometricAuthenticationError,
} from './Biometrics.types';

export {
	CreateSignatureOptions,
	AuthenticationType,
	BiometricAuthenticationResult,
	SecurityLevel,
	BiometricsSecurityLevel,
	BiometricAuthenticationError,
};

/**
 * Determine whether a face or fingerprint scanner is available on the device.
 * @return Returns a promise which fulfils with a `boolean` value indicating whether a face or
 * fingerprint scanner is available on this device.
 */
export async function hasHardwareAsync(): Promise<boolean> {
	if (!ExpoBiometricsModule.hasHardwareAsync) {
		throw new UnavailabilityError('expo-biometrics', 'hasHardwareAsync');
	}
	return await ExpoBiometricsModule.hasHardwareAsync();
}

/**
 * Determine what kinds of authentications are available on the device.
 * @return Returns a promise which fulfils to an array containing [`AuthenticationType`s](#authenticationtype).
 *
 * Devices can support multiple authentication methods - i.e. `[1,2]` means the device supports both
 * fingerprint and facial recognition. If none are supported, this method returns an empty array.
 */
export async function supportedAuthenticationTypesAsync(): Promise<
	AuthenticationType[]
> {
	if (!ExpoBiometricsModule.supportedAuthenticationTypesAsync) {
		throw new UnavailabilityError(
			'expo-biometrics',
			'supportedAuthenticationTypesAsync',
		);
	}
	return await ExpoBiometricsModule.supportedAuthenticationTypesAsync();
}

/**
 * Determine whether the device has saved fingerprints or facial data to use for authentication.
 * @return Returns a promise which fulfils to `boolean` value indicating whether the device has
 * saved fingerprints or facial data for authentication.
 */
export async function isEnrolledAsync(): Promise<boolean> {
	if (!ExpoBiometricsModule.isEnrolledAsync) {
		throw new UnavailabilityError('expo-biometrics', 'isEnrolledAsync');
	}
	return await ExpoBiometricsModule.isEnrolledAsync();
}

/**
 * Determine what kind of authentication is enrolled on the device.
 * @return Returns a promise which fulfils with [`SecurityLevel`](#securitylevel).
 * > **Note:** On Android devices prior to M, `SECRET` can be returned if only the SIM lock has been
 * enrolled, which is not the method that [`authenticateAsync`](#localauthenticationauthenticateasyncoptions)
 * prompts.
 */
export async function getEnrolledLevelAsync(): Promise<SecurityLevel> {
	if (!ExpoBiometricsModule.getEnrolledLevelAsync) {
		throw new UnavailabilityError('expo-biometrics', 'getEnrolledLevelAsync');
	}
	return await ExpoBiometricsModule.getEnrolledLevelAsync();
}
