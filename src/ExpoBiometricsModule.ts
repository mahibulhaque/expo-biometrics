import { NativeModule, requireNativeModule } from 'expo';

import { ExpoBiometricsModuleEvents } from './ExpoBiometrics.types';

declare class ExpoBiometricsModule extends NativeModule<ExpoBiometricsModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoBiometricsModule>('ExpoBiometrics');
