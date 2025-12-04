### Workbench Architecture v1.3 – Components and Data Flow

## Overview

This document describes the updated v1.3 workbench with:

- Security-aware discovery
- Protocol-aware connection handling via modular registry (MCP, A2A, OpenAPI, GraphQL, gRPC, WebSocket, Local, Zeroconf)
- A2A Agent Card fetching and display
- Improved auth error UX with protocol-appropriate prompts
- Spec-compliant generator driven by server validation (aid-engine)
- Compact UI that separates logic from presentation

## File Map (key paths)

```
packages/web/
  src/components/workbench/
    discovery-chat.tsx        # Chat UI container (resolver)
    generator-panel.tsx       # Thin generator UI (form + previews)
    example-picker.tsx        # Quick-access buttons for demo domains
    v11-fields/
      core-fields.tsx         # Protocol/Auth/URI/Domain
      metadata-fields.tsx     # Desc (≤60 bytes)/Docs/Dep picker
      security-fields.tsx     # PKA/KID + optional PKA generator
    tool-blocks.tsx           # Discovery/Connection blocks w/ protocol guidance
    tool-call-block.tsx       # Generic expandable container
    a2a-card.tsx              # A2A Agent Card display component
    auth-prompts/             # Modular auth prompt components
      index.tsx               # Routes to appropriate prompt by authType
      auth-prompt.tsx         # Generic token input
      pat-prompt.tsx          # PAT-specific prompt
      oauth-prompt.tsx        # OAuth2 device/code flow prompts
      local-cli-notice.tsx    # Local CLI required notice

  src/app/api/
    generator/validate/route.ts # Server validation via aid-engine (SSOT)
    handshake/route.ts          # Protocol-aware proxy using protocol registry

  src/hooks/
    use-chat-engine.ts        # Conversation state machine
    use-discovery.ts          # Resolver (browser)
    use-connection.ts         # Handshake client hook + types (AgentCard, AuthRequiredError)

  src/lib/protocols/          # Protocol handler registry (NEW)
    index.ts                  # Registry and handleProtocol() function
    types.ts                  # ProtocolHandler, ProtocolResult, AgentCard interfaces
    utils.ts                  # Helper functions (isLocalScheme, isSecureScheme, etc.)
    handlers/
      mcp.ts                  # MCP SDK handshake handler
      a2a.ts                  # A2A agent card fetcher
      guidance.ts             # Generic guidance for other protocols

  src/lib/datasources/
    types.ts                  # Datasource interface + HandshakeOptions
    live-datasource.ts        # Real network operations
    mock-datasource.ts        # Mock for demos/tests

  src/lib/generator/
    core.ts                   # Lightweight client helpers (UI only)
    types.ts                  # Form data + validation types

  src/generated/
    examples.ts               # Auto-generated from protocol/examples.yml
    spec.ts                   # Mirrored from protocol/spec.ts

  src/components/ui/
    codeblock.tsx             # Constrained previews (mobile-safe)
    dep-picker.tsx            # Calendar → ISO 8601 Z
    pka-key-generator.tsx     # WebCrypto keypair (client only)
    security-badge.tsx        # Status chip (DNSSEC/PKA/TLS)
    tls-inspector.tsx         # TLS validity/expiry summary
```

## Core Concepts

- **Single Source of Truth (SSOT)**: Validation and TXT building are performed on the server using aid-engine. The browser provides fast, lightweight checks for UX only.
- **Protocol Agnostic Discovery**: AID discovers agents regardless of protocol; the workbench provides appropriate guidance for each.
- **Modular Protocol Registry**: Each protocol has a dedicated handler class, making it easy to add new protocols.
- **Progressive Disclosure**: Security elements and details are visible but unobtrusive (badges; drawers).
- **Separation of Concerns**: UI components are small and declarative; server routes handle validation and protocol logic.

## Protocol Registry Architecture

The protocol handling system is built around a registry pattern in `src/lib/protocols/`:

### ProtocolHandler Interface

```typescript
interface ProtocolHandler {
  token: ProtocolToken; // 'mcp' | 'a2a' | 'openapi' | etc.
  canConnect: boolean; // Whether direct connection is supported
  handle(options: ProtocolHandlerOptions): Promise<ProtocolResult>;
}
```

### Protocol Handlers

| Handler           | File                   | Behavior                                             |
| ----------------- | ---------------------- | ---------------------------------------------------- |
| `MCPHandler`      | `handlers/mcp.ts`      | MCP SDK handshake, returns capabilities              |
| `A2AHandler`      | `handlers/a2a.ts`      | Fetches `/.well-known/agent.json`, returns AgentCard |
| `GuidanceHandler` | `handlers/guidance.ts` | Returns protocol-specific guidance (no connection)   |

### Adding a New Protocol

1. Create `handlers/newproto.ts` implementing `ProtocolHandler`
2. Register in `index.ts`: `handlers.set('newproto', new NewProtoHandler())`
3. UI auto-adapts via `ProtocolGuidanceView` or custom component

## Protocol-Aware Connection Handling

The workbench supports all 8 AID protocol tokens:

| Protocol    | Connection Behavior                                | Handler           |
| ----------- | -------------------------------------------------- | ----------------- |
| `mcp`       | Full MCP SDK handshake, shows capabilities         | `MCPHandler`      |
| `a2a`       | Fetches Agent Card, shows skills/auth requirements | `A2AHandler`      |
| `openapi`   | Shows OpenAPI guidance (spec URL, tools)           | `GuidanceHandler` |
| `graphql`   | Shows GraphQL guidance (introspection, clients)    | `GuidanceHandler` |
| `grpc`      | Shows gRPC guidance (grpcurl commands)             | `GuidanceHandler` |
| `websocket` | Shows WebSocket guidance (connection info)         | `GuidanceHandler` |
| `local`     | Shows CLI command (npx/docker/pip)                 | `GuidanceHandler` |
| `zeroconf`  | Shows mDNS/DNS-SD guidance                         | `GuidanceHandler` |

