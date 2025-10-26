import { NativeModule, requireNativeModule } from 'expo';
import {
	AuthenticationType,
	BiometricKeyType,
	CreateKeysResponse,
	CreateSignatureRequest,
	CreateSignatureResponse,
	SecurityLevel,
	SimplePromptRequest,
	SimplePromptResponse,
} from './ExpoBiometricsModule.types';

declare class ExpoBiometricsModule extends NativeModule {
	hasHardwareAsync(): Promise<boolean>;
	supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
	isEnrolledAsync(): Promise<boolean>;
	getEnrolledLevelAsync(): Promise<SecurityLevel>;
	createKeysAsync(request: {
		keyAlias?: string;
		keyType?: BiometricKeyType;
	}): Promise<CreateKeysResponse>;
	deleteKeysAsync(request: {
		keyAlias?: string;
	}): Promise<{ success: boolean }>;
	doesKeyExistAsync(request: {
		keyAlias?: string;
	}): Promise<{ keyExists: boolean }>;
	createSignatureAsync(
		request: CreateSignatureRequest,
	): Promise<CreateSignatureResponse>;
	simplePromptAsync(
		request: SimplePromptRequest,
	): Promise<SimplePromptResponse>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoBiometricsModule>('ExpoBiometrics');
