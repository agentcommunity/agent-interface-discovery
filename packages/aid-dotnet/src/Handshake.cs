using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using NSec.Cryptography;

namespace AidDiscovery;

public static class Pka
{
    private static byte[] MultibaseDecode(string s)
    {
        if (string.IsNullOrEmpty(s)) throw new AidError(nameof(Constants.ERR_SECURITY), "Empty PKA");
        if (s[0] != 'z') throw new AidError(nameof(Constants.ERR_SECURITY), "Unsupported multibase prefix");
        return Base58.Decode(s.Substring(1));
    }

    private static (string[] covered, long created, string keyidRaw, string keyid, string alg, byte[] signature, string? responseDate) ParseSignatureHeaders(HttpResponseMessage res)
    {
        string? sigInput = res.Headers.TryGetValues("Signature-Input", out var si) ? si.FirstOrDefault() : null;
        sigInput ??= res.Headers.TryGetValues("signature-input", out var si2) ? si2.FirstOrDefault() : null;
        string? sig = res.Headers.TryGetValues("Signature", out var s) ? s.FirstOrDefault() : null;
        sig ??= res.Headers.TryGetValues("signature", out var s2) ? s2.FirstOrDefault() : null;
        if (sigInput is null || sig is null) throw new AidError(nameof(Constants.ERR_SECURITY), "Missing signature headers");

        var mInside = Regex.Match(sigInput, "sig=\\(\\s*([^)]+?)\\s*\\)", RegexOptions.IgnoreCase);
        if (!mInside.Success) throw new AidError(nameof(Constants.ERR_SECURITY), "Invalid Signature-Input");
        var items = new List<string>();
        var m = Regex.Matches(mInside.Groups[1].Value, "\"([^\"]+)\"");
        foreach (Match mm in m) items.Add(mm.Groups[1].Value);
        if (items.Count == 0) throw new AidError(nameof(Constants.ERR_SECURITY), "Invalid Signature-Input");
        var required = new HashSet<string>(new[] { "aid-challenge", "@method", "@target-uri", "host", "date" });
        var lower = items.Select(x => x.ToLowerInvariant()).ToHashSet();
        if (lower.Count != required.Count || required.Any(r => !lower.Contains(r)))
            throw new AidError(nameof(Constants.ERR_SECURITY), "Signature-Input must cover required fields");

        var mCreated = Regex.Match(sigInput, @"(?:^|;)\s*created=(\d+)");
        var mKeyid = Regex.Match(sigInput, @"(?:^|;)\s*keyid=([^;\s]+)");
        var mAlg = Regex.Match(sigInput, @"(?:^|;)\s*alg=""([^\""]+)""");
        if (!mCreated.Success || !mKeyid.Success || !mAlg.Success)
            throw new AidError(nameof(Constants.ERR_SECURITY), "Invalid Signature-Input");
        long created = long.Parse(mCreated.Groups[1].Value);
        string keyidRaw = mKeyid.Groups[1].Value;
        string keyid = keyidRaw.Trim('"');
        string alg = mAlg.Groups[1].Value.ToLowerInvariant();

        var mSig = Regex.Match(sig, @"sig\s*=\s*:\s*([^:]+)\s*:", RegexOptions.IgnoreCase);
        if (!mSig.Success) throw new AidError(nameof(Constants.ERR_SECURITY), "Invalid Signature header");
        byte[] signature = Convert.FromBase64String(mSig.Groups[1].Value);
        string? responseDate = res.Headers.TryGetValues("Date", out var dh) ? dh.FirstOrDefault() : (res.Headers.TryGetValues("date", out var dh2) ? dh2.FirstOrDefault() : null);
        return (items.ToArray(), created, keyidRaw, keyid, alg, signature, responseDate);
    }

    private static byte[] BuildSignatureBase(string[] covered, long created, string keyidRaw, string alg, string method, string targetUri, string host, string date, string challenge)
    {
        var lines = new List<string>();
        foreach (var item in covered)
        {
            switch (item.ToLowerInvariant())
            {
                case "aid-challenge": lines.Add($"\"AID-Challenge\": {challenge}"); break;
                case "@method": lines.Add($"\"@method\": {method}"); break;
                case "@target-uri": lines.Add($"\"@target-uri\": {targetUri}"); break;
                case "host": lines.Add($"\"host\": {host}"); break;
                case "date": lines.Add($"\"date\": {date}"); break;
                default: throw new AidError(nameof(Constants.ERR_SECURITY), $"Unsupported covered field: {item}");
            }
        }
        var quoted = string.Join(' ', covered.Select(c => $"\"{c}\""));
        var paramsStr = $"({quoted});created={created};keyid={keyidRaw};alg=\"{alg}\"";
        lines.Add($"\"@signature-params\": {paramsStr}");
        return Encoding.UTF8.GetBytes(string.Join('\n', lines));
    }

    public static async Task PerformHandshakeAsync(string uri, string pka, string kid, TimeSpan timeout)
    {
        if (string.IsNullOrEmpty(kid)) throw new AidError(nameof(Constants.ERR_SECURITY), "Missing kid for PKA");
        var u = new Uri(uri);
        using var http = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = timeout };
        var challengeBytes = new byte[32];
        System.Security.Cryptography.RandomNumberGenerator.Fill(challengeBytes);
        var challenge = Convert.ToBase64String(challengeBytes).TrimEnd('=');
        var date = DateTimeOffset.UtcNow.ToString("r");
        using var req = new HttpRequestMessage(HttpMethod.Get, uri);
        req.Headers.TryAddWithoutValidation("AID-Challenge", challenge);
        req.Headers.Date = DateTimeOffset.Parse(date);
        using var res = await http.SendAsync(req).ConfigureAwait(false);
        if (!res.IsSuccessStatusCode) throw new AidError(nameof(Constants.ERR_SECURITY), $"Handshake HTTP {(int)res.StatusCode}");

        var (covered, created, keyidRaw, keyidNorm, alg, signature, respDate) = ParseSignatureHeaders(res);
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (Math.Abs(now - created) > 300) throw new AidError(nameof(Constants.ERR_SECURITY), "Signature created timestamp outside acceptance window");
        if (respDate is not null)
        {
            if (!DateTimeOffset.TryParse(respDate, out var dt)) throw new AidError(nameof(Constants.ERR_SECURITY), "Invalid Date header");
            var epoch = dt.ToUnixTimeSeconds();
            if (Math.Abs(now - epoch) > 300) throw new AidError(nameof(Constants.ERR_SECURITY), "HTTP Date header outside acceptance window");
        }
        if (!string.Equals(keyidNorm, kid, StringComparison.Ordinal)) throw new AidError(nameof(Constants.ERR_SECURITY), "Signature keyid mismatch");
        if (!string.Equals(alg, "ed25519", StringComparison.Ordinal)) throw new AidError(nameof(Constants.ERR_SECURITY), "Unsupported signature algorithm");

        var host = u.Authority;
        var baseBytes = BuildSignatureBase(covered, created, keyidRaw, alg, "GET", uri, host, respDate ?? date, challenge);
        var pub = MultibaseDecode(pka);
        if (pub.Length != 32) throw new AidError(nameof(Constants.ERR_SECURITY), "Invalid PKA length");

        // Use NSec for Ed25519 verification
        var algorithm = SignatureAlgorithm.Ed25519;
        var publicKey = PublicKey.Import(algorithm, pub, KeyBlobFormat.RawPublicKey);
        if (!algorithm.Verify(publicKey, baseBytes, signature))
        {
            throw new AidError(nameof(Constants.ERR_SECURITY), "PKA signature verification failed");
        }
    }
}

