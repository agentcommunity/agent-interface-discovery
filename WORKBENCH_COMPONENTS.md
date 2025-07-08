# Workbench Component Architecture

## 🎯 Overview

The workbench is a script-based AI agent thought process simulator that shows users how AI agents discover and connect to MCP servers through a realistic chat interface. It is powered by a central "chat engine" that manages all state and logic, while the UI components act as simple renderers.

## 📁 File Structure

```
packages/web/src/components/workbench/
├── discovery-chat.tsx          # Main UI orchestrator component
├── tool-call-block.tsx         # Generic expandable tool UI
├── tool-blocks.tsx             # Specialized discovery/connection blocks
└── tool-list-summary.tsx       # Final capability list display

packages/web/src/lib/
└── tool-manifests.tsx          # Script definitions & mock data

packages/web/src/hooks/
├── useChatEngine.ts            # The stateful "brain" of the application
├── useDiscovery.ts             # DNS discovery hook
└── useConnection.ts            # MCP handshake hook
```

## 🧩 Component Breakdown

### 1. **useChatEngine Hook** (`hooks/useChatEngine.ts`)

**Role:** The stateful "brain" of the application. It manages the entire conversation session from start to finish.

**What it does:**

- Manages all application state, including the message log and tool results.
- Provides a `dispatch` function to receive commands from the UI (e.g., `SUBMIT_DOMAIN`).
- Loads the appropriate tool manifest for the domain.
- Executes the manifest's script step-by-step (narrative → tool → narrative).
- Records tool results and makes them available to subsequent narrative steps.
- Handles success and failure logic, allowing narratives to respond to errors.

---

### 2. **DiscoveryChat** (`discovery-chat.tsx`)

**Role:** The main UI component, acting as a "dumb" renderer for the engine's state.

**What it does:**

- Calls `useChatEngine()` to get the current state (`messages`, `status`) and the `dispatch` function.
- Renders the list of messages provided by the engine.
- Uses a `switch` on the message type to render the correct component (user bubble, assistant typewriter, tool block, etc.).
- Dispatches commands to the engine based on user actions (e.g., clicking an example button or submitting the input form).

**Key Features:**

- Is almost entirely stateless; the engine is the single source of truth.
- Decouples the UI from the business logic, making it easy to change the appearance without affecting the engine.

---

### 3. **Tool Manifests System** (`lib/tool-manifests.tsx`)

**Role:** Declarative conversation flow definitions, or "screenplays" for the agent.

**What it does:**

- Defines complete conversation scripts for each domain
- Provides mock data for realistic demos
- Contains context-aware narrative functions
- Maps domain names to specific agent scenarios

**Key Manifests:**

- `simple.agentcommunity.org` - Basic demo agent
- `supabase.agentcommunity.org` - Database operations
- `auth0.agentcommunity.org` - Identity management
- `messy.agentcommunity.org` - Chaotic experimental agent
- `no-server.agentcommunity.org` - Successful discovery but a failed connection, a common real-world scenario.
- `default-failure` - Handles unknown domains gracefully

**Script Structure:**

```typescript
script: [
  { type: 'narrative', content: (results, domain) => 'AI thinking text...' },
  { type: 'tool_call', toolId: 'discovery' },
  { type: 'narrative', content: (results) => 'AI reasoning about results...' },
  { type: 'tool_call', toolId: 'connection' },
  { type: 'narrative', content: (results) => 'Final summary...' },
];
```

---

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
