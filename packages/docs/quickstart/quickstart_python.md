---
title: 'Quickstart — Python'
description: 'Discover agents using the Python package'
icon: material/language-python
---

# Python

## Install

```bash
pip install aid-discovery
```

## Discover by Domain

```python
from aid_py import discover, AidError

try:
    result = discover("supabase.agentcommunity.org")
    print(result.record.proto, result.record.uri, result.record.desc, result.ttl)
except AidError as e:
    print(e.code, e)
```

## Parse Raw TXT

```python
from aid_py import parse
rec = parse("v=aid1;uri=https://api.example.com/mcp;proto=mcp;desc=Example")
print(rec.uri)
```

Note: Package is published on PyPI as `aid-discovery`.

## See also

- [Quick Start index](./index.md)
- [TypeScript / Node.js](./quickstart_ts.md)
- [Browser](./quickstart_browser.md)
- [Go](./quickstart_go.md)
- [Java](./quickstart_java.md)
- [.NET](./quickstart_dotnet.md)
- [Protocols & Auth Tokens](../protocols.md)
- [Troubleshooting](../troubleshooting.md)
- [Conformance](../conformance.md)
