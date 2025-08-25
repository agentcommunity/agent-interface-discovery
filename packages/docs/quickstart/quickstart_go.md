---
title: 'Quickstart — Go'
description: 'Discover agents using the Go library'
icon: material/language-go
---

# Go

## Install

```bash
go get -u github.com/agentcommunity/agent-interface-discovery/aid-go
```

## Discover by Domain

```go
package main

import (
    "fmt"
    "log"
    "time"

    aid "github.com/agentcommunity/agent-interface-discovery/aid-go"
)

func main() {
    rec, ttl, err := aid.Discover("supabase.agentcommunity.org", 5*time.Second)
    if err != nil { log.Fatal(err) }
    fmt.Println(rec.Proto, rec.URI, rec.Desc, ttl)
}
```

## Parse Raw TXT

```go
rec, err := aid.Parse("v=aid1;uri=https://api.example.com/mcp;proto=mcp;desc=Example")
if err != nil { /* handle */ }
fmt.Println(rec.URI)
```

Errors map to symbolic codes (e.g., `ERR_NO_RECORD`) and numeric codes (1000..1004).

## See also

- [Quick Start index](./index.md)
- [TypeScript / Node.js](./quickstart_ts.md)
- [Browser](./quickstart_browser.md)
- [Python](./quickstart_python.md)
- [Java](./quickstart_java.md)
- [.NET](./quickstart_dotnet.md)
- [Protocols & Auth Tokens](../protocols.md)
- [Troubleshooting](../troubleshooting.md)
- [Conformance](../conformance.md)
