# AGENTS.md

## Dev
```bash
pnpm -C packages/web dev
# http://localhost:3000
```

## Generated spec

Canonical generated module: `protocol/spec.ts`.
This app consumes a mirrored copy at `src/generated/spec.ts`. Do not edit either.
Change `protocol/constants.yml` and run `pnpm gen`.

## Engine behavior

* May emit `needs_auth`
* Accept a token, retry once
* Emits `connection_result` with success or error

## Notes

* Spec adapters live in `src/spec-adapters/` (start from `v1.ts`)
* Keep UI types mapped through adapters only
