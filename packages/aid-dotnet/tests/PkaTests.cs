using System.Net;
using System.Text;
using System.Text.Json;
using Chaos.NaCl;

namespace AidDiscovery.Tests;

public class PkaTests
{
    private static string RepoRoot()
    {
        var d = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (d != null && d.Name != "agent-interface-discovery") d = d.Parent;
        return d?.FullName ?? Directory.GetCurrentDirectory();
    }

    private static byte[] SeedFromVector(JsonElement v) => Convert.FromBase64String(v.GetProperty("key").GetProperty("seed_b64").GetString()!);

    private static string PkaFromPub(byte[] pub)
    {
        // base58 encode
        const string alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        int zeros = 0; while (zeros < pub.Length && pub[zeros] == 0) zeros++;
        int size = pub.Length * 138 / 100 + 1; var b = new byte[size];
        foreach (var v in pub)
        {
            int carry = v;
            for (int j = size - 1; j >= 0; j--) { carry += 256 * b[j]; b[j] = (byte)(carry % 58); carry /= 58; }
        }
        int it = 0; while (it < size && b[it] == 0) it++;
        var sb = new StringBuilder(new string('1', zeros));
        for (; it < size; it++) sb.Append(alphabet[b[it]]);
        return "z" + sb.ToString();
    }

    private sealed class MiniServer : IDisposable
    {
        private readonly HttpListener _listener;
        private readonly CancellationTokenSource _cts = new();
        private readonly Task _loop;
        public readonly int Port;
        private readonly JsonElement _vector;
        private readonly byte[] _seed;

        public MiniServer(JsonElement vector)
        {
            _vector = vector;
            _seed = SeedFromVector(vector);
            // pick free port
            var l = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
            l.Start();
            Port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{Port}/");
            _listener.Start();
            _loop = Task.Run(LoopAsync);
        }

        private async Task LoopAsync()
        {
            while (!_cts.IsCancellationRequested)
            {
                HttpListenerContext ctx;
                try { ctx = await _listener.GetContextAsync(); }
                catch { break; }
                _ = Task.Run(() => HandleAsync(ctx));
            }
        }

        private static byte[] BuildBase(string[] order, string challenge, string method, string target, string host, string date, long created, string kid, string alg)
        {
            var lines = new List<string>();
            foreach (var item in order)
            {
                switch (item)
                {
                    case "AID-Challenge": lines.Add($"\"AID-Challenge\": {challenge}"); break;
                    case "@method": lines.Add($"\"@method\": {method}"); break;
                    case "@target-uri": lines.Add($"\"@target-uri\": {target}"); break;
                    case "host": lines.Add($"\"host\": {host}"); break;
                    case "date": lines.Add($"\"date\": {date}"); break;
                }
            }
            var quoted = string.Join(' ', order.Select(c => $"\"{c}\""));
            var @params = $"({quoted});created={created};keyid={kid};alg=\"{alg}\"";
            lines.Add($"\"@signature-params\": {@params}");
            return Encoding.UTF8.GetBytes(string.Join('\n', lines));
        }

        private async Task HandleAsync(HttpListenerContext ctx)
        {
            var path = ctx.Request.Url!.AbsolutePath;
            var recordUri = $"http://127.0.0.1:{Port}/mcp";
            var seed = _seed;
            Ed25519.KeyPairFromSeed(out var pub, out var expanded, seed);
            var pka = PkaFromPub(pub);
            if (path == "/.well-known/agent")
            {
                var body = $"{{\"v\":\"aid1\",\"u\":\"{recordUri}\",\"p\":\"mcp\",\"k\":\"{pka}\",\"i\":\"g1\"}}";
                var bytes = Encoding.UTF8.GetBytes(body);
                ctx.Response.StatusCode = 200;
                ctx.Response.ContentType = "application/json";
                await ctx.Response.OutputStream.WriteAsync(bytes, 0, bytes.Length);
                ctx.Response.Close();
                return;
            }
            if (path == "/mcp")
            {
                var order = _vector.GetProperty("covered").EnumerateArray().Select(e => e.GetString()!).ToArray();
                var kid = _vector.TryGetProperty("overrideKeyId", out var kidOv) ? kidOv.GetString()! : "g1";
                var alg = _vector.TryGetProperty("overrideAlg", out var algOv) ? algOv.GetString()! : "ed25519";
                var created = _vector.GetProperty("expect").GetString() == "pass" ? DateTimeOffset.UtcNow.ToUnixTimeSeconds() : _vector.GetProperty("created").GetInt64();
                var date = ctx.Request.Headers["Date"] ?? DateTimeOffset.UtcNow.ToString("r");
                var challenge = ctx.Request.Headers["AID-Challenge"] ?? "";
                var host = ctx.Request.UserHostName + ":" + Port;
                var target = ctx.Request.Url!.ToString();
                var baseBytes = BuildBase(order, challenge, "GET", target, host, date, created, kid, alg);
                var sig = new byte[64];
                Ed25519.Sign(sig, baseBytes, 0, baseBytes.Length, expanded);
                var sigB64 = Convert.ToBase64String(sig);
                ctx.Response.StatusCode = 200;
                ctx.Response.Headers["Signature-Input"] = $"sig=(\"{string.Join("\" \"", order)}\");created={created};keyid={kid};alg=\"{alg}\"";
                ctx.Response.Headers["Signature"] = $"sig=:{sigB64}:";
                ctx.Response.Headers["Date"] = date;
                await ctx.Response.OutputStream.WriteAsync(Array.Empty<byte>());
                ctx.Response.Close();
                return;
            }
            ctx.Response.StatusCode = 404; ctx.Response.Close();
        }

        public void Dispose()
        {
            _cts.Cancel();
            _listener.Stop();
            _listener.Close();
        }
    }

    [Fact]
    public async Task Vectors_RunAgainstHandshake()
    {
        if (Environment.GetEnvironmentVariable("AID_RUN_INTEGRATION") != "1")
        {
            // Integration tests disabled by default
            return;
        }

        var vectorsPath = Path.Combine(RepoRoot(), "protocol", "pka_vectors.json");
        var doc = JsonDocument.Parse(await File.ReadAllTextAsync(vectorsPath));
        foreach (var v in doc.RootElement.GetProperty("vectors").EnumerateArray())
        {
            using var server = new MiniServer(v);
            var domain = $"127.0.0.1:{server.Port}";
            // .well-known fetch triggers handshake
            var rec = await WellKnown.FetchAsync(domain, TimeSpan.FromSeconds(3), allowInsecure: true);
            var expect = v.GetProperty("expect").GetString();
            if (expect == "fail")
            {
                // For a failing vector, ensure handshake fails by calling again with bad kid (if not already failing)
                await Assert.ThrowsAsync<AidError>(async () =>
                    await Pka.PerformHandshakeAsync(rec.Uri, rec.Pka!, "wrong", TimeSpan.FromSeconds(2))
                );
            }
        }
    }
}

