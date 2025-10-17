package expo.modules.biometrics

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import java.security.interfaces.ECPublicKey
import android.util.Base64

object KeyStoreSigner {
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"


    /**
     * Create a new EC key pair under alias `alias`. Requires user (biometric / credential) auth for usage.
     * Returns the public key in Base64 (X.509 / SubjectPublicKeyInfo).
     */
    @Throws(Exception::class)
    fun createKey(alias: String): String {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)

        if (keyStore.containsAlias(alias)) {
            keyStore.deleteEntry(alias)
        }

        val keyPairGenerator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            ANDROID_KEYSTORE
        )

        val specBuilder = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
            .setAlgorithmParameterSpec(java.security.spec.ECGenParameterSpec("secp256r1"))
            .setDigests(
                KeyProperties.DIGEST_SHA256,
                KeyProperties.DIGEST_SHA384,
                KeyProperties.DIGEST_SHA512
            )
            .setUserAuthenticationRequired(true)

        try {
            specBuilder.javaClass.getMethod(
                "setUserAuthenticationValidityDurationSeconds",
                Int::class.java
            )
                ?.invoke(specBuilder, -1)
        } catch (_: Exception) {
        }
        keyPairGenerator.initialize(specBuilder.build())
        val kp = keyPairGenerator.generateKeyPair()

        val publicKey = kp.public as ECPublicKey
        val encoded = publicKey.encoded
        return Base64.encodeToString(encoded, Base64.NO_WRAP)
    }

    /**
     * Delete the key with the alias.
     */
    @Throws(Exception::class)
    fun deleteKey(alias: String) {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)
        if (keyStore.containsAlias(alias)) {
            keyStore.deleteEntry(alias)
        }
    }

    /**
     * Check whether a key exists.
     */
    fun hasKey(alias: String): Boolean {
        return try {
            val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
            keyStore.load(null)
            keyStore.containsAlias(alias)
        } catch (_: Exception) {
            false
        }
    }

    /**
     * Get a Signature object initialized with the private key (for signing).
     * You pass this Signature into BiometricPrompt via CryptoObject.
     */
    @Throws(Exception::class)
    fun getSignature(alias: String): Signature {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE)
        keyStore.load(null)
        val entry = keyStore.getEntry(alias, null)
            ?: throw IllegalStateException("No key found under alias: $alias")
        val privateKey = (entry as KeyStore.PrivateKeyEntry).privateKey
        val sig = Signature.getInstance("SHA256withECDSA")
        sig.initSign(privateKey)
        return sig
    }
}