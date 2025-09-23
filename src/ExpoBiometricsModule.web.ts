import { registerWebModule, NativeModule } from 'expo';

import { ExpoBiometricsModuleEvents } from './ExpoBiometrics.types';

class ExpoBiometricsModule extends NativeModule<ExpoBiometricsModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoBiometricsModule, 'ExpoBiometricsModule');
