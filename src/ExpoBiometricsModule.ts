import { NativeModule, requireNativeModule } from "expo";
import {
  AuthenticationType,
  BiometricKeyType,
  CreateKeysResponse,
  CreateSignatureRequest,
  CreateSignatureResponse,
  SecurityLevel,
  SimplePromptRequest,
  SimplePromptResponse,
} from "./ExpoBiometricsModule.types";

declare class ExpoBiometricsModule extends NativeModule {
  hasHardware(): Promise<boolean>;
  supportedAuthenticationTypes(): Promise<AuthenticationType[]>;
  isEnrolled(): Promise<boolean>;
  getEnrolledLevel(): Promise<SecurityLevel>;
  configureKeyAlias(keyAlias: string): Promise<void>;
  getDefaultKeyAlias(): Promise<string>;
  getAllKeys(customAlias: string | null): Promise<{
    keys: Array<{
      alias: string;
      publicKey: string;
    }>;
  }>;
  createKeys(request: {
    keyAlias?: string;
    keyType?: BiometricKeyType;
  }): Promise<CreateKeysResponse>;
  deleteKeys(request: { keyAlias?: string }): Promise<{ success: boolean }>;
  doesKeyExist(request: { keyAlias?: string }): Promise<{ keyExists: boolean }>;
  createSignature(
    request: CreateSignatureRequest
  ): Promise<CreateSignatureResponse>;
  simplePrompt(request: SimplePromptRequest): Promise<SimplePromptResponse>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoBiometricsModule>("ExpoBiometrics");
