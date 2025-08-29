### Updated Workbench Component Architecture

## 🎯 Overview

The workbench is a script-based AI agent thought process simulator that shows users how AI agents discover and connect to MCP servers through a realistic chat interface. It is powered by a central "chat engine" that manages all state and logic, while the UI components act as simple renderers.

**Recent architectural changes have extracted core logic into reusable packages, improving maintainability and separating concerns.**

## 📁 File Structure

```
packages/
├── web/                            # The Next.js UI Application
│   ├── src/components/workbench/
│   │   ├── generator-panel.tsx     # NEW: Thin UI layer for the generator
│   │   ├── discovery-chat.tsx      # Main UI orchestrator for resolver
│   │   ├── tool-call-block.tsx     # Generic expandable tool UI
│   │   └── ...
│   ├── src/hooks/
│   │   └── use-chat-engine.ts      # The stateful "brain" of the application
│   └── src/lib/
│       ├── tool-manifests.tsx      # NOW: Exports logic functions
│       ├── tool-manifest-data.ts   # NEW: Contains all static manifest objects
│       └── tool-manifest-types.ts  # NEW: Contains all shared types
│
└── web-generator/                  # NEW: UI-agnostic core package
    └── src/index.ts                # Exports buildTxtRecord() and validateTxtRecord()
```

## 🧩 Component & Logic Breakdown

### 1. **Codebase Refactoring & Core Packages (Recent Improvement)**

**Role:** To create a more maintainable, scalable, and reusable architecture.

**What we did:**

- **`@agentcommunity/aid-web-generator` Package:** All UI-agnostic logic for building and validating AID records was extracted from `GeneratorPanel` into this new, self-contained package.
- **Data/Logic Separation:** Static data (the large `toolManifests` object) was moved into `tool-manifest-data.ts`, separating it from the logic in `tool-manifests.tsx`. Shared types were centralized in `tool-manifest-types.ts`.
- **Codebase Hardening:** Systematically resolved all linter errors across the web application, enforcing full type safety, robust promise handling, and modern JavaScript conventions.

---

### 2. **useChatEngine Hook** (`hooks/use-chat-engine.ts`)

**Role:** The stateful "brain" of the application. It manages the entire conversation session from start to finish.

**What it does:**

- Manages all application state (`messages`, `status`, etc.).
- Provides a `dispatch` function to receive commands (`SUBMIT_DOMAIN`, `PROVIDE_AUTH`).
- Loads the appropriate tool manifest for a given domain from `tool-manifest-data.ts`.
- Executes the manifest's script step-by-step, orchestrating narrative and tool calls.
- Records tool results and makes them available to subsequent narrative steps for context-aware responses.

---

### 3. **GeneratorPanel** (`components/workbench/generator-panel.tsx`)

**Role:** A thin UI layer for the AID record generator.

**What it does:**

- Renders the form inputs (URI, protocol, auth, etc.).
- Manages the local form state.
- **Delegates all core logic:** Calls `buildTxtRecord()` and `validateTxtRecord()` from the `@agentcommunity/aid-web-generator` package to generate the preview and show validation status.
- Focuses entirely on presentation, making it a "dumb" component driven by the core logic package.

---

### 4. **DiscoveryChat** (`discovery-chat.tsx`)

**Role:** The main UI component for the resolver, acting as a "dumb" renderer for the engine's state.

**What it does:**

- Calls `useChatEngine()` to get the current state and `dispatch` function.
- Renders the list of messages provided by the engine.
- Uses a `switch` on message type to render the correct component (user bubble, tool block, etc.).
- Dispatches commands to the engine based on user actions.

---

### 5. **Tool Manifests System** (`lib/tool-manifest-data.ts` & `lib/tool-manifests.tsx`)

**Role:** Declarative "screenplays" for the agent simulation.

- **`tool-manifest-data.ts`:** Contains the large `Record` of `ToolManifest` objects. This is the single source of truth for all demo scenarios and their scripts.
- **`tool-manifests.tsx`:** Contains the _logic_ for interacting with the manifest data, such as `getManifestForDomain()` and `getEnhancedCapability()`.

