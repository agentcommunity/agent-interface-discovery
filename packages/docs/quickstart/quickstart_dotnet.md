---
title: 'Quickstart — .NET'
description: 'Parse AID records in .NET'
icon: material/language-csharp
---

# .NET

The .NET package provides parsing and constants; DNS discovery is out-of-scope.

## Parse Raw TXT

```csharp
using AidDiscovery;

var rec = Aid.Parse("v=aid1;uri=https://api.example.com/mcp;proto=mcp;desc=Example");
Console.WriteLine($"proto={rec.Proto}, uri={rec.Uri}");
```

Errors: `AidError : Exception` exposes `.ErrorCode` (symbol) and `.Code` (number).

## See also

- [Quick Start index](./index.md)
- [TypeScript / Node.js](./quickstart_ts.md)
- [Browser](./quickstart_browser.md)
- [Go](./quickstart_go.md)
- [Python](./quickstart_python.md)
- [Java](./quickstart_java.md)
- [Protocols & Auth Tokens](../protocols.md)
- [Troubleshooting](../troubleshooting.md)
- [Conformance](../conformance.md)
