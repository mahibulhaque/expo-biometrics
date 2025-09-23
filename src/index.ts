// Reexport the native module. On web, it will be resolved to ExpoBiometricsModule.web.ts
// and on native platforms to ExpoBiometricsModule.ts
export { default } from './ExpoBiometricsModule';
export { default as ExpoBiometricsView } from './ExpoBiometricsView';
export * from  './ExpoBiometrics.types';