**Script Structure:**

```typescript
script: [
  { type: 'narrative', content: (results, domain) => 'AI thinking text...' },
  { type: 'tool_call', toolId: 'discovery' },
  // ... and so on
];
```

### 4. **ToolCallBlock** (`tool-call-block.tsx`)

**Role:** Generic expandable UI container for tool executions

**What it does:**

- Displays tool execution with expandable details
- Shows running/success/error status with appropriate icons
- Provides code snippet display with copy-to-clipboard
- Handles expand/collapse animations
- Connection Failure: When a connection fails, the narrative explicitly explains why, differentiating between a discovery failure and a server being offline.

**Visual Features:**

- Status icons (spinner, checkmark, X) with colors
- Expandable content area with smooth transitions
- Code snippet syntax highlighting
- Copy-to-clipboard functionality

---

### 5. **DiscoveryToolBlock & ConnectionToolBlock** (`tool-blocks.tsx`)

**Role:** Specialized tool visualizations for specific operations

**DiscoveryToolBlock:**

- Shows DNS lookup commands (`dig TXT _agent.domain`)
- Displays raw TXT records when found
- Shows parsed agent record details
- Handles discovery errors with detailed feedback
- Timeline view of DNS resolution steps

**ConnectionToolBlock:**

- Shows MCP handshake request code
- Displays JSON response from successful connections
- Shows connection errors and debugging info
- Timeline view of connection establishment

**Both include:**

- Dynamic code snippet generation based on hook state
- Step-by-step progress indicators
- Error state handling with colored indicators

---

### 6. **ToolListSummary** (`tool-list-summary.tsx`)

**Role:** Beautiful final display of available agent capabilities

**What it does:**

- Renders the final list of tools after successful connection
- Shows enhanced capability descriptions
- Uses colored dots to indicate tool vs resource types
- Provides clean, professional capability overview

**Features:**

- Tool categorization (tool vs resource)
- Enhanced descriptions from manifest metadata
- Responsive grid layout
- Fade-in animation

---

### 7. **Typewriter** (`components/ui/typewriter.tsx`)

**Role:** Realistic AI text streaming effect

**What it does:**

- Animates text character-by-character
- Includes blinking cursor effect
- Calls completion callback when finished, which notifies the chat engine to proceed to the next script step.
- Configurable typing speed

---

### 8. **Enhanced Hooks** (`useDiscovery.ts`, `useConnection.ts`)

**Role:** Data fetching with mock support for demos

**Enhanced Features:**

- Accept mock data functions for demo mode
- Simulate realistic network delays (800-1200ms)
- Preserve original API compatibility
- Status management (pending/running/success/error)

**Mock Integration:**
The `useChatEngine` is responsible for calling the hooks' `execute` methods and passing in mock data from the manifest when required. This keeps the hooks themselves clean and reusable.

---

## 🔄 Data Flow

The architecture uses a command-driven, unidirectional data flow.

1.  **User Action:** User clicks an example button or submits the input form.
2.  **Dispatch Command:** The `DiscoveryChat` UI component calls `engine.dispatch({ type: 'SUBMIT_DOMAIN', ... })`.
3.  **Engine State Update:** The `useChatEngine` hook receives the command, clears any old state, adds the new user message to its `messages` array, and sets its status to `running`.
4.  **UI Re-render:** The `DiscoveryChat` component re-renders to show the user's message.
5.  **Script Execution:** The engine begins executing the manifest script. For each step, it pushes a new message object (e.g., `{type: 'assistant', ...}` or `{type: 'tool_call', ...}`) to its state.
6.  **Continuous UI Rendering:** With each state update from the engine, the UI re-renders, showing the new message (e.g., a `Typewriter` appears, or a `ToolCallBlock` shows its "running" state).
7.  **Loop:** This continues until the script is complete.

## 🎨 Visual Design Patterns

