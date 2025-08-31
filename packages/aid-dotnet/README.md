# AidDiscovery (.NET)

Minimal .NET library for Agent Interface Discovery (AID) parsing and constants.

- Target framework: `net8.0`
- No external runtime dependencies
- DNS discovery is intentionally out of scope

## v1.1 Notes (PKA + .well-known)

This library supports the v1.1 fields `pka`/`kid` and the PKA handshake (Ed25519 HTTP Message Signatures). It also includes a guarded `.well-known` fallback helper for environments where DNS is restricted.

- Multibase public key: `pka` uses base58btc (`z...`).
- Handshake: verifies required covered fields, `created` ±300s, HTTP `Date` ±300s, `alg="ed25519"`, `keyid` matches `kid`.
- Verification backend: add one of the following to enable signature verification:
  - `Chaos.NaCl` (Ed25519) – simplest path
  - `NSec.Cryptography` – alternative

### Example: .well-known fallback + handshake

```csharp
using AidDiscovery;

// Fetch from https://<domain>/.well-known/agent and validate
var record = await WellKnown.FetchAsync(
    domain: "example.com",
    timeout: TimeSpan.FromSeconds(2),
    allowInsecure: false // set true for local http testing only
);

Console.WriteLine($"{record.Proto} at {record.Uri}");
// If record.Pka != null, handshake already ran inside FetchAsync
```

### Example: Handshake only

```csharp
using AidDiscovery;

// After parsing a TXT or loading from elsewhere
var rec = Aid.Parse("v=aid1;uri=https://api.example.com/mcp;p=mcp;k=zBase58Key;i=g1");
await Pka.PerformHandshakeAsync(rec.Uri, rec.Pka!, rec.Kid!, TimeSpan.FromSeconds(2));
```

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
