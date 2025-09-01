# AGENTS.md

## Source of truth

- Edit `protocol/constants.yml` for constants and record shapes
- Normative text lives here: `packages/docs/specification.md`

## After edits

```bash
pnpm gen
```

## Generated outputs

The `pnpm gen` command generates language-specific constants from `protocol/constants.yml`:

- **TypeScript**: `packages/aid/src/constants.ts`, `protocol/spec.ts`
- **Python**: `packages/aid-py/aid_py/constants.py`
- **Go**: `packages/aid-go/constants_gen.go`
- **Rust**: `packages/aid-rs/src/constants_gen.rs`
- **.NET**: `packages/aid-dotnet/src/Constants.g.cs`
- **Java**: `packages/aid-java/src/main/java/org/agentcommunity/aid/Constants.java`

## Commit process

Always commit the YAML source plus all generated outputs together to maintain consistency across languages.

## Style

- Use short sentences and active voice
- No em dash
- Keep examples runnable
- Cross-link to TS types in `packages/aid/src` when helpful
