namespace AidDiscovery;

public sealed class AidRecord
{
    public string V { get; }
    public string Uri { get; }
    public string Proto { get; }
    public string? Auth { get; }
    public string? Desc { get; }
    public string? Docs { get; }
    public string? Dep { get; }
    public string? Pka { get; }
    public string? Kid { get; }

    public AidRecord(string v, string uri, string proto, string? auth = null, string? desc = null, string? docs = null, string? dep = null, string? pka = null, string? kid = null)
    {
        V = v;
        Uri = uri;
        Proto = proto;
        Auth = auth;
        Desc = desc;
        Docs = docs;
        Dep = dep;
        Pka = pka;
        Kid = kid;
    }
}
