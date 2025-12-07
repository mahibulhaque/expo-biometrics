# Expo Biometrics

Provides an API for creating public-private key pair which are stored in native keystores and are protected by biometric authentication. The provided API also allows for encrypted signature creation after key enrollment.

## API documentation

- [Documentation for the latest stable release](https://github.com/mahibulhaque/expo-biometrics#readme)

## Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/local-authentication/).

## Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npx expo install expo-biometrics
```

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

## Usage

This package is designed to make server authentication using biometrics easier. Here is an image from https://android-developers.googleblog.com/2015/10/new-in-android-samples-authenticating.html illustrating the basic use case:

![react-native-biometrics](/assets/biometricsdiagram.png)

When a user enrolls in biometrics, a key pair is generated. The private key is stored securely on the device and the public key is sent to a server for registration. When the user wishes to authenticate, the user is prompted for biometrics, which unlocks the securely stored private key. Then a cryptographic signature is generated and sent to the server for verification. The server then verifies the signature. If the verification was successful, the server returns an appropriate response and authorizes the user.

### 1. Import the module

```ts
import ExpoBiometrics from "expo-biometrics";
```

### 2. Check for hardware availability

Before prompting for biometric authentication, ensure the device supports biometric hardware.

```ts
const hasHardware = await ExpoBiometrics.hasHardware();

if (!hasHardware) {
  console.log("Biometric hardware not available on this device.");
  return;
}
```

### 3. Check if the user is enrolled

Check if the user has enrolled any biometric credentials (e.g. fingerprints or Face ID):

```ts
const isEnrolled = await ExpoBiometrics.isEnrolled();

if (!isEnrolled) {
  console.log("No biometric credentials enrolled.");
  return;
}
```

### 4. Get supported authentication types

Retrieve what kind of biometric authentication the device supports.

```ts
import { AuthenticationType } from "expo-biometrics";

const types = await ExpoBiometrics.supportedAuthenticationTypes();

if (types.includes(AuthenticationType.FINGERPRINT)) {
  console.log("Fingerprint authentication supported");
}

if (types.includes(AuthenticationType.FACIAL_RECOGNITION)) {
  console.log("Facial recognition supported");
}
```

### 5. Check the enrolled security level

Determine how secure the enrolled biometric methods are.

```ts
import { SecurityLevel } from "expo-biometrics";

const level = await ExpoBiometrics.getEnrolledLevel();

switch (level) {
  case SecurityLevel.BIOMETRIC_STRONG:
    console.log("Strong biometric authentication available.");
    break;
  case SecurityLevel.BIOMETRIC_WEAK:
    console.log("Weak biometric authentication available.");
    break;
  default:
    console.log("No biometric authentication available.");
}
```

### 6. Creating and managing biometric keys

You can generate a public-private key pair protected by the device’s biometric system. The public key can be sent to your backend for registration.

✅ Create keys

```ts
const result = await ExpoBiometrics.createKeys();

if (result.success) {
  console.log("Public key:", result.publicKey);
} else {
  console.error("Failed to create keys:", result.error);
}
```

🗑️ Delete keys

```ts
const deleted = await ExpoBiometrics.deleteKeys();
console.log(deleted ? "Keys deleted." : "Failed to delete keys.");
```

🔍 Check if keys exist

```ts
const exists = await ExpoBiometrics.doesKeyExist();
console.log(exists ? "Keys already exist." : "No keys found.");
```

### 7. Creating a biometric signature

After registering the public key with your backend, you can create a signed payload to verify the user using biometrics.

```ts
const payload = "session_challenge_token_from_server";

const response = await ExpoBiometrics.createSignature({
  payload,
  promptMessage: "Authenticate to sign in",
  cancelLabel: "Cancel",
});

if (response.success) {
  console.log("Signature:", response.signature);
  // Send signature to backend for verification
} else {
  console.error("Signature failed:", response.error);
}
```

### 8. Simple biometric prompt

Use this when you just want to confirm user identity (without key generation or signing).

```ts
const result = await ExpoBiometrics.simplePrompt({
  promptMessage: "Authenticate to continue",
  fallbackLabel: "Use Passcode",
});

if (result.success) {
  console.log("Authentication successful!");
} else {
  console.error("Authentication failed:", result.error);
}
```

## ⚙️ Platform Notes

- iOS supports `Face ID` and `Touch ID` depending on the device model.

- Android supports `Fingerprint`, `Facial Recognition`, and `Iris` depending on hardware.
- On Android, you can use the `requireConfirmation` flag to request explicit user confirmation after successful biometric authentication.
- On iOS, you can customize the fallback button label using `fallbackLabel`.
