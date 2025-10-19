package expo.modules.biometrics

import android.app.KeyguardManager
import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executor


private const val AUTHENTICATION_TYPE_FINGERPRINT = 1
private const val AUTHENTICATION_TYPE_FACIAL_RECOGNITION = 2
private const val AUTHENTICATION_TYPE_IRIS = 3
private const val SECURITY_LEVEL_NONE = 0
private const val SECURITY_LEVEL_SECRET = 1
private const val SECURITY_LEVEL_BIOMETRIC_WEAK = 2
private const val SECURITY_LEVEL_BIOMETRIC_STRONG = 3

class ExpoBiometricsModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoBiometrics")

        AsyncFunction<Set<Int>>("supportedAuthenticationTypesAsync") {
            val results = mutableSetOf<Int>()
            if (canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE) {
                return@AsyncFunction results
            }

            results.apply {
                addIf(
                    hasSystemFeature("android.hardware.fingerprint"),
                    AUTHENTICATION_TYPE_FINGERPRINT
                )
                addIf(
                    hasSystemFeature("android.hardware.biometrics.face"),
                    AUTHENTICATION_TYPE_FACIAL_RECOGNITION
                )
                addIf(
                    hasSystemFeature("android.hardware.biometrics.iris"),
                    AUTHENTICATION_TYPE_IRIS
                )
                addIf(
                    hasSystemFeature("com.samsung.android.bio.face"),
                    AUTHENTICATION_TYPE_FACIAL_RECOGNITION
                )
            }

            return@AsyncFunction results
        }

        AsyncFunction<Boolean>("hasHardwareAsync") {
            canAuthenticateUsingWeakBiometrics() != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
        }

        AsyncFunction<Boolean>("isEnrolledAsync") {
            canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_SUCCESS
        }

        AsyncFunction<Int>("getEnrolledLevelAsync") {
            var level = SECURITY_LEVEL_NONE
            if (isDeviceSecure) {
                level = SECURITY_LEVEL_SECRET
            }
            if (canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_SUCCESS) {
                level = SECURITY_LEVEL_BIOMETRIC_WEAK
            }
            if (canAuthenticateUsingStrongBiometrics() == BiometricManager.BIOMETRIC_SUCCESS) {
                level = SECURITY_LEVEL_BIOMETRIC_STRONG
            }
            return@AsyncFunction level
        }

        AsyncFunction("createKeysAsync") { key: String ->
            try {
                val pubKey = KeyStoreSigner.createKey(key)
                mapOf(
                    "publicKey" to pubKey,
                    "success" to true
                )
            } catch (e: Exception) {
                throw CodedException("key_create_failed: ${e.message ?: "Failed to create key"}")
            }
        }

        AsyncFunction("deleteKeysAsync") { alias: String ->
            try {
                KeyStoreSigner.deleteKey(alias)
                true
            } catch (e: Exception) {
                throw CodedException("key_delete_failed: ${e.message ?: "Failed to delete key"}")
            }
        }

        AsyncFunction("doesKeyExistAsync") { alias: String ->
            KeyStoreSigner.hasKey(alias)
        }

        AsyncFunction("createSignatureAsync") { request: CreateSignatureRequest, promise: Promise ->
            val activity = appContext.currentActivity as? FragmentActivity
                ?: run {
                    promise.reject(Exceptions.MissingActivity())
                    return@AsyncFunction
                }

            val executor: Executor = ContextCompat.getMainExecutor(context)
            val response = CreateSignatureResponse()


            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(request.promptMessage)
                .setSubtitle(request.promptSubtitle)
                .setDescription(request.promptDescription)
                .setNegativeButtonText(request.cancelLabel ?: "Cancel")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .setConfirmationRequired(request.requireConfirmation)
                .build()

            try {
                val signature = KeyStoreSigner.getSignature(request.payload)
                val cryptoObject = BiometricPrompt.CryptoObject(signature)

                val biometricPrompt = BiometricPrompt(
                    activity,
                    executor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
                            super.onAuthenticationSucceeded(authResult)
                            try {
                                signature.update(request.payload.toByteArray())
                                val signedData = signature.sign()
                                val base64Signature = android.util.Base64.encodeToString(
                                    signedData,
                                    android.util.Base64.NO_WRAP
                                )
                                response.success = true
                                response.signature = base64Signature
                                promise.resolve(response)
                            } catch (e: Exception) {
                                response.success = false
                                response.error = e.message
                                promise.reject(
                                    UnexpectedException(
                                        "Canceled authentication due to an internal error",
                                        e
                                    )
                                )
                            }
                        }

                        override fun onAuthenticationError(
                            errorCode: Int,
                            errString: CharSequence
                        ) {
                            super.onAuthenticationError(errorCode, errString)
                            val errorType = convertError(errorCode)
                            if (errorType == "user_cancel") {
                                promise.resolve(
                                    mapOf(
                                        "success" to false,
                                        "error" to errorType
                                    )
                                )
                            } else {
                                promise.reject(CodedException(errString.toString()))
                            }
                        }

                    })

                biometricPrompt.authenticate(promptInfo, cryptoObject)
            } catch (e: Exception) {
                promise.reject(
                    CodedException(
                        "biometric_prompt_failed",
                        e.message ?: "Failed to start biometric prompt",
                        e
                    )
                )
            }
        }

        AsyncFunction("simplePromptAsync") { request: SimplePromptRequest, promise: Promise ->
            val activity = appContext.currentActivity as? FragmentActivity
                ?: run {
                    promise.reject(Exceptions.MissingActivity())
                    return@AsyncFunction
                }

            val executor: Executor = ContextCompat.getMainExecutor(context)

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(request.promptMessage)
                .setSubtitle(request.promptSubtitle)
                .setDescription(request.promptDescription)
                .setNegativeButtonText(request.cancelLabel ?: "Cancel")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .setConfirmationRequired(request.requireConfirmation)
                .build()

            val biometricPrompt = BiometricPrompt(
                activity,
                executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
                        super.onAuthenticationSucceeded(authResult)
                        promise.resolve(mapOf("success" to true))
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        super.onAuthenticationError(errorCode, errString)
                        val errorType = convertError(errorCode)
                        if (errorType == "user_cancel") {
                            promise.resolve(
                                mapOf(
                                    "success" to false,
                                    "error" to errorType
                                )
                            )
                        } else {
                            promise.reject(CodedException(errString.toString()))
                        }
                    }

                })

            biometricPrompt.authenticate(promptInfo)
        }

    }

    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private val keyguardManager: KeyguardManager
        get() = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager

    private val biometricManager by lazy { BiometricManager.from(context) }
    private val packageManager by lazy { context.packageManager }

    private fun hasSystemFeature(feature: String) = packageManager.hasSystemFeature(feature)

    private val isDeviceSecure: Boolean
        get() = keyguardManager.isDeviceSecure

    private fun canAuthenticateUsingWeakBiometrics(): Int =
        biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK)

    private fun canAuthenticateUsingStrongBiometrics(): Int =
        biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)

    private fun convertError(code: Int): String {
        return when (code) {
            BiometricPrompt.ERROR_CANCELED,
            BiometricPrompt.ERROR_USER_CANCELED,
            BiometricPrompt.ERROR_NEGATIVE_BUTTON -> "user_cancel"

            BiometricPrompt.ERROR_NO_BIOMETRICS,
            BiometricPrompt.ERROR_HW_UNAVAILABLE,
            BiometricPrompt.ERROR_HW_NOT_PRESENT -> "not_available"

            BiometricPrompt.ERROR_LOCKOUT, BiometricPrompt.ERROR_LOCKOUT_PERMANENT -> "lockout"
            else -> "unknown"
        }
    }
}

fun <T> MutableSet<T>.addIf(condition: Boolean, valueToAdd: T) {
    if (condition) {
        add(valueToAdd)
    }
}