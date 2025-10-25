package expo.modules.biometrics

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

internal enum class BiometricsSecurityLevel(val value: String) : Enumerable {
    WEAK("weak"),
    STRONG("strong");
}

internal class CreateSignatureRequest : Record {
    @Field
    val payload: String = ""

    @Field
    val promptMessage: String = ""

    @Field
    val promptSubtitle: String? = null

    @Field
    val promptDescription: String? = null

    @Field
    val cancelLabel: String? = null

    @Field
    val requireConfirmation: Boolean = true

    @Field
    val keyAlias:String?=null
}

internal class CreateSignatureResponse : Record {
    @Field
    var signature: String = ""

    @Field
    var success: Boolean = false

    @Field
    var error: String? = null
}

internal class SimplePromptRequest:Record{
    @Field
    val promptMessage: String = ""

    @Field
    val promptSubtitle: String? = null

    @Field
    val promptDescription: String? = null

    @Field
    val cancelLabel: String? = null

    @Field
    val requireConfirmation: Boolean = true
}

internal class DeleteKeysRequest:Record{
    @Field
    val keyAlias: String? = null
}

internal class DoesKeysExistRequest:Record{
    @Field
    val keyAlias: String? = null
}

internal class CreateKeysRequest:Record{
    @Field
    val keyAlias: String? = null

    @Field
    val keyType: String? = null
}