import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoBiometricsViewProps } from './ExpoBiometrics.types';

const NativeView: React.ComponentType<ExpoBiometricsViewProps> =
  requireNativeView('ExpoBiometrics');

export default function ExpoBiometricsView(props: ExpoBiometricsViewProps) {
  return <NativeView {...props} />;
}
