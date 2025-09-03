---
title: 'Protocols & Auth Tokens'
description: 'Supported proto and auth tokens with record examples'
icon: material/format-list-bulleted
---

# Protocols & Auth

## Supported `proto` tokens

- mcp — Model Context Protocol endpoint (JSON-RPC)
- openapi — URL to an OpenAPI document (JSON/YAML)
- a2a — URL to an A2A AgentCard (`agent.json`)
- local — Local execution URI (e.g., `docker:`, `npx:`, `pip:`)

Examples

```text
v=aid1;uri=https://api.example.com/mcp;proto=mcp;desc=Example MCP
v=aid1;uri=https://api.example.com/openapi.json;proto=openapi;desc=Public API
v=aid1;uri=https://agent.example.com/agent.json;proto=a2a;desc=AgentCard
v=aid1;uri=docker://my/image:tag;proto=local;desc=Local Agent
```

## Auth hints (`auth`)

- none — No authentication required
- apikey — Static API key header or query param
- pat — Personal access token
- basic — HTTP Basic
- mtls — Mutual TLS
- oauth2_code — OAuth 2.0 Authorization Code
- oauth2_device — OAuth 2.0 Device Code
- custom — Provider-defined

Example with auth

```text
v=aid1;uri=https://api.example.com/mcp;proto=mcp;auth=pat;desc=Example MCP
```

Notes

- Prefer `proto`; `p` is a shorthand alias (don't set both).
- `desc` is optional, ≤ 60 UTF-8 bytes.
- Remote protocols must use `https://`; `local` uses approved schemes.
- Use the [aid-doctor CLI](../aid_doctor.md) to validate your protocol implementation and generate compliant records.

## See also

- [Quick Start index](./quickstart/index.md)
- [Troubleshooting](./troubleshooting.md)
- [Conformance](./conformance.md)
