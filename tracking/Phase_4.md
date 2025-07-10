# Phase 4 Progress Log

## [YYYY-MM-DD] Major Web Workbench Refactor

- Migrated all agent demo domains to new scenario-based manifest files in `packages/web/src/lib/scenarios/`.
- Replaced legacy tool manifest monolith with a simple scenario map; all mock/demo logic is now data-driven.
- Refactored chat engine to a reducer-based state machine with datasource injection (live vs. mock).
- UI now renders only user/assistant/tool_event messages; legacy tool_call and imperative script logic removed.
- All discovery and handshake logic now returns explicit Result<T, E> types for runtime safety.
- Ran `pnpm lint --fix` and began explicit-any cleanup; remaining linter errors are isolated to legacy or transitional code.
- System is now live-first, deterministic, and testable, with demo logic fully isolated from production code.

## [YYYY-MM-DD] Phase 4: CI Hardening & DX Improvements

- **Updated `README.md`**: The root `README.md` now includes a dedicated "Updating Protocol Constants" section, instructing developers to use the `protocol/constants.yml` file and the `pnpm gen` command.
- **Verified CI Pipeline**: Confirmed that the `.github/workflows/ci.yml` pipeline already enforces that any changes to `protocol/constants.yml` must be accompanied by committed generated code, failing the build if they are out of sync.
- **Audited Package READMEs**: Checked language-specific READMEs (`aid-py`) to ensure no outdated instructions on manual constant editing remained.
- **Prepared `.cursorrule` Update**: Specified the required changes for the project's `.cursorrule` to reflect `protocol/constants.yml` as the single source of truth and to update the "update constants" trigger.

## [YYYY-MM-DD] Unified Constant Generation & Cross-Language Parity (Phase 2 & 3)

Successfully executed the plan for Phase 2 and 3, establishing a single source of truth for protocol constants and verifying that all three language implementations (TypeScript, Go, Python) are fully synchronized and passing tests.

### Phase 2: Generator Rewrite

- **Upgraded `scripts/generate-constants.ts`**: The script now reads from `protocol/constants.yml` and generates constant files for all three target languages.
- **Implemented Go Constant Generation**:
  - A new `generateGoConstants` function was added to the script.
  - It produces a new file, `packages/aid-go/constants_gen.go`, which is now the canonical source for Go constants.
  - **Critical Fix**: Corrected the generator to output `PascalCase` names for Go constants (e.g., `SpecVersion` instead of `spec_version`), making them exported and visible across the `aid` package. This was the root cause of the initial Go build failures.
- **Removed Legacy Code**: The old, manually-maintained `packages/aid-go/constants.go` was deleted to prevent conflicts.
- **Updated Go Source Files**: All files in `packages/aid-go/` (`parser.go`, `discover.go`, `error.go`) were updated to use the new, correctly-cased constants from `constants_gen.go`.

### Phase 3: Repo-Wide Validation

- **Synchronized Constants**: Ran `pnpm gen` to ensure all constant files were up-to-date from the YAML source.
- **Fixed and Verified Test Suite**: The main `pnpm test` command was failing for both Go and Python. The following fixes were implemented:
  - **Go**: The build and test failures were resolved by the `PascalCase` generator fix from Phase 2. The tests in `packages/aid-go/` now pass correctly.
  - **Python**: Addressed a `pytest: command not found` error within the `pnpm`/`turbo` execution environment. The fix involved two steps in `packages/aid-py/package.json`:
    1. Separated dependency installation into its own `install-dev` script: `pip install -e '.[dev]'`.
    2. Changed the `test` script to the more robust `python3 -m pytest`.
- **Achieved Full Parity**: After the fixes, the entire test suite now runs successfully, confirming that the TypeScript, Python, and Go implementations are aligned and behave identically as per the parity tests.

TODO:
Phase 1 is now complete—`specification.md` and `protocol/constants.yml` are in perfect sync (all tokens, TTLs, local-scheme list, and the five error codes including `ERR_DNS_LOOKUP_FAILED` are present and identical).

