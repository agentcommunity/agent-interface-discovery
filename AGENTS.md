# Repository Guidelines

## Project Structure
- PNPM/Turborepo monorepo with 6 languages: TS (`packages/aid`), Go (`packages/aid-go`), Python (`packages/aid-py`), Rust (`packages/aid-rs`), .NET (`packages/aid-dotnet`), Java (`packages/aid-java`).
- Workbench UI: `packages/web` (Next.js). CLI: `packages/aid-doctor`.
- Spec source of truth: `protocol/constants.yml`. See `.github/ARCHITECTURE.md` and `packages/docs/specification.md` for design and normative details.
- Workbench architecture: `WORKBENCH_COMPONENTS.md`.

## Build, Test, Develop
- Install: `pnpm i` (Node ≥ 18.17, PNPM ≥ 8).
- Dev: `pnpm dev:core` (libs), `pnpm dev:web` (workbench), or `pnpm dev:all`.
- Build/Test: `pnpm build`, `pnpm test`; E2E: `pnpm e2e`.
- Parity: `pnpm test:parity` runs TS + Go + Python parity suite.
- Codegen after spec edits: `pnpm gen` (commit YAML + generated outputs).

## Workbench & CLI
- Workbench: `pnpm -C packages/web dev` → open `http://localhost:3000`. Component/engine details in `WORKBENCH_COMPONENTS.md`.
- CLI (aid-doctor):
  - Local run: `pnpm -C packages/aid-doctor build && node packages/aid-doctor/dist/cli.js check <domain>`
  - Dev watch: `pnpm -C packages/aid-doctor dev`
  - Global: `pnpm i -g @agentcommunity/aid-doctor && aid-doctor check <domain>`

## Style & Conventions
- TypeScript: strict, ES2022; `tsup` emits ESM/CJS + d.ts. 2‑space indent, lowercase/kebab filenames, prefer named exports.
- Lint/format: ESLint (incl. `unicorn`) + Prettier via Husky/lint-staged.
- Tests: `*.test.ts` (TS), `*_test.go` (Go).

## Testing
- TS: `pnpm -C packages/aid test` or `pnpm -C packages/aid run test:coverage`.
- Go: `go test ./...` in `packages/aid-go`.
- Python: `python3 -m pip install -e './packages/aid-py[dev]' && python3 -m pytest packages/aid-py`.
- E2E validates showcase domains used by the workbench.

## Commits & PRs
- Conventional commits (e.g., `feat(aid): add DoH client`). Add a Changeset for user-visible changes.
- PRs: include tests, pass `turbo run build test lint`, update docs and `tracking/PHASE_X.md` if applicable. Follow `.github/pull_request_template.md`.

## Agent-Specific Notes
- For agent behavior, protocol tokens, and record format, read `packages/docs/specification.md` and `agent.md` (context and workflows). Use `_agent.<domain>` TXT per spec.