- **Chat Interface:** Modern AI chat styling with bubbles
- **Progressive Disclosure:** Tool details expand on demand
- **Status Indicators:** Color-coded (green=success, red=error, blue=running)
- **Typewriter Effects:** Realistic AI text streaming
- **Code Snippets:** Syntax highlighted with copy buttons
- **Animations:** Smooth transitions and fade-ins
- **Tool Manifests:** Add new domains in `tool-manifests.tsx`
- **Example Buttons:** Modify `EXAMPLE_DOMAINS` array
- **Typing Speed:** Adjust `Typewriter` component speed
- **Network Delays:** Configure mock timing in `useConnection.ts`
- **Visual Styling:** Modify colors/animations in component CSS

This architecture cleanly separates concerns: manifests define the "story", the engine handles the "orchestration", and the UI components handle the "presentation". The result is a maintainable, extensible system that feels like watching a real AI agent work.

---

## 🧭 Spec Upgrade Guide (How-To)

Goal: keep the current linear flow (discovery → handshake) while making upgrades fast when the spec adds/changes fields. Follow this playbook whenever `protocol/constants.yml` changes.

### Quick Steps

- Update spec: edit `protocol/constants.yml` and run `pnpm gen`.
- Commit YAML and all generated outputs (CI enforces sync).
- Run locally: `pnpm dev:web` (or `pnpm dev:all`).
- Parity: `pnpm test:parity` for TS/Go/Python consistency.

### Generated Web Spec Module

- `pnpm gen` also emits `packages/web/src/generated/spec.ts` for the Next.js app.
- Exposes: `SPEC_VERSION`, `PROTOCOL_TOKENS`, `AUTH_TOKENS`, `ERROR_CODES`, `ERROR_CATALOG`, `DNS_*`, `LOCAL_URI_SCHEMES`, `AidRecordV1`, `HandshakeV1`.
- UI guidance: Prefer importing these generated constants/types over hardcoding literals. Adapters map spec-shaped data into stable, canonical types for the engine/UI.

### What Changes Where

- Discovery (web): `packages/web/src/hooks/use-discovery.ts`
  - Wraps `@agentcommunity/aid/browser.discover` and returns a UI-friendly `DiscoveryResult`.
  - New record keys from the spec arrive here automatically. If you don’t need to render them, no action required.
  - To render new keys, update `DiscoveryToolBlock` formatting only.

- Handshake (web): `packages/web/src/hooks/use-connection.ts` and proxy `packages/web/src/app/api/handshake/route.ts`
  - Handshake responses are shaped into `HandshakeResult` for the UI.
  - If the spec adds handshake fields, include them as `value.extra.<field>` or render explicitly in `ConnectionToolBlock`.

- Errors and Auth
  - New error codes from the spec can be shown as-is or mapped to friendlier labels in tool blocks.
  - If auth descriptors evolve, extend the proxy’s auth metadata probe and pass through new fields in the `needsAuth` response; the UI will render them where helpful.

### Minimal, Upgrade-Friendly Pattern

- Keep UI stable: Prefer adding new spec fields to an `extra` object in success values and render only when useful.
- Engine remains agnostic: Engine consumes typed results and emits messages; UI decides on presentation.
- Proxy stays strict: For new auth hints/headers, augment the proxy and propagate data rather than branching client logic.

### Step-by-Step Examples

1) New record key (e.g., `region`)
- Edit `protocol/constants.yml` → run `pnpm gen` → commit.
- The key flows through `use-discovery`. To display it:
  - Update `packages/web/src/components/workbench/tool-blocks.tsx` → `DiscoveryToolBlock` to include `region` in the parsed record section.
  - No engine changes needed.

2) New handshake field (e.g., `limits`)
- Update the spec → run `pnpm gen`.
- In `use-connection`, include the new field in the success shape as `value.extra.limits` (if not already returned from the proxy). Render in `ConnectionToolBlock` if desired.

3) New error code/category
- Add to the spec → regenerate.
- Optionally keep a tiny map `code → title/description` in UI or reuse generated catalog (when available) so tool blocks show a friendly label next to the code.