Below is the detailed roadmap starting at **Phase 2**, with every file that will be touched and the exact order of execution.

─────────────────────────────────
PHASE 2 — Rewrite & Extend the Generator  
(machine source → all SDKs)

1. **Upgrade dev deps**
   • `pnpm add -Dw ts-morph` (for simple TypeScript AST traversal, optional but handy)

2. **`scripts/generate-constants.ts`**
   _Remove YAML→TS→Py only flow; replace with a single YAML→multi-lang emitter._

   a. **Load YAML**

   ```ts
   import { parse } from 'yaml';
   const data = parse(fs.readFileSync('protocol/constants.yml', 'utf8'));
   ```

   b. **Type guards** (fail fast if the YAML is malformed).

   c. **Generator functions**
   1. `generateTypeScriptConstants(data) → packages/aid/src/constants.ts`  
      (already exists; just drop message→description fallback)
   2. `generatePythonConstants(data) → packages/aid-py/aid_py/constants.py`  
      (already exists; adjust naming)
   3. **`generateGoConstants(data)`** → write  
       `packages/aid-go/constants_gen.go`  
       `go
      // Code generated by scripts/generate-constants.ts; DO NOT EDIT.
      package aid
      const (
          SPEC_VERSION = "aid1"
          PROTO_MCP    = "mcp"
          ...
          ERR_DNS_LOOKUP_FAILED = 1004
      )
      var ErrorMessages = map[int]string{
          1004: "The DNS query failed for a network-related reason",
          ...
      }
      `
      d. **Formatting** – run Prettier for TS / Py, `go fmt` for the Go file (spawn `goimports` or `gofmt`).

   e. **CLI messages**: print each output path for CI logs.

3. **Delete legacy manual Go constants**
   • Remove `packages/aid-go/constants.go` (or leave but strip duplicated values and have it re-export from `constants_gen.go`).

4. **Patch Go source that imports constants**  
   • Search & replace `constants.go` identifiers if paths change (usually no edits needed because package name stays `aid`).

5. **`go mod tidy`**  
   • Run once to clean go.sum after file change.

─────────────────────────────────
PHASE 3 — Repo-wide Validation

1. **Run generator**

   ```bash
   pnpm gen
   ```

2. **Run full test matrix**

   ```bash
   pnpm test        # turbo: TS vitest, Py pytest, Go go test
   ```

3. **If Go linter is used** (e.g., `golangci-lint`)  
   • Ensure the generated file passes `go vet` / lints.

─────────────────────────────────
PHASE 4 — CI Hardening & Developer Experience

1. **GitHub Action step** (`.github/workflows/ci.yml`)

   ```yaml
   - name: Generate constants
     run: pnpm gen

   - name: Ensure generated files are committed
     run: git diff --exit-code
   ```

   Fails PRs where YAML and generated outputs diverge.

2. **Update `.cursorrule`**
   _Single Source-of-Truth Map_  
   | Area | Canonical Location |
   |------|--------------------|
   | **Spec + Rationale** | `packages/docs/specification.md` |
   | **Protocol constants (machine)** | `protocol/constants.yml` |

   _Trigger_ “update constants” ⇒ “Edit `protocol/constants.yml`; run `pnpm gen`; commit both YAML and generated files.”

3. **Docs updates**
   • Root `README.md`:
   ```
   ### Updating protocol constants
   1. Edit protocol/constants.yml
   2. Run pnpm gen
   3. Run pnpm test
   ```
   • Python / Go READMEs no longer mention manual constant edits.

─────────────────────────────────
PHASE 5 — Cleanup & Future-proofing

1. **Remove spec parsing code** in generator (we now rely solely on YAML).
2. **Add `scripts/check-spec-sync.ts`** (optional)  
   • Parse `specification.md` tables (using `marked`)  
   • Compare to YAML; CI warns if docs drift.

3. **Onboard new language in future**  
   • Add `<lang>Constants` generation function in the same script, point to new path.

With this sequence everything compiles at each step, CI never turns red, and the repo ends with a single YAML source feeding every SDK plus a doc-drift guard.
