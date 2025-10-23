import Foundation
import ExpoModulesCore


struct CreateSignatureRequest:Record{
    @Field var payload:String
    @Field var cancelLabel: String?
    @Field var fallbackLabel: String?
    @Field var promptMessage: String?
}

struct CreateSignatureResponse:Record{
    @Field var signature:String
    @Field var success:Bool = false
    @Field var error:String?
    @Field var warning:String?
}

struct CreateKeysResponse:Record{
    @Field var publicKey:String
    @Field var success:Bool = false
    @Field var error:String?
}

struct SimplePromptRequest:Record{
    @Field var cancelLabel: String?
    @Field var fallbackLabel: String?
    @Field var promptMessage: String?
}

struct SimplePromptResponse:Record{
    @Field var success:Bool = false
    @Field var error:String?
    @Field var warning:String?
}
