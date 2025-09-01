using System.Text.Json;

namespace AidDiscovery.Tests;

public class ParityTests
{
    private record FixtureRecord(string name, string raw, Dictionary<string, string> expected);
    private record FixtureRoot(List<FixtureRecord> records);

    [Fact]
    public void GoldenParity()
    {
        var fixturePath = FindFixturePath();
        var json = File.ReadAllText(fixturePath);
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var fx = JsonSerializer.Deserialize<FixtureRoot>(json, opts)!;

        foreach (var rec in fx.records)
        {
            var parsed = Aid.Parse(rec.raw);
            var got = new Dictionary<string, string>
            {
                ["v"] = parsed.V,
                ["uri"] = parsed.Uri,
                ["proto"] = parsed.Proto,
            };
            if (parsed.Auth is not null) got["auth"] = parsed.Auth;
            if (parsed.Desc is not null) got["desc"] = parsed.Desc;
            if (parsed.Docs is not null) got["docs"] = parsed.Docs;
            if (parsed.Dep is not null) got["dep"] = parsed.Dep;
            if (parsed.Pka is not null) got["pka"] = parsed.Pka;
            if (parsed.Kid is not null) got["kid"] = parsed.Kid;

            Assert.Equivalent(rec.expected, got);
        }
    }

    private static string FindFixturePath()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null)
        {
            var candidateDir = Path.Combine(dir.FullName, "test-fixtures");
            var candidateFile = Path.Combine(candidateDir, "golden.json");
            if (File.Exists(candidateFile)) return candidateFile;
            dir = dir.Parent;
        }
        throw new FileNotFoundException("Could not locate test-fixtures/golden.json");
    }
}