4) New auth descriptor (e.g., richer metadata URI or challenge details)
- Extend the proxy (`/api/handshake`) to pass back the new fields as part of `needsAuth`.
- `use-connection` preserves them on `AuthRequiredError` (e.g., `metadataUri`, `metadata`).
- `ConnectionToolBlock` can render the new fields without engine changes.

### Validation & CI

- Local: `pnpm dev:web` → sanity check demo scenarios and a few real domains.
- Parity: `pnpm test:parity` ensures constants align across TS/Go/Python.
- Commit policy: always include `protocol/constants.yml` + generated outputs in the same PR.

### Notes on Future-Proofing (Optional, Non-Blocking)

- If/when a thin adapter layer and generated web types are added, the upgrade surface gets even smaller:
  - Codegen writes `packages/web/src/generated/spec.ts` (types/constants).
  - Adapters in `packages/web/src/spec-adapters/` map new spec fields into canonical shapes with an `extra` bag.
  - Engine/UI consume canonical types only; spec additions mostly touch the adapter.
- This can be adopted incrementally without changing the UI or flow.

## 🌐 Well-Known Fallback (Future)

Some developers may not control DNS. A spec-compliant fallback via a well-known file can bridge this gap without changing the workbench flow.

Proposed approach (pending spec):

- Discovery strategy chain:
  - First attempt DNS (current behavior).
  - If the error class is “no record/NXDOMAIN”, attempt a well-known fetch over HTTPS.
- Server route: `GET /api/wellknown?domain=<d>`
  - Fetch `https://<domain>/.well-known/agent` (final path TBD by spec; e.g., `/.well-known/aid.json`).
  - Guards: block private IPs (same SSRF guard as `/api/handshake`), 2s timeout, ≤64KB response, JSON content-type.
  - Response: convert to the same record shape as DNS and return as `DiscoveryResult`.
- Datasource integration:
  - Add fallback inside `LiveDatasource.discover(domain)`: DNS → if “no record”, call `/api/wellknown`.
  - Return a unified `DiscoveryResult` with `metadata.source: 'DNS' | 'WELL_KNOWN'` for optional UI hints.
- Adapters:
  - No engine/UI changes needed. `normalizeRecord` handles both inputs; new fields go into `extra`.
- UI (optional polish):
  - `DiscoveryToolBlock` may show a small badge like “Fallback: well-known” based on `metadata.source`.
- Feature flag:
  - Gate behind `NEXT_PUBLIC_FEATURE_WELLKNOWN=true` until the spec merges. Default: off.
- Testing notes:
  - E2E: add a showcase domain serving the well-known file to assert the fallback path.
  - Parity unaffected; the generator and adapters keep types consistent.

Spec impact:

- Once the spec formalizes path/format, `pnpm gen` can add constants to `packages/web/src/generated/spec.ts` (e.g., `WELL_KNOWN_PATH`) and any new record keys. Adapters remain the only place requiring logic updates.

## 🚀 Workbench Improvement Plan (Road to v2)

This section outlines the plan to evolve the workbench from a powerful demo into a production-grade, reliable discovery tool.

### **Phase 1: Robust Error Handling & UI Polish (Immediate Priority) – ✅ _Completed_**

The goal of this phase was to make the application gracefully handle any user input and every possible failure mode, providing clear, educational feedback at each step.

- [x] **Engine-Side Input Validation:**
  - **Missing:** The chat engine currently attempts to process any string submitted by the user, leading to crashes or confusing errors for non-domain inputs.
  - **Done:** `useChatEngine` now validates domain input before starting discovery and shows a friendly assistant message on invalid input.

- [x] **Granular Backend Error Types:**
  - **Missing:** The `/api/discover` endpoint returns generic errors.
  - **Done:** `/api/discover` now surfaces `AidError` codes and numeric constants, enabling manifest-driven narratives.

- [x] **Resilient Chat Engine & Correct Mocking:**
  - **Existing:** The `useChatEngine` hook has been refactored to _not_ halt execution on tool failure. It records the result and allows the script to proceed.
  - **Done:** Engine passes mock data on a per-call basis; live domains bypass mocks, ensuring predictable demos.

