---
"@agentcommunity/aid": minor
"@agentcommunity/aid-doctor": minor
"@agentcommunity/aid-conformance": minor
---

feat: v1.1 discovery parity across SDKs

- DNS-first discovery with protocol-specific flow on request
- Optional `.well-known` JSON fallback (HTTPS-only, JSON, ≤64KB, ~2s timeout, no redirects; TTL=300 on success)
- Optional PKA endpoint proof (Ed25519 HTTP Message Signatures)
- TypeScript: unchanged API; Python: optional camelCase kwargs aliases; Go/Rust: options form added; .NET/Java: new top-level discover APIs
- Docs updated (Quickstarts, Discovery API Reference)
