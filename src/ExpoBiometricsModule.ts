import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoBiometricsModule extends NativeModule {}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoBiometricsModule>('ExpoBiometrics');
