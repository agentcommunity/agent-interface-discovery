# AGENTS.md

## Source of truth
- Edit `protocol/constants.yml` for constants and record shapes
- Normative text lives here: `packages/docs/specification.md`

## After edits
```bash
pnpm gen
```

Commit the YAML plus generated outputs.

## Style

* Use short sentences and active voice
* No em dash
* Keep examples runnable
* Cross-link to TS types in `packages/aid/src` when helpful
