namespace AidDiscovery;

public sealed class AidError : Exception
{
    public int Code { get; }
    public string ErrorCode { get; }

    public AidError(string errorCode, string? message = null) : base(message)
    {
        ErrorCode = errorCode;
        Code = errorCode switch
        {
            nameof(Constants.ERR_NO_RECORD) => Constants.ERR_NO_RECORD,
            nameof(Constants.ERR_INVALID_TXT) => Constants.ERR_INVALID_TXT,
            nameof(Constants.ERR_UNSUPPORTED_PROTO) => Constants.ERR_UNSUPPORTED_PROTO,
            nameof(Constants.ERR_SECURITY) => Constants.ERR_SECURITY,
            nameof(Constants.ERR_DNS_LOOKUP_FAILED) => Constants.ERR_DNS_LOOKUP_FAILED,
            nameof(Constants.ERR_FALLBACK_FAILED) => Constants.ERR_FALLBACK_FAILED,
            _ => -1,
        };
    }
}
