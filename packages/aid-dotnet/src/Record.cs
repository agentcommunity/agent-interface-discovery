namespace AidDiscovery;

public sealed class AidRecord
{
    public string V { get; }
    public string Uri { get; }
    public string Proto { get; }
    public string? Auth { get; }
    public string? Desc { get; }

    public AidRecord(string v, string uri, string proto, string? auth = null, string? desc = null)
    {
        V = v;
        Uri = uri;
        Proto = proto;
        Auth = auth;
        Desc = desc;
    }
}