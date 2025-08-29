# Workbench: Spec Adapters + Web Spec Codegen

Date: 2025-08-28
Branch: feat/optimize_workbench

## Summary

Modernized the workbench internals to be upgrade-friendly as the spec grows, without changing the UI or linear flow. Added a thin adapter layer and generated a small web-facing spec module from `protocol/constants.yml`. Completed the auth retry loop and documented a future well‑known fallback.

## Changes

- Added spec adapter scaffolding (non-breaking):
  - `packages/web/src/spec-adapters/` with canonical types and `v1` adapter.
  - Engine calls adapter after discovery/handshake for forward compatibility.

- Completed auth retry flow:
  - `use-chat-engine`: emits a final `connection_result` on `PROVIDE_AUTH` retry (success/error).
  - `discovery-chat`: wires auth prompt to dispatch token back to the engine.

- Spec generation for Web:
  - Generator now emits `packages/web/src/generated/spec.ts` from `protocol/constants.yml`.
  - Includes `SPEC_VERSION`, tokens, error catalog, DNS/local schemes, and minimal `AidRecordV1`/`HandshakeV1`.
  - Kept small and tree‑shakeable; generator is commented and resilient to Prettier parser edge cases.

- Documentation:
  - `WORKBENCH_COMPONENTS.md`: Added Spec Upgrade Guide and Well‑Known Fallback (Future) sections.
  - `.github/ARCHITECTURE.md`: Documented spec code generation outputs (including the new web module) and how UI consumes them via adapters.

## Affected Files (Key)

- `packages/web/src/spec-adapters/{types.ts,v1.ts,index.ts}`
- `packages/web/src/hooks/use-chat-engine.ts`
- `packages/web/src/components/workbench/discovery-chat.tsx`
- `scripts/generate-constants.ts` (adds web spec output + robust formatting)
- `WORKBENCH_COMPONENTS.md` (guide + future plan)
- `.github/ARCHITECTURE.md` (spec codegen docs)

## Dev Notes

- Run: `pnpm gen` → `pnpm dev:web` (or `pnpm dev:all`).
- Parity: `pnpm test:parity` (TS/Go/Python).
- UI/UX unchanged; adapter shields UI from future spec churn.
- Generator escapes error messages and falls back to unformatted output if Prettier parsing fails (valid TS is still written).

## Future (Not Implemented)

- Well‑Known fallback (pending spec): DNS → well‑known over HTTPS as a guarded server route. Adapters/UI remain unchanged; only datasource/proxy additions required once spec lands.