- [x] **Intelligent Failure Narratives:**
  - **Missing:** Most manifests assume a "happy path" and proceed with `undefined` values on failure, leading to confusing output.
  - **Done:** Manifests now branch on `results.discovery.success` / `results.connection.success` with clear context-aware messaging.

- [x] **"Live Domain" Unsupported Flow:**
  - **Missing:** Entering a real, non-example domain results in a confusing fallback to the "default-failure" manifest.
  - **Done:** Added `live-unsupported` manifest; `getManifestForDomain()` now falls back to it, providing clear guidance after real discovery.

### **Phase 2: Live Handshake Capability (The Secure Proxy)**

- **Status:** ✅ _Completed 2025-07-07_

| Task                                                                                                    | Status | Notes                                         |
| ------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------- |
| Evaluate `@modelcontextprotocol/sdk` bundle impact (prototype serverless fn, measure size & cold-start) | [x]    | Completed – bundle < 10 MB, cold-start 120 ms |
| Implement **/api/handshake** serverless proxy                                                           | [x]    | Implemented with SSRF guard & transports      |
| Add strict SSRF & timeout safeguards                                                                    | [x]    | Private CIDRs blocked, 2 s timeout            |
| Transport support: WebSocket (`wss://`) and HTTP POST (`https://…/init`)                                | [x]    | Both supported via SDK                        |
| Rate-limit proxy (≤ 5 req/min/IP) & log minimal metadata                                                | [x]    | Basic in-memory limiter added                 |
| Extend `useConnection` to call proxy when no `mockData` provided                                        | [x]    | Live domains now call proxy                   |
| Update manifests (simple, supabase, auth0, messy, etc.) to remove `mockHandshakeResult`                 | [x]    | Mocks removed where live handshake desired    |
| UI polishing: show real capability list or detailed error                                               | [x]    | ToolCallBlock renders live data               |
| Local test harness: tiny in-repo mock MCP server                                                        | [x]    | Added `/tests/mock-server` for CI             |
| CI: run integration test against Vercel preview deployment                                              | [x]    | Added playwright test in `packages/e2e-tests` |

**Decision Gate:** If the SDK prototype fails size/perf budget, pivot to the previously-defined custom minimal implementation and keep the remainder of the checklist unchanged.

### **Phase 3: Auth-Aware Handshake & Real-DNS Cleanup** ✅ _Completed_\*

> We are dropping the "build mock MCP servers" track. Instead, this phase focuses on making the live examples shine by always performing real DNS look-ups and by handling authenticated handshakes gracefully.

| Task                           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Always-Real DNS**         | • Delete the remaining `mockDiscoveryResult` stubs in `tool-manifests.tsx`.<br/>• Discovery hook _always_ queries DNS; mock data is now used only inside isolated unit tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **B. Graceful Auth Handshake** | 1. Extend `/api/handshake` to accept an optional `auth` object (e.g. `{ bearer: "…" }`) and forward it to the MCP SDK.<br/>2. Update `useConnection.execute(uri, opts)` → `opts` gains `{ auth?: { bearer: string } }`.<br/>3. When the proxy gets **401 / 403** it returns `{ needsAuth: true }`.<br/>4. `useChatEngine` maps this to a new message status `needs_auth`.<br/>5. `ConnectionToolBlock` detects that status and renders:<br/> • Explanation "Server requires authentication".<br/> • Password-type input for PAT / OAuth token.<br/> • "Retry" button → dispatches `PROVIDE_AUTH` command to engine → handshake re-runs with token.<br/>6. Nice fallback copy for any other error ("Server reachable but refused unauthenticated init"). |
| **C. Cross-Domain URI Notice** | After discovery, if `record.uri` host ≠ queried domain show an "ℹ️ Served from other host" badge with tooltip linking to spec §cross-host.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **D. Polishing**               | • Support BASIC auth / API-key header patterns.<br/>• Do not store recent tokens in `localStorage` (scoped by host).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **E. example tokens**          | most APIs have test tokens and we can make the auth enter field to "use test token" and we hope we can find one for eahc public MCP APis (if no token avialable the use example does not show)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Effort Estimate**            | ~1 dev-day (backend 1–2h, engine + UI 3–4h, polish/tests 2h).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Once these tasks are completed the workbench will:
• Always demonstrate _real_ DNS behaviour.
• Allow users to supply credentials for live Supabase/Auth0/etc. servers.
• Provide user-friendly messages when auth is missing, instead of generic failures.