### Data Flow (Protocol Handling)

1. Discovery returns `proto` and `auth` fields from TXT record
2. `use-chat-engine` passes `proto` and `authHint` to `datasource.handshake()`
3. `/api/handshake` uses `handleProtocol()` from the registry:
   - If `mcp`: `MCPHandler` performs MCP SDK handshake
   - If `a2a`: `A2AHandler` fetches agent card from `/.well-known/agent.json`
   - If other: `GuidanceHandler` returns protocol-specific guidance
4. `ConnectionToolBlock` renders:
   - MCP: capabilities list + security badges
   - A2A: `A2ACardView` component with skills/auth info
   - Other: `ProtocolGuidanceView` with next steps

### ProtocolResult Interface

```typescript
interface ProtocolResult {
  success: boolean;
  proto: ProtocolToken;
  data?: { protocolVersion; serverInfo; capabilities; security }; // MCP
  agentCard?: AgentCard; // A2A
  guidance?: ProtocolGuidance; // Other protocols
  needsAuth?: boolean;
  compliantAuth?: boolean;
  metadataUri?: string;
  error?: string;
}
```

### AgentCard Interface (A2A)

```typescript
interface AgentCard {
  name: string;
  description?: string;
  url: string;
  provider?: { organization: string; url?: string };
  skills?: Array<{ id: string; name: string; description?: string }>;
  authentication?: { schemes: string[]; credentials?: string };
}
```

### ProtocolGuidance Interface

```typescript
interface ProtocolGuidance {
  canConnect: false;
  title: string; // e.g., "GraphQL Agent Discovered"
  description: string; // Protocol explanation
  command?: string; // For local protocols (npx:, docker:)
  docsUrl?: string; // Link to protocol docs
  nextSteps: string[]; // Numbered action items
}
```

## Auth Error Handling

Auth errors are handled with protocol-appropriate prompts via `AuthPrompts` component:

### Auth Type Decision Tree

```
needsAuth = true?
├── URI scheme is local (npx:, docker:, pip:)?
│   └── Show LocalCliNotice + command
├── auth field = 'pat'?
│   └── Show PatPrompt + token input
├── auth field = 'oauth2_device'?
│   └── Show OAuthPrompt (device flow)
├── auth field = 'oauth2_code'?
│   └── Show OAuthPrompt (code flow)
├── compliantAuth = true?
│   └── Show OAuthPrompt with metadata
└── Default
    └── Show generic token input
```

### AuthRequiredError

```typescript
class AuthRequiredError extends Error {
  readonly needsAuth = true;
  constructor(
    message: string,
    public readonly compliantAuth?: boolean,
    public readonly metadataUri?: string,
    public readonly metadata?: unknown,
    public readonly authType?: 'local_cli' | 'pat' | 'oauth2_device' | 'oauth2_code' | 'compliant' | 'generic',
  );
}
```

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

## Resolver – Responsibilities

Discovery (use-discovery.ts)

- Browser discover (fast), returns record and simple TXT reconstruction
- Security badges (DNSSEC/PKA) and TLS inspector are rendered in tool-blocks

Connection (use-connection.ts → /api/handshake)

- Uses protocol registry to handle all protocol types
- Fetches A2A agent cards for `proto=a2a`
- Proxies MCP handshake for `proto=mcp`
- Returns guidance for other protocols
- Surfaces needs_auth flows with appropriate authType

## Examples System

Examples are defined in `protocol/examples.yml` and auto-generated via `pnpm gen`:

- **Terraform**: `showcase/terraform/examples.tf` (DNS records)
- **Web UI**: `packages/web/src/generated/examples.ts` (button data)

Categories:

- `BASIC_EXAMPLES`: Educational (Simple, Local Docker, PKA Basic, etc.)
- `REAL_WORLD_EXAMPLES`: Live services (Supabase, Auth0, Firecrawl, Playwright)
- `PROTOCOL_EXAMPLES`: Protocol showcase (A2A, GraphQL, gRPC)
- `OTHER_CHAT_EXAMPLES`: Error cases (No Server, Deprecated, Secure)

## Security Surfaces

- Badges: DNSSEC signed, PKA present/verified, TLS valid/expiring/invalid
- Discovery/Connection "Security details" drawers list warnings/errors from the engine or proxy

## Mobile and Accessibility

- Inline previews are width-constrained and truncate gracefully on mobile
- Block previews scroll horizontally as needed
- Form controls use accessible labels and small, consistent spacing

## Testing Notes

- Unit tests cover: byte calculators, dep ISO format, TXT builder edge cases
- E2E: DNS/handshake flows exercised via live examples and the proxy
- Protocol guidance: test with A2A/GraphQL/gRPC showcase domains

## Extensibility

- **New protocols**: Create handler in `src/lib/protocols/handlers/`, register in `index.ts`
- **New spec keys**: Add to server route mapping and optional UI rendering; UI stays stable
- **New security indicators**: Add a SecurityBadge or drawer entry; no layout churn
- **New examples**: Add to `protocol/examples.yml`, run `pnpm gen`
- **New auth types**: Add case to `AuthPrompts` component and create prompt component
