### Workbench Architecture v1.1 – Components and Data Flow

## Overview

This document describes the updated v1.1 workbench with security-aware discovery, a spec-compliant generator driven by server validation (aid-engine), and a compact UI that separates logic from presentation.

## File Map (key paths)

```
packages/web/
  src/components/workbench/
    discovery-chat.tsx        # Chat UI container (resolver)
    generator-panel.tsx       # Thin generator UI (form + previews)
    v11-fields/
      core-fields.tsx         # Protocol/Auth/URI/Domain
      metadata-fields.tsx     # Desc (≤60 bytes)/Docs/Dep picker
      security-fields.tsx     # PKA/KID + optional PKA generator
    tool-blocks.tsx           # Discovery/Connection blocks w/ security badges + drawers
    tool-call-block.tsx       # Generic expandable container

  src/app/api/
    generator/validate/route.ts # Server validation via aid-engine (SSOT)
    handshake/route.ts          # MCP proxy + security snapshot

  src/hooks/
    use-chat-engine.ts        # Conversation state machine
    use-discovery.ts          # Resolver (browser)
    use-connection.ts         # Handshake client hook

  src/lib/generator/
    core.ts                   # Lightweight client helpers (UI only)
    types.ts                  # Form data + validation types

  src/components/ui/
    codeblock.tsx             # Constrained previews (mobile-safe)
    dep-picker.tsx            # Calendar → ISO 8601 Z
    pka-key-generator.tsx     # WebCrypto keypair (client only)
    security-badge.tsx        # Status chip (DNSSEC/PKA/TLS)
    tls-inspector.tsx         # TLS validity/expiry summary
```

## Core Concepts

- Single Source of Truth (SSOT): Validation and TXT building are performed on the server using aid-engine. The browser provides fast, lightweight checks for UX only.
- Progressive Disclosure: Security elements and details are visible but unobtrusive (badges; drawers).
- Separation of Concerns: UI components are small and declarative; server routes handle validation and protocol logic.

## Generator – Responsibilities

UI (generator-panel.tsx)
- Renders three compact groups:
  - Core: protocol (MCP default), auth, uri, domain
  - Metadata: description (≤60 bytes, live counter), docs (https), dep (calendar → ISO 8601 Z)
  - Security: PKA public key and Key ID (rotation) with a prominent button to reveal the PKA generator
- Shows TXT and .well-known JSON previews
- Alias/Full toggle in the Preview header, annotated with server suggestion (alias when smaller)
- Error block in red, directly under the Preview title

Server validation (/api/generator/validate)
- Inputs: domain, uri, proto, auth, desc, docs, dep, pka, kid, useAliases
- Checks:
  - Required fields (uri, proto)
  - Domain validity (URL/IDNA labels)
  - Description ≤ 60 bytes (UTF‑8)
  - Docs https://
  - Dep format ISO 8601 UTC Z
  - PKA present ⇒ kid required; kid format /^[a-z0-9]{1,6}$/
  - Builds TXT using aid-engine, computes alias vs full, returns suggestAliases
- Returns: { txt, json, bytes, errors, warnings, suggestAliases, success }

Client helpers (lib/generator/core.ts)
- Provide immediate UX feedback (byte counts, simple guards) but defer to server result for final status.

PKA Key Management
- security-fields.tsx introduces a “Public Key for Agents (PKA) Generator” button
- Expands to show pka-key-generator.tsx (WebCrypto) without storing private key
- On generate, sets PKA and defaults KID to g1 if empty
- Inline link to docs: docs.agentcommunity.org/aid/Tools/identity_pka

## Resolver – Responsibilities

Discovery (use-discovery.ts)
- Browser discover (fast), returns record and simple TXT reconstruction
- Security badges (DNSSEC/PKA) and TLS inspector are rendered in tool-blocks

Connection (use-connection.ts → /api/handshake)
- Proxies MCP handshake; surfaces needs_auth flows and security snapshot
- ConnectionToolBlock renders details, including PKA/TLS status badges and security drawer

## Security Surfaces

- Badges: DNSSEC signed, PKA present/verified, TLS valid/expiring/invalid
- Discovery/Connection “Security details” drawers list warnings/errors from the engine or proxy

## Mobile and Accessibility

- Inline previews are width-constrained and truncate gracefully on mobile
- Block previews scroll horizontally as needed
- Form controls use accessible labels and small, consistent spacing

## Data Flow (Generator)

1) User edits fields → local state updates; small client checks run instantly
2) Debounced POST → /api/generator/validate
3) Server (aid-engine) returns normalized outputs and errors/warnings
4) UI renders server TXT/JSON, byte meters, and red error list in preview header
5) Alias toggle updates request/useAliases and re-renders previews

## Data Flow (Resolver)

1) User submits domain → use-chat-engine dispatches
2) Discovery runs (browser) → DiscoveryToolBlock renders TXT/parsed record and security badges
3) Handshake proxy runs → ConnectionToolBlock renders tools or needs_auth flow; security snapshot is shown

## Testing Notes

- Unit tests cover: byte calculators, dep ISO format, TXT builder edge cases
- E2E: DNS/handshake flows exercised via live examples and the proxy

## Extensibility

- New spec keys: add to server route mapping and optional UI rendering; UI stays stable
- New security indicators: add a SecurityBadge or drawer entry; no layout churn
- Additional protocols: extend protocol token/URI checks in the server route