_We explicitly skip building standalone mock MCP servers for now — real hosts + the existing mock-data flow are sufficient for demos and testing._

### 9. **Auth-Aware Enhancements (Phase 3.1)**

These improvements make the workbench handle both spec-compliant and legacy MCP servers seamlessly.

**Key Behaviours:**

1. **Automatic Probe:** The `/api/handshake` endpoint performs an unauthenticated `HEAD` request. If the service returns `WWW-Authenticate` with an `as_uri`, the workbench flags the server as **spec-compliant** and fetches its OAuth Protected-Resource Metadata document.
2. **UI Branching:**
   • **Compliant servers** – The returned metadata JSON is rendered in an expandable block, guiding the user through available flows (PAT, OAuth device, mTLS, …).
   • **Legacy servers** – A yellow warning banner appears: _"Server does not implement the latest MCP auth discovery. Provide your PAT token manually."_
3. **Smart Token Prompt:**
   • Uses the `auth` hint from the AID TXT record to tailor the placeholder (e.g. "PAT token", "BASIC token").
   • Token input + "Retry" button are shown immediately (the block auto-expands on error).
4. **Auto-Expanded Blocks:** Connection tool blocks open by default when `needs_auth` or `error` status is set, reducing clicks.

**Updated Components:**

- `useConnection()` — fetches `metadataUri` when available and attaches `metadata` to its result object.
- `ConnectionToolBlock` — displays either the metadata view (spec-compliant) or the legacy notice + token prompt.
- `ToolCallBlock` — supports `defaultExpanded` prop.

These features provide a smooth path today (PATs) while future-proofing for the OAuth-first MCP spec.

### 10. **Mode Switch – Resolver ↔ Generator (Planned)**

A single Workbench page with two interchangeable panels:

| Feature                                                  | Status  |
| -------------------------------------------------------- | ------- |
| Segmented toggle "Resolve / Generate" beneath the title  | ✅ Done |
| Title word cross-fade between _Resolver_ and _Generator_ | ✅ Done |
| `ResolverPanel` (existing chat interface)                | ✅ Done |
| `GeneratorPanel` (form + live TXT preview, reusable)     | ✅ Done |
| Slide / fade animation between panels                    | ✅ Done |
| Preserve footer layout across modes                      | ✅ Done |

Implementation notes:

1. **Shared Title Component**: `TitleSection` component handles consistent branding across both modes.
2. **Clean Mode Switch**: Toggle stored in local state; simplified header without duplicate titles.
3. **Slide Animations**: Smooth opacity + translate effects for panel transitions.
4. **Consistent Layout**: Both panels use same background (`bg-gray-50`) and structure.
5. **Spec Compliance**: Generator uses core `@agentcommunity/aid` library for 100% validation accuracy.
6. **Self-contained Export**: `GeneratorPanel` is exported and can be embedded elsewhere (landing page/docs).

### **Architecture Changes Made**

- ✅ **Removed Duplicate Titles**: Eliminated confusing double-header issue
- ✅ **Shared TitleSection Component**: `components/workbench/title-section.tsx` used by both panels
- ✅ **Clean Mode Switcher**: Header now contains only the toggle, no animated title
- ✅ **Consistent Design**: Both panels follow same layout patterns from discovery-chat.tsx
- ✅ **TypeScript + Build**: All changes compile cleanly with zero errors

---

✅ **Completed Earlier**

- Auth-Aware Handshake detection & UI (Phase 3.1) — _implemented and documented above_.
