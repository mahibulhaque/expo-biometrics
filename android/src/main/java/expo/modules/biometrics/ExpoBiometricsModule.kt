package expo.modules.biometrics

import android.app.Activity
import android.app.KeyguardManager
import android.content.Context
import android.os.Build
import androidx.annotation.UiThread
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.biometric.BiometricPrompt.PromptInfo
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.launch
import java.util.concurrent.Executor
import java.util.concurrent.Executors

private const val AUTHENTICATION_TYPE_FINGERPRINT = 1
private const val AUTHENTICATION_TYPE_FACIAL_RECOGNITION = 2
private const val AUTHENTICATION_TYPE_IRIS = 3
private const val SECURITY_LEVEL_NONE = 0
private const val SECURITY_LEVEL_SECRET = 1
private const val SECURITY_LEVEL_BIOMETRIC_WEAK = 2
private const val SECURITY_LEVEL_BIOMETRIC_STRONG = 3
private const val DEVICE_CREDENTIAL_FALLBACK_CODE = 6


class ExpoBiometricsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBiometrics")


    AsyncFunction<Set<Int>>("supportedAuthenticationTypesAsync") {
      val results = mutableSetOf<Int>()
      if (canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
        return@AsyncFunction results
      }

      // note(cedric): replace hardcoded system feature strings with constants from
      // PackageManager when dropping support for Android SDK 28
      results.apply {
        addIf(hasSystemFeature("android.hardware.fingerprint"), AUTHENTICATION_TYPE_FINGERPRINT)
        addIf(hasSystemFeature("android.hardware.biometrics.face"), AUTHENTICATION_TYPE_FACIAL_RECOGNITION)
        addIf(hasSystemFeature("android.hardware.biometrics.iris"), AUTHENTICATION_TYPE_IRIS)
        addIf(hasSystemFeature("com.samsung.android.bio.face"), AUTHENTICATION_TYPE_FACIAL_RECOGNITION)
      }

      return@AsyncFunction results
    }

    AsyncFunction<Boolean>("hasHardwareAsync") {
      canAuthenticateUsingWeakBiometrics() != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
    }

    AsyncFunction<Boolean>("isEnrolledAsync") {
      canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_SUCCESS
    }
  }
}
