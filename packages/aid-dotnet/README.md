# AidDiscovery (.NET)

Minimal .NET library for Agent Interface Discovery (AID) parsing and constants.

- Target framework: `net8.0`
- No external runtime dependencies
- DNS discovery is intentionally out of scope

## Usage

```csharp
using AidDiscovery;

var rec = Aid.Parse("v=aid1;uri=https://api.example.com/mcp;p=mcp");
Console.WriteLine($"proto={rec.Proto}, uri={rec.Uri}");
```

### Errors

`Aid.Parse` throws `AidError : Exception` on failure.
- `AidError.ErrorCode` is the symbolic code (e.g., `"ERR_INVALID_TXT"`)
- `AidError.Code` is the numeric constant (e.g., `1001`)

## Development

- Generate constants:
  - From repo root: `pnpm gen` (writes `packages/aid-dotnet/src/Constants.g.cs` when the folder exists)
- Build and test:
  - `dotnet build packages/aid-dotnet/AidDiscovery.sln`
  - `dotnet test packages/aid-dotnet/AidDiscovery.sln`

## Packaging

Placeholder for future NuGet publishing.