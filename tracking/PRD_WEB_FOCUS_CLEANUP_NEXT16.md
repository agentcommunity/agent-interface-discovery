# Product Requirements Document - Web Focus Cleanup After Next 16 Migration

Status: Proposed  
Owner: Web Working Group  
Editors: Agent Community  
Date: 2026-02-06  
Branch Context: `feat/next16-react19-modernization`

## Problem

The web app was upgraded to Next 16 and React 19, but maintainability and UI stability are still uneven in key workbench paths.

Current pain points:

- Layout scroll behavior can break across `/workbench` modes due to nested full-height and overflow containers.
- Visual tokens are not fully consolidated, which allows unintended color drift such as pink gradient leakage in shared surfaces.
- High complexity in key files slows iteration and increases regression risk:
  - `packages/web/src/components/workbench/tool-blocks.tsx` (557 lines)
  - `packages/web/src/hooks/use-chat-engine.ts` (382 lines)
  - `packages/web/src/components/workbench/generator-panel.tsx` (298 lines)
- Architecture docs and implementation have drifted in places, reducing confidence in intended boundaries.

## Goals

- Stabilize workbench and landing layout behavior with one clear scroll model.
- Reduce component and hook complexity without changing route contracts or spec behavior.
- Consolidate visual tokens so global style changes do not cause cross-page regressions.
- Keep generator and resolver behavior aligned with `packages/docs/specification.md`.
- Improve test coverage for rendering state, route behavior, and critical interaction flows.

## Non-Goals

- No change to public SDK APIs.
- No route or URL changes for `/` or `/workbench`.
- No product-flow rewrite for resolver or generator.
- No change to canonical docs source-of-truth rule. `packages/docs` remains authoritative.

## Users

- Developers maintaining `packages/web`.
- Contributors iterating on resolver and generator UX.
- External docs/rendering systems that consume this repo downstream.

## Scope

In scope:

- `packages/web/src/app/layout.tsx`
- `packages/web/src/app/page.tsx`
- `packages/web/src/app/workbench/page.tsx`
- `packages/web/src/app/globals.css`
- `packages/web/src/components/workbench/**`
- `packages/web/src/components/landing/**`
- `packages/web/src/hooks/use-chat-engine.ts`
- `packages/web/src/hooks/use-discovery.ts`
- `packages/web/src/lib/**` only where needed to support component extraction
- `packages/web/src/tests/**` additions for cleanup regressions
- `packages/web/WORKBENCH_COMPONENTS_2.md` updates to reflect final boundaries

Out of scope:

- Non-web packages in `packages/aid*`, `packages/aid-doctor`.
- Protocol or spec changes in `protocol/constants.yml`.
- External docs platform implementation details.

## Functional Requirements

### 1) Layout and Scroll Stability

- Define a single scroll owner per page surface:
  - App shell may be fixed-height.
  - Active content region handles vertical overflow.
  - No nested scroll containers unless intentionally isolated.
- Ensure both workbench modes (`resolver`, `generator`) can always scroll from top to bottom and return to top.
- Ensure hash mode switch (`#generator`) does not preserve invalid stale scroll offsets.

### 2) Workbench Composition Cleanup

- Split `tool-blocks.tsx` into focused components with stable props:
  - discovery block
  - connection block
  - guidance block
  - shared status and security fragments
- Keep rendered semantics unchanged for existing message types.
- Remove UI logic duplication between discovery and connection paths where possible.

### 3) Chat Engine Cleanup

- Decompose `use-chat-engine.ts` into:
  - reducer and action model module
  - orchestration/service layer for discovery-handshake flow
  - hook wrapper for UI integration
- Preserve existing message contract consumed by `discovery-chat.tsx`.
- Keep `needs_auth` retry behavior unchanged.

### 4) Generator Panel Cleanup

- Split `generator-panel.tsx` into:
  - form state/controller hook
  - preview panel
  - validation summary block
  - examples import/patch helper
- Keep API call contract for `/api/generator/validate` unchanged.
- Keep support for v1.1 fields and alias toggle behavior.

### 5) Visual Token Hygiene

