# @agentcommunity/aid-conformance

## 1.2.0

### Minor Changes

- Align with the v1.2.0 release line.

### Patch Changes

- Updated dependencies
  - @agentcommunity/aid@1.2.0

## 1.1.0

### Minor Changes

- a36c55c: feat: introduce `@agentcommunity/aid-conformance` public package exposing shared `golden.json` fixtures and a tiny Node runner for parser parity across languages.
- 0f3e163: feat: v1.1 discovery parity across SDKs
  - DNS-first discovery with protocol-specific flow on request
  - Optional `.well-known` JSON fallback (HTTPS-only, JSON, ≤64KB, ~2s timeout, no redirects; TTL=300 on success)
  - Optional PKA endpoint proof (Ed25519 HTTP Message Signatures)
  - TypeScript: unchanged API; Python: optional camelCase kwargs aliases; Go/Rust: options form added; .NET/Java: new top-level discover APIs
  - Docs updated (Quickstarts, Discovery API Reference)

### Patch Changes

- Updated dependencies [0f3e163]
- Updated dependencies [0f3e163]
  - @agentcommunity/aid@1.1.0
