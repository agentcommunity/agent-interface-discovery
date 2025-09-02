---
title: 'aid-doctor E2E Tests'
description: 'Running end-to-end checks for the CLI'
icon: material/test-tube
---

# aid-doctor E2E

This package includes a lightweight E2E harness for `@agentcommunity/aid-doctor`.

## Where tests live

- Package: `packages/e2e-tests`
- Entrypoints:
  - `src/aid_doctor.e2e.ts` – JSON smoke plus PKA loopback check
  - `src/pka_e2e.ts` – Spins a local HTTP server implementing `.well-known` and a signed handshake

## Running

```bash
pnpm -C packages/aid-doctor build
pnpm -C packages/e2e-tests e2e
pnpm -C packages/e2e-tests e2e:pka
```

Notes:

- The PKA test uses `AID_ALLOW_INSECURE_WELL_KNOWN=1` with loopback only.
- The JSON smoke test hits `simple.agentcommunity.org` and asserts the CLI JSON shape.

## CI integration

- Include `pnpm -C packages/aid-doctor build` before invoking E2E to ensure the CLI binary exists.
- For fully offline pipelines, stub DNS/HTTP and point the JSON smoke to local fixtures.