- Move color and gradient usage to explicit token utilities.
- Remove or isolate any legacy gradient classes that can leak across unrelated surfaces.
- Keep design refresh cosmetic only:
  - no route changes
  - no interaction model rewrite

### 6) Documentation and Drift Control

- Update `packages/web/WORKBENCH_COMPONENTS_2.md` to match implemented module boundaries.
- Add short architecture notes in cleanup files where logic extraction is non-obvious.

## Interface and Contract Impact

No breaking public interfaces.

Internal module additions are expected:

- `packages/web/src/components/workbench/blocks/*`
- `packages/web/src/hooks/chat-engine/*`
- `packages/web/src/components/workbench/generator/*`

Existing route and API contracts must remain backward compatible:

- `/`
- `/workbench`
- `/api/generator/validate`
- `/api/handshake`

## Acceptance Criteria

1. Scrolling is stable on landing and workbench pages in desktop and mobile viewports.
2. No pink or unintended gradient bleed appears unless explicitly used by local component styles.
3. `tool-blocks.tsx`, `use-chat-engine.ts`, and `generator-panel.tsx` are split into smaller modules with equivalent behavior.
4. Existing tests pass, and new regression tests cover:
   - workbench mode switching and scroll behavior
   - discovery and connection rendering states
   - generator preview and validation error handling
5. `packages/web/WORKBENCH_COMPONENTS_2.md` matches the implemented architecture.
6. `packages/docs/specification.md` behavior alignment is preserved for generator and handshake routes.

## Test Plan

- Unit tests:
  - reducer transitions for chat engine status and message emissions
  - generator controller update and merge behavior
  - block rendering for success, error, and `needs_auth` states
- Integration tests:
  - `/workbench` resolver flow with example selection
  - hash switch to `#generator` and return to resolver
  - server validation debounce behavior in generator
- Build and quality gates:
  - `pnpm -C packages/web lint`
  - `pnpm -C packages/web type-check`
  - `pnpm -C packages/web test`
  - `pnpm -C packages/web build`

## Implementation Plan

### Phase A - Stabilize shell and scroll

- Normalize shell overflow ownership in:
  - `packages/web/src/app/layout.tsx`
  - `packages/web/src/app/workbench/page.tsx`
  - `packages/web/src/components/workbench/discovery-chat.tsx`
  - `packages/web/src/components/workbench/generator-panel.tsx`
- Add regression tests for scroll and mode transitions.

### Phase B - Extract workbench blocks

- Introduce `workbench/blocks` folder and migrate block subviews from `tool-blocks.tsx`.
- Keep old exports as compatibility wrappers during migration.
- Remove wrappers after tests are green.

### Phase C - Extract chat engine internals

- Create `hooks/chat-engine` modules for reducer, actions, and orchestration.
- Keep `use-chat-engine.ts` as public façade and stable import path.

### Phase D - Extract generator internals

- Add `components/workbench/generator` for preview and validation subcomponents.
- Add `hooks/use-generator-form.ts` for form data and server validation orchestration.

### Phase E - Token cleanup and visual hardening

- Replace direct gradient utilities with controlled tokens.
- Remove unused global style utilities that can cause theme drift.
- Validate landing and workbench style parity in both viewports.

### Phase F - Docs and final verification

- Update architecture documentation.
- Run full web quality gates and capture results in PR summary.

## Risks and Mitigations

- Risk: behavior drift during decomposition.
  - Mitigation: add tests before and during extraction, preserve old wrapper exports until parity.
- Risk: CSS cleanup causes visual regressions.
  - Mitigation: isolate token changes and verify landing and workbench snapshots/screens.
- Risk: extraction increases temporary duplication.
  - Mitigation: do phased moves with quick follow-up dedupe in same cleanup stream.

## Assumptions and Defaults

- Monorepo structure remains unchanged.
- Canonical docs remain in `packages/docs`; external docs are downstream only.
- Cleanup is behavior-preserving by default; any UX change requires explicit follow-up decision.
- Refactor can be split into multiple PRs, but all must target `feat/next16-react19-modernization` until stabilization is complete.
