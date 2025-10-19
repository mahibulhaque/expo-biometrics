import { NativeModule, requireNativeModule } from 'expo';
import {
	AuthenticationType,
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
	createKeysAsync(): Promise<CreateKeysResponse>;
	deleteKeys(): Promise<boolean>;
	doesKeyExistAsync(): Promise<boolean>;
	createSignatureAsync(
		request: CreateSignatureRequest,
	): Promise<CreateSignatureResponse>;
	simplePromptAsync(
		request: SimplePromptRequest,
	): Promise<SimplePromptResponse>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoBiometricsModule>('ExpoBiometrics');
