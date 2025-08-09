using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

namespace AidDiscovery;

public static class Aid
{
    private static readonly HashSet<string> ProtocolTokens =
        typeof(Constants)
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(string) && f.Name.StartsWith("PROTO_"))
            .Select(f => (string)f.GetRawConstantValue()!)
            .ToHashSet(StringComparer.Ordinal);

    private static readonly HashSet<string> AuthTokens =
        typeof(Constants)
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(f => f.IsLiteral && !f.IsInitOnly && f.FieldType == typeof(string) && f.Name.StartsWith("AUTH_"))
            .Select(f => (string)f.GetRawConstantValue()!)
            .ToHashSet(StringComparer.Ordinal);

    private static readonly HashSet<string> LocalUriSchemes = new(StringComparer.Ordinal)
    {
        "docker",
        "npx",
        "pip",
    };

    public static AidRecord Parse(string txt)
    {
        if (txt is null) throw new ArgumentNullException(nameof(txt));
        var raw = ParseRaw(txt);
        return ValidateRecord(raw);
    }

    private static Dictionary<string, string> ParseRaw(string txt)
    {
        var map = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var pair in txt.Split(';'))
        {
            var p = pair.Trim();
            if (p.Length == 0) continue;
            var idx = p.IndexOf('=');
            if (idx <= 0 || idx == p.Length - 1)
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Invalid key-value pair: {p}");
            }
            var key = p[..idx].Trim().ToLowerInvariant();
            var value = p[(idx + 1)..].Trim();
            if (key.Length == 0 || value.Length == 0)
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Empty key or value in pair: {p}");
            }
            if (map.ContainsKey(key))
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Duplicate key: {key}");
            }
            map[key] = value;
        }
        return map;
    }

    private static AidRecord ValidateRecord(Dictionary<string, string> raw)
    {
        if (!raw.TryGetValue("v", out var v))
        {
            throw new AidError(nameof(Constants.ERR_INVALID_TXT), "Missing required field: v");
        }
        if (!string.Equals(v, Constants.SpecVersion, StringComparison.Ordinal))
        {
            throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Unsupported version: {v}. Expected: {Constants.SpecVersion}");
        }

        if (!raw.TryGetValue("uri", out var uri))
        {
            throw new AidError(nameof(Constants.ERR_INVALID_TXT), "Missing required field: uri");
        }

        var hasProto = raw.TryGetValue("proto", out var protoVal);
        var hasP = raw.TryGetValue("p", out var pVal);
        if (hasProto && hasP)
        {
            throw new AidError(nameof(Constants.ERR_INVALID_TXT), "Cannot specify both \"proto\" and \"p\" fields");
        }
        if (!hasProto && !hasP)
        {
            throw new AidError(nameof(Constants.ERR_INVALID_TXT), "Missing required field: proto (or p)");
        }
        var proto = hasProto ? protoVal : pVal;

        if (!ProtocolTokens.Contains(proto))
        {
            throw new AidError(nameof(Constants.ERR_UNSUPPORTED_PROTO), $"Unsupported protocol: {proto}");
        }

        if (raw.TryGetValue("auth", out var auth))
        {
            if (!AuthTokens.Contains(auth))
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Invalid auth token: {auth}");
            }
        }

        if (raw.TryGetValue("desc", out var desc))
        {
            if (Encoding.UTF8.GetByteCount(desc) > 60)
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), "Description field must be ≤ 60 UTF-8 bytes");
            }
        }

        // URI validation
        if (proto == "local")
        {
            if (!IsValidLocalUri(uri))
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Invalid URI scheme for local protocol. Must be one of: {string.Join(", ", LocalUriSchemes)}");
            }
        }
        else
        {
            if (!uri.StartsWith("https://", StringComparison.Ordinal))
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Invalid URI scheme for remote protocol '{proto}'. MUST be 'https:'");
            }
            if (!IsValidHttpsUri(uri))
            {
                throw new AidError(nameof(Constants.ERR_INVALID_TXT), $"Invalid URI format: {uri}");
            }
        }

        return new AidRecord(
            v: Constants.SpecVersion,
            uri: uri,
            proto: proto,
            auth: raw.TryGetValue("auth", out var a) ? a : null,
            desc: raw.TryGetValue("desc", out var d) ? d : null
        );
    }

    private static bool IsValidLocalUri(string uri)
    {
        var match = Regex.Match(uri, "^(?<scheme>[a-zA-Z][a-zA-Z0-9+.-]*):");
        if (!match.Success) return false;
        var scheme = match.Groups["scheme"].Value;
        return LocalUriSchemes.Contains(scheme);
    }

    private static bool IsValidHttpsUri(string uri)
    {
        if (!Uri.TryCreate(uri, UriKind.Absolute, out var u)) return false;
        if (!string.Equals(u.Scheme, Uri.UriSchemeHttps, StringComparison.Ordinal)) return false;
        if (string.IsNullOrEmpty(u.Host)) return false;
        return true;
    }
}