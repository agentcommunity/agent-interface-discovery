# Agent Report: Rust / .NET / Java Implementations

- Branch: `feat/aid-java`
- Scope: Ensure Rust (`aid-rs`), .NET (`aid-dotnet`), and Java (`aid-java`) libraries align with the AID v1.0.0 specification and repository docs, with deterministic codegen and green builds.

## Summary

- Implementations across Rust, .NET, and Java align with `packages/docs/specification.md` and follow the contract-first `protocol/constants.yml` model.
- Codegen (`pnpm gen`) is deterministic across all languages; CI generator check passes (fixed Rust array formatting). Java constants are generated when `packages/aid-java` exists.
- Java module added with Gradle, parser, tests; Rust and .NET updated for parity and spec completeness.

## Spec Alignment Checklist (all three languages)

- Version: `SPEC_VERSION = "aid1"` (Appendix B) ✓
- Protocol tokens: `mcp`, `a2a`, `openapi`, `local` (Appendix B) ✓
- Auth tokens: `none`, `pat`, `apikey`, `basic`, `oauth2_device`, `oauth2_code`, `mtls`, `custom` (Appendix A) ✓
- Error codes: `1000..1004` with symbolic mapping (Table 1 / Appendix C) ✓
- DNS constants: `DNS_SUBDOMAIN = "_agent"`, TTL min/max = `300/900` (Section 4) ✓
- Local URI schemes for `proto=local`: `docker`, `npx`, `pip` (Appendix B) ✓
- Parser rules (Section 2.1/2.3):
  - Semicolon-delimited `key=value`, `trim()`, unknown keys ignored ✓
  - Required: `v`, `uri`, `proto` (or alias `p`); `proto` and `p` are mutually exclusive ✓
  - Case-insensitive keys; tokens are case-sensitive ✓
  - `desc` ≤ 60 UTF‑8 bytes ✓
  - Remote URIs must be `https://` and valid URL ✓
  - Local URIs must use allowed schemes ✓
  - Errors map to standardized codes and messages ✓

## Rust (`packages/aid-rs/`)

- Files:
  - `src/constants_gen.rs` (generated)
  - `src/errors.rs`, `src/record.rs`, `src/parser.rs`, `src/lib.rs`
  - `tests/` (existing basic tests)
- Implementation:
  - Exposes `parse` returning `AidRecord`, and `AidError` with numeric codes.
  - Validates required fields, alias exclusivity, version, tokens, `desc` byte length, remote/local URI rules.
  - Uses generated `LOCAL_URI_SCHEMES` array.
- Codegen updates:
  - Normalized `LOCAL_URI_SCHEMES` to single-line array for deterministic diffs in CI.
- Commands:
  - Generate: `pnpm gen`
  - Build/Test: `cargo build -q --manifest-path packages/aid-rs/Cargo.toml && cargo test -q --manifest-path packages/aid-rs/Cargo.toml`

## .NET (`packages/aid-dotnet/`)

- Files:
  - `src/Constants.g.cs` (generated)
  - `src/Parser.cs`, `src/Errors.cs`, `src/Record.cs`, `src/AidDiscovery.csproj`
  - `AidDiscovery.sln`
- Implementation:
  - `Aid.Parse(string)` returns `AidRecord`; `AidError : Exception` exposes `Code` and `ErrorCode`.
  - Uses reflection to derive protocol/auth tokens from generated constants.
  - Switched to generated `Constants.LocalUriSchemes` for local protocol validation.
  - Parser enforces all spec validation rules.
- Codegen updates:
  - Added `LocalUriSchemes` emission to `Constants.g.cs` for parity with spec Appendix B.
- Commands:
  - Generate: `pnpm gen`
  - Build/Test: `dotnet build packages/aid-dotnet/AidDiscovery.sln && dotnet test packages/aid-dotnet/AidDiscovery.sln`

## Java (`packages/aid-java/`)

- Files (new):
  - `build.gradle`, `settings.gradle`
  - `src/main/java/org/agentcommunity/aid/{Constants.java,AidRecord.java,AidError.java,Parser.java}`
  - `src/test/java/org/agentcommunity/aid/ParityTest.java`
  - `README.md`
- Implementation:
  - `Parser.parse(String)` returns `AidRecord`; `AidError extends RuntimeException` with `int code` and `String errorCode`.
  - Parser mirrors TS/Py/Go validation rules; ignores unknown keys; checks `desc` byte length (UTF‑8); uses `https://` for remote; validates local schemes from generated constants.
  - Tests load `test-fixtures/golden.json` (minimal JSON parser to avoid extra deps) and assert valid/invalid cases and error mapping.
- Codegen integration:
  - Generator writes `Constants.java` when `packages/aid-java` exists, including `LOCAL_URI_SCHEMES`.
- Commands:
  - Generate: `pnpm gen`
  - Build/Test: `./gradlew :aid-java:build :aid-java:test`

## Deterministic Codegen & CI

- `scripts/generate-constants.ts` emits synchronized constants for TS, Python, Go, Rust, .NET, and Java.
- Fixes applied:
  - Java: added `LOCAL_URI_SCHEMES` emission.
  - Rust: single-line `LOCAL_URI_SCHEMES` to satisfy CI diff check.
  - .NET: added `LocalUriSchemes` array; parser switched to generated constants.
- `pnpm gen` leaves no diffs on the branch; CI “generated code up-to-date” check passes.

## Alignment with Repository Docs

- `README.md`:
  - Contract-first workflow via `protocol/constants.yml` adhered to; all three languages now consume generated constants.
  - No DNS discovery included (in-scope per README and spec).
- `.github/ARCHITECTURE.md`:
  - Monorepo architecture followed; new Java package added under `packages/` with language-specific tooling.
  - Builds and tests use ecosystem-native tools (Gradle, dotnet, cargo), matching “idiomatic libraries” principle.

## Acceptance

- Java: Gradle build/tests green; `pnpm gen` writes `Constants.java`; no diff after regeneration.
- Rust: Constants format deterministic; parses and compiles; uses generated schemes.
- .NET: Constants include schemes; parser references generated constants; builds on .NET environment (CI-dependent).

## Next Steps (Optional)

- Add Rust and .NET to README packages table once marked public/ready.
- Add minimal unit tests for .NET and Rust parity against `test-fixtures/golden.json` if desired in CI.
- Consider adding a small conformance runner for .NET and Rust similar to `aid-conformance` approach.
