using System.Net.Http.Json;
using System.Text.Json;
using System.Text;

namespace AidDiscovery;

public static class WellKnown
{
    private static string CanonicalizeToTxt(JsonElement obj)
    {
        static string? GetStr(JsonElement root, string k)
            => root.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
        var v = GetStr(obj, "v");
        var uri = GetStr(obj, "uri") ?? GetStr(obj, "u");
        var proto = GetStr(obj, "proto") ?? GetStr(obj, "p");
        var auth = GetStr(obj, "auth") ?? GetStr(obj, "a");
        var desc = GetStr(obj, "desc") ?? GetStr(obj, "s");
        var docs = GetStr(obj, "docs") ?? GetStr(obj, "d");
        var dep = GetStr(obj, "dep") ?? GetStr(obj, "e");
        var pka = GetStr(obj, "pka") ?? GetStr(obj, "k");
        var kid = GetStr(obj, "kid") ?? GetStr(obj, "i");
        var sb = new StringBuilder();
        if (v != null) sb.Append($"v={v};");
        if (uri != null) sb.Append($"uri={uri};");
        if (proto != null) sb.Append($"proto={proto};");
        if (!string.IsNullOrEmpty(auth)) sb.Append($"auth={auth};");
        if (!string.IsNullOrEmpty(desc)) sb.Append($"desc={desc};");
        if (!string.IsNullOrEmpty(docs)) sb.Append($"docs={docs};");
        if (!string.IsNullOrEmpty(dep)) sb.Append($"dep={dep};");
        if (!string.IsNullOrEmpty(pka)) sb.Append($"pka={pka};");
        if (!string.IsNullOrEmpty(kid)) sb.Append($"kid={kid};");
        return sb.ToString().TrimEnd(';');
    }

    public static async Task<AidRecord> FetchAsync(string domain, TimeSpan timeout, bool allowInsecure = false)
    {
        var scheme = allowInsecure ? "http" : "https";
        var url = $"{scheme}://{domain}/.well-known/agent";
        using var http = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false }) { Timeout = timeout };
        using var res = await http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
        if (!res.IsSuccessStatusCode) throw new AidError(nameof(Constants.ERR_FALLBACK_FAILED), $"Well-known HTTP {(int)res.StatusCode}");
        var ct = res.Content.Headers.ContentType?.MediaType?.ToLowerInvariant() ?? string.Empty;
        if (!ct.StartsWith("application/json")) throw new AidError(nameof(Constants.ERR_FALLBACK_FAILED), "Invalid content-type for well-known (expected application/json)");
        var data = await res.Content.ReadAsByteArrayAsync().ConfigureAwait(false);
        if (data.Length > 64 * 1024) throw new AidError(nameof(Constants.ERR_FALLBACK_FAILED), "Well-known response too large (>64KB)");
        JsonDocument doc;
        try { doc = JsonDocument.Parse(data); }
        catch { throw new AidError(nameof(Constants.ERR_FALLBACK_FAILED), "Invalid JSON in well-known response"); }
        if (doc.RootElement.ValueKind != JsonValueKind.Object) throw new AidError(nameof(Constants.ERR_FALLBACK_FAILED), "Well-known JSON must be an object");
        string txt = CanonicalizeToTxt(doc.RootElement);
        var record = Aid.Parse(txt);
        if (record.Pka is not null)
        {
            await Pka.PerformHandshakeAsync(record.Uri, record.Pka, record.Kid ?? string.Empty, timeout).ConfigureAwait(false);
        }
        return record;
    }
}

