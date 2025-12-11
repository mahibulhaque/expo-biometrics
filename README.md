<div align="center">
  <a href="https://github.com/mahibulhaque/expo-biometrics">
    <img alt="Expo logo" height="128" src="./.github/resources/banner.png">
    <h1 align="center">Expo Biometrics</h1>
  </a>

<p>
A lightweight and easy-to-use Expo library for implementing secure biometric authentication (Face ID, Touch ID, and fingerprint) in React Native apps.
</p>
<p>
    <img src="https://img.shields.io/npm/v/@mahibhaque/expo-biometrics?style=for-the-badge&color=red" alt="npm version" />
    <img src="https://img.shields.io/npm/dt/@mahibhaque/expo-biometrics?style=for-the-badge&color=green" alt="downloads" />
    <img src="https://img.shields.io/github/license/mahibulhaque/expo-biometrics?style=for-the-badge&color=orange" alt="license" />
    <img src="https://img.shields.io/npm/types/@mahibhaque/expo-biometrics?style=for-the-badge&color=blue" alt="typescript" />
  </p>

  <p>
    <img src="https://img.shields.io/badge/iOS-Face%20ID%20%7C%20Touch%20ID-blue?style=for-the-badge&logo=apple" alt="iOS Support" />
    <img src="https://img.shields.io/badge/Android-Fingerprint%20%7C%20Face-green?style=for-the-badge&logo=android" alt="Android Support" />
    <img src="https://img.shields.io/badge/New%20Architecture-Ready-purple?style=for-the-badge" alt="New Architecture" />
  </p>
</div>

## ✨ Features

- 🔒 **Unified API** - Single interface for iOS and Android biometric authentication
- 📱 **Multiple Biometric Types** - Face ID, Touch ID, Fingerprint, and more
- 🛠️ **Advanced Options** - Customizable prompts, fallback options, and device credentials
- 🔑 **Key Management** - Create and manage cryptographic keys (EC256/RSA2048) for secure operations
- 🛡️ **Device Integrity** - Detect compromised devices (rooted/jailbroken) for enhanced security
- 📝 **Centralized Logging** - Advanced logging system for debugging and monitoring
- 🔐 **Key Integrity Validation** - Comprehensive cryptographic key validation and signature verification
- 📦 **Lightweight** - Minimal dependencies and optimized for performance
- 🎯 **TypeScript** - Full TypeScript support with detailed type definitions
- 🔄 **New Architecture** - Compatible with React Native's new architecture (ExpoModules)
- 🚀 **Easy Integration** - Simple setup with comprehensive documentation
- 🔐 **Secure by Default** - Industry-standard security practices built-in

## Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/local-authentication/).

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```bash
npx expo install "@mahibhaque/expo-biometrics"
```

> **⚠️ Important:** The module requires development builds (`npx expo run:ios --device`) or (`npx expo run:android --device`). Does not work with Expo Go and Xcode simulator or Android Simulator.
>
> **Prerequisites:** macOS, Xcode 14+, Expo SDK 50+, iOS 14+.

### Configure for Android

No additional set up necessary.

This module requires permissions to access the biometric data for authentication purposes. The `USE_BIOMETRIC` and `USE_FINGERPRINT` permissions are automatically added.

```xml
<!-- Added permissions -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

### Configure for iOS

Run `npx pod-install` after installing the npm package.

Add `NSFaceIDUsageDescription` to your `Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use FaceID</string>
```

## ⚙️ Platform Notes

- iOS supports `Face ID` and `Touch ID` depending on the device model.

- Android supports `Fingerprint`, `Facial Recognition`, and `Iris` depending on hardware.
- On Android, you can use the `requireConfirmation` flag to request explicit user confirmation after successful biometric authentication.
- On iOS, you can customize the fallback button label using `fallbackLabel`.

## 📚 Documentation

- **[Usage](./docs/basic-usage.md)** - Comprehensive guide to primary methods in the library, and how to properly use the library and it's API methods.

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/mahibulhaque">@mahibulhaque</a></p>
  <p>⭐ Star this repo if it helped you!</p>

  <p>
    <a href="https://github.com/mahibulhaque/expo-biometrics/issues">Report Bug</a> ·
    <a href="https://github.com/mahibulhaque/expo-biometrics/issues">Request Feature</a> ·
    <a href="https://github.com/mahibulhaque/expo-biometrics/discussions">Discussions</a>
  </p>
</div>
