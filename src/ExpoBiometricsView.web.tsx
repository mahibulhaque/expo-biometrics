import * as React from 'react';

import { ExpoBiometricsViewProps } from './ExpoBiometrics.types';

export default function ExpoBiometricsView(props: ExpoBiometricsViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
