---
title: 'Quickstart — Java'
description: 'Parse AID records in Java'
icon: material/language-java
---

# Java

The Java package provides parsing and constants; DNS discovery is out-of-scope.

## Parse Raw TXT

```java
import org.agentcommunity.aid.Parser;
import org.agentcommunity.aid.AidRecord;

public class Main {
  public static void main(String[] args) throws Exception {
    AidRecord rec = Parser.parse("v=aid1;uri=https://api.example.com/mcp;proto=mcp;desc=Example");
    System.out.println(rec.uri);
  }
}
```

Errors: `AidError` exposes `.errorCode` (symbol) and `.code` (number).

## See also

- [Quick Start index](./index.md)
- [TypeScript / Node.js](./quickstart_ts.md)
- [Browser](./quickstart_browser.md)
- [Go](./quickstart_go.md)
- [Python](./quickstart_python.md)
- [.NET](./quickstart_dotnet.md)
- [Protocols & Auth Tokens](../protocols.md)
- [Troubleshooting](../troubleshooting.md)
- [Conformance](../conformance.md)
