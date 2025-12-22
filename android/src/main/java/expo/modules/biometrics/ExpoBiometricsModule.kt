package expo.modules.biometrics

import android.app.KeyguardManager
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.core.content.edit
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.UnexpectedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.IOException
import java.security.InvalidAlgorithmParameterException
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.NoSuchAlgorithmException
import java.security.NoSuchProviderException
import java.security.UnrecoverableKeyException
import java.security.Signature
import java.security.cert.CertificateException
import java.security.interfaces.ECKey
import java.security.interfaces.RSAKey
import java.util.concurrent.Executor


private const val AUTHENTICATION_TYPE_FINGERPRINT = 1
private const val AUTHENTICATION_TYPE_FACIAL_RECOGNITION = 2
private const val AUTHENTICATION_TYPE_IRIS = 3
private const val SECURITY_LEVEL_NONE = 0
private const val SECURITY_LEVEL_SECRET = 1
private const val SECURITY_LEVEL_BIOMETRIC_WEAK = 2
private const val SECURITY_LEVEL_BIOMETRIC_STRONG = 3

private const val DEFAULT_KEY_ALIAS = "biometric_key"
private const val PREFS_NAME = "ReactNativeBiometricsPrefs"
private const val KEY_ALIAS_PREF = "keyAlias"

class ExpoBiometricsModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoBiometrics")

        AsyncFunction<Set<Int>>("supportedAuthenticationTypes") {
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

        AsyncFunction<Boolean>("hasHardware") {
            canAuthenticateUsingWeakBiometrics() != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
        }

        AsyncFunction<Boolean>("isEnrolled") {
            canAuthenticateUsingWeakBiometrics() == BiometricManager.BIOMETRIC_SUCCESS
        }

        AsyncFunction<Int>("getEnrolledLevel") {
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

        AsyncFunction("setDebugMode"){enabled:Boolean, promise: Promise->
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            sharedPrefs.edit { putBoolean("debugMode", enabled) }
            if (enabled) {
              android.util.Log.d("ReactNativeBiometrics", "Debug mode enabled")
            } else {
              android.util.Log.d("ReactNativeBiometrics", "Debug mode disabled")
            }
            promise.resolve(null)
        }

        AsyncFunction("configureKeyAlias"){ keyAlias: String, promise: Promise ->
            if (keyAlias.isEmpty()) {
                promise.reject("INVALID_KEY_ALIAS", "Key alias cannot be empty", null)
            }

            configuredKeyAlias = keyAlias
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            sharedPrefs.edit{putString(KEY_ALIAS_PREF, keyAlias)}

            debugLog("Key alias configured successfully: $keyAlias")
            promise.resolve(null)
        }

        AsyncFunction("getDefaultKeyAlias"){promise:Promise ->
            val currentAlias = getKeyAlias()
            debugLog("getDefaultKeyAlias returning: $currentAlias")
            promise.resolve(currentAlias)
        }

        AsyncFunction("getAllKeys"){customAlias:String?, promise:Promise->
            debugLog("getAllKeys called with customAlias: ${customAlias ?: "null"}")
            try {
                val keyStore = KeyStore.getInstance("AndroidKeyStore")
                keyStore.load(null)

                val keysList = mutableListOf<Map<String, String>>()
                val aliases = keyStore.aliases()

                while (aliases.hasMoreElements()) {
                    val alias = aliases.nextElement()

                    // Filter for our biometric keys
                    val shouldIncludeKey = if (customAlias != null) {
                        // If customAlias is provided, filter for that specific alias
                        alias.equals(getKeyAlias(customAlias))
                    } else {
                        // Default behavior: check if it contains the default key alias
                        alias.equals(getKeyAlias())
                    }

                    if (shouldIncludeKey) {
                        try {
                            val keyEntry = keyStore.getEntry(alias, null)
                            if (keyEntry is KeyStore.PrivateKeyEntry) {
                                val publicKey = keyEntry.certificate.publicKey
                                val publicKeyBytes = publicKey.encoded
                                val publicKeyString = encodeBase64(publicKeyBytes)

                                val keyInfo = mutableMapOf<String, String>()
                                keyInfo.put("alias", alias)
                                keyInfo.put("publicKey", publicKeyString)
                                // Note: Android KeyStore doesn't provide creation date easily
                                // You could store this separately if needed

                                keysList.add(keyInfo)
                                debugLog("Found key with alias: $alias")
                            }
                        } catch (e: Exception) {
                            debugLog("Error processing key $alias: ${e.message}")
                            // Continue with other keys
                        }
                    }
                }

                val result = mapOf(
                    "keys" to keysList
                )

                debugLog("getAllKeys completed successfully, found ${keysList.size} keys")
                promise.resolve(result)

            } catch (e: KeyStoreException) {
                debugLog("getAllKeys failed - KeyStore error: ${e.message}")
                promise.reject("GET_ALL_KEYS_ERROR", "KeyStore error: ${e.message}", e)
            } catch (e: CertificateException) {
                debugLog("getAllKeys failed - Certificate error: ${e.message}")
                promise.reject("GET_ALL_KEYS_ERROR", "Certificate error: ${e.message}", e)
            } catch (e: IOException) {
                debugLog("getAllKeys failed - IO error: ${e.message}")
                promise.reject("GET_ALL_KEYS_ERROR", "IO error: ${e.message}", e)
            } catch (e: NoSuchAlgorithmException) {
                debugLog("getAllKeys failed - Algorithm error: ${e.message}")
                promise.reject("GET_ALL_KEYS_ERROR", "Algorithm error: ${e.message}", e)
            } catch (e: UnrecoverableKeyException) {
                debugLog("getAllKeys failed - Unrecoverable key error: ${e.message}")
                promise.reject("GET_ALL_KEYS_ERROR", "Unrecoverable key error: ${e.message}", e)
            } catch (e: Exception) {
                debugLog("getAllKeys failed - Unexpected error: ${e.message}")
                promise.reject("GET_ALL_KEYS_ERROR", "Failed to get all keys: ${e.message}", e)
            }
        }

        AsyncFunction("createKeys") { request: CreateKeysRequest, promise: Promise ->
            val actualKeyAlias = getKeyAlias(request.keyAlias)
            val actualKeyType = request.keyType?.lowercase() ?: "rsa2048"
            debugLog("createKeys called with keyAlias: ${request.keyAlias ?: "default"}, using: $actualKeyAlias, keyType: $actualKeyType")


            try {
                // Check if key already exists
                val keyStore = KeyStore.getInstance("AndroidKeyStore")
                keyStore.load(null)

                if (keyStore.containsAlias(actualKeyAlias)) {
                    debugLog("Key already exists, deleting existing key")
                    keyStore.deleteEntry(actualKeyAlias)
                }

                // Generate new key pair based on key type
                when (actualKeyType) {
                    "rsa2048" -> {
                        val keyPairGenerator = KeyPairGenerator.getInstance(
                            KeyProperties.KEY_ALGORITHM_RSA,
                            "AndroidKeyStore"
                        )
                        val keyGenParameterSpec = KeyGenParameterSpec.Builder(
                            actualKeyAlias,
                            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
                        )
                            .setDigests(KeyProperties.DIGEST_SHA256)
                            .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
                            .setKeySize(2048)
                            .setUserAuthenticationRequired(true)
                            .setUserAuthenticationValidityDurationSeconds(-1) // Require auth for every use
                            .build()

                        keyPairGenerator.initialize(keyGenParameterSpec)
                        val keyPair = keyPairGenerator.generateKeyPair()

                        // Get public key and encode it
                        val publicKey = keyPair.public
                        val publicKeyBytes = publicKey.encoded
                        val publicKeyString = Base64.encodeToString(publicKeyBytes, Base64.DEFAULT)

                        val result = mapOf(
                            "publicKey" to publicKeyString,
                            "success" to true
                        )
                        debugLog("RSA Keys created successfully with alias: $actualKeyAlias")
                        promise.resolve(result)
                        return@AsyncFunction
                    }

                    "ec256" -> {
                        val keyPairGenerator = KeyPairGenerator.getInstance(
                            KeyProperties.KEY_ALGORITHM_EC,
                            "AndroidKeyStore"
                        )
                        val keyGenParameterSpec = KeyGenParameterSpec.Builder(
                            actualKeyAlias,
                            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
                        )
                            .setDigests(KeyProperties.DIGEST_SHA256)
                            .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1) // This will be ignored for EC
                            .setKeySize(256)
                            .setUserAuthenticationRequired(true)
                            .setUserAuthenticationValidityDurationSeconds(-1)
                            .build()

                        keyPairGenerator.initialize(keyGenParameterSpec)
                        val keyPair = keyPairGenerator.generateKeyPair()

                        // Get public key and encode it
                        val publicKey = keyPair.public
                        val publicKeyBytes = publicKey.encoded
                        val publicKeyString = Base64.encodeToString(publicKeyBytes, Base64.DEFAULT)

                        val result = mapOf(
                            "publicKey" to publicKeyString,
                            "success" to true
                        )

                        debugLog("EC Keys created successfully with alias: $actualKeyAlias")
                        promise.resolve(result)
                        return@AsyncFunction
                    }

                    else -> {
                        debugLog("createKeys failed - Unsupported key type: $actualKeyType")
                        promise.reject(
                            "CREATE_KEYS_ERROR",
                            "Unsupported key type: $actualKeyType. Supported types: rsa2048, ec256",
                            null
                        )
                    }
                }

            } catch (e: NoSuchAlgorithmException) {
                debugLog("createKeys failed - Algorithm not supported: ${e.message}")
                promise.reject("CREATE_KEYS_ERROR", "Algorithm not supported: ${e.message}", e)
            } catch (e: InvalidAlgorithmParameterException) {
                debugLog("createKeys failed - Invalid parameters: ${e.message}")
                promise.reject("CREATE_KEYS_ERROR", "Invalid key parameters: ${e.message}", e)
            } catch (e: NoSuchProviderException) {
                debugLog("createKeys failed - Provider not found: ${e.message}")
                promise.reject("CREATE_KEYS_ERROR", "KeyStore provider not found: ${e.message}", e)
            } catch (e: KeyStoreException) {
                debugLog("createKeys failed - KeyStore error: ${e.message}")
                promise.reject("CREATE_KEYS_ERROR", "KeyStore error: ${e.message}", e)
            } catch (e: CertificateException) {
                debugLog("createKeys failed - Certificate error: ${e.message}")
                promise.reject("CREATE_KEYS_ERROR", "Certificate error: ${e.message}", e)
            } catch (e: IOException) {
                debugLog("createKeys failed - IO error: ${e.message}")
                promise.reject("CREATE_KEYS_ERROR", "IO error: ${e.message}", e)
            } catch (e: Exception) {
                debugLog("createKeys failed - Unexpected error: ${e.message}")
                promise.reject("CREATE_KEYS_ERROR", "Failed to create keys: ${e.message}", e)
            }
        }

        AsyncFunction("deleteKeys") { request: DeleteKeysRequest, promise: Promise ->
            val actualKeyAlias = getKeyAlias(request.keyAlias)
            debugLog("deleteKeys called with keyAlias: ${request.keyAlias ?: "default"}, using: $actualKeyAlias")
            try {

                // Access the Android KeyStore
                val keyStore = KeyStore.getInstance("AndroidKeyStore")
                keyStore.load(null)

                // Check if the key exists
                if (keyStore.containsAlias(actualKeyAlias)) {
                    // Delete the key
                    keyStore.deleteEntry(actualKeyAlias)
                    debugLog("Key with alias '$actualKeyAlias' deleted successfully")

                    // Verify deletion
                    if (!keyStore.containsAlias(actualKeyAlias)) {
                        val result = mapOf(
                            "success" to true
                        )
                        debugLog("Keys deleted and verified successfully")
                        promise.resolve(result)
                        return@AsyncFunction
                    } else {
                        debugLog("deleteKeys failed - Key still exists after deletion attempt")
                        promise.reject(
                            "DELETE_KEYS_ERROR",
                            "Key deletion verification failed",
                            null
                        )
                    }
                } else {
                    // Key doesn't exist, but this is not necessarily an error
                    debugLog("No key found with alias '$actualKeyAlias' - nothing to delete")
                    val result = mapOf(
                        "success" to true
                    )
                    promise.resolve(result)
                    return@AsyncFunction
                }

            } catch (e: KeyStoreException) {
                debugLog("deleteKeys failed - KeyStore error: ${e.message}")
                promise.reject("DELETE_KEYS_ERROR", "KeyStore error: ${e.message}", e)
            } catch (e: CertificateException) {
                debugLog("deleteKeys failed - Certificate error: ${e.message}")
                promise.reject("DELETE_KEYS_ERROR", "Certificate error: ${e.message}", e)
            } catch (e: IOException) {
                debugLog("deleteKeys failed - IO error: ${e.message}")
                promise.reject("DELETE_KEYS_ERROR", "IO error: ${e.message}", e)
            } catch (e: Exception) {
                debugLog("deleteKeys failed - Unexpected error: ${e.message}")
                promise.reject("DELETE_KEYS_ERROR", "Failed to delete keys: ${e.message}", e)
            }
        }

        AsyncFunction("doesKeyExist") { request: DoesKeysExistRequest, promise: Promise ->
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)
            val result = keyStore.containsAlias(request.keyAlias)

            val response = mapOf(
                "keyExists" to result,
            )
            promise.resolve(response)
            return@AsyncFunction
        }

        AsyncFunction("createSignature") { request: CreateSignatureRequest, promise: Promise ->
            val actualKeyAlias = getKeyAlias(request.keyAlias)
            debugLog("createSignature called with keyAlias: ${request.keyAlias ?: "default"}, using: $actualKeyAlias")

            val activity = appContext.currentActivity as? FragmentActivity
                ?: run {
                    promise.reject(Exceptions.MissingActivity())
                    return@AsyncFunction
                }

            // Run on main thread
            Handler(Looper.getMainLooper()).post {
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
                    val keyStore = KeyStore.getInstance("AndroidKeyStore")
                    keyStore.load(null)

                    if (!keyStore.containsAlias(actualKeyAlias)) {
                        val errorResult = mapOf(
                            "success" to false,
                            "error" to "Key not found"
                        )
                        promise.resolve(errorResult)
                        return@post
                    }

                    val keyEntry = keyStore.getEntry(actualKeyAlias, null)
                    if (keyEntry !is KeyStore.PrivateKeyEntry) {
                        val errorResult = mapOf(
                            "success" to false,
                            "error" to "Invalid key type"
                        )
                        promise.resolve(errorResult)
                        return@post
                    }

                    val privateKey = keyEntry.privateKey
                    val signature = Signature.getInstance(getSignatureAlgorithm(privateKey))
                    signature.initSign(privateKey)
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
                                    val base64Signature = Base64.encodeToString(
                                        signedData,
                                        Base64.NO_WRAP
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
        }

        AsyncFunction("simplePrompt") { request: SimplePromptRequest, promise: Promise ->
            val activity = appContext.currentActivity as? FragmentActivity
                ?: run {
                    promise.reject(Exceptions.MissingActivity())
                    return@AsyncFunction
                }

            // Run on main thread
            Handler(Looper.getMainLooper()).post {
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

                biometricPrompt.authenticate(promptInfo)
            }
        }
    }

    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private var configuredKeyAlias: String? = null

    private fun getKeyAlias(keyAlias: String? = null): String {
        return keyAlias ?: configuredKeyAlias ?: run {
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            sharedPrefs.getString(KEY_ALIAS_PREF, DEFAULT_KEY_ALIAS) ?: DEFAULT_KEY_ALIAS
        }
    }

    private fun isDebugModeEnabled(): Boolean {
        val sharedPrefs =
            context.getSharedPreferences("ReactNativeBiometrics", Context.MODE_PRIVATE)
        return sharedPrefs.getBoolean("debugMode", false)
    }

    private fun debugLog(message: String) {
        if (isDebugModeEnabled()) {
            android.util.Log.d("ReactNativeBiometrics Debug", message)
        }
    }

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


fun getSignatureAlgorithm(key: java.security.Key): String {
    return when (key) {
        is RSAKey -> "SHA256withRSA"
        is ECKey -> "SHA256withECDSA"
        else -> "SHA256withRSA" // Default fallback
    }
}

fun encodeBase64(bytes: ByteArray): String {
    return Base64.encodeToString(bytes, Base64.NO_WRAP)
}
