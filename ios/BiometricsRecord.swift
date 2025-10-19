import ExpoModulesCore

internal struct SimplePromptOptions: Record {
    @Field var cancelLabel: String?
    @Field var fallbackLabel: String?
    @Field var promptMessage: String?
}

internal struct CreateSignatureOptions:Record{
    @Field var payload:String
    @Field var cancelLabel:String?
    @Field var fallbackLabel: String?
    @Field var promptMessage:String?
}
