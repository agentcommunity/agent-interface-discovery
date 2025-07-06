# Phase 1 - Specification and Core TypeScript Library

Started: 2025-07-05

- **[2025-07-05]** Phase 1 initiated - building the "Source of Truth" and core libraries.
- **[2025-07-05]** Created YAML protocol contract (`protocol/constants.yml`) as single source of truth for all constants, types, and tokens.
- **[2025-07-05]** Implemented deterministic code generation script (`scripts/generate-constants.ts`) with alphabetical sorting for stable diffs.
- **[2025-07-05]** Built core TypeScript library (`@agentcommunity/aid`) with complete API surface: `discover()`, `parse()`, `AidRecordValidator`, and all generated constants.
- **[2025-07-05]** Created CLI tool (`@agentcommunity/aid-doctor`) with `check` and `json` commands, supporting protocol-specific discovery and error codes.
- **[2025-07-05]** Added comprehensive test suite with 11 passing tests covering parser validation, error handling, and edge cases.
- **[2025-07-05]** Successfully built and validated both packages - Phase 1 complete! ✅
- **[2025-07-05]** Fixed ESLint v9 configuration migration from `.eslintrc.json` to `eslint.config.mjs` format, resolved all linting errors, and confirmed `pnpm lint` passes cleanly.
- **[2025-07-05]** **PHASE 1 COMPLETION:** Implemented full spec compliance with all required validations:
  - ✅ Case-insensitive key parsing
  - ✅ Mutual exclusion validation (proto/p fields)
  - ✅ Description length validation (≤ 60 UTF-8 bytes)
  - ✅ Local URI scheme validation for proto=local
  - ✅ Comprehensive test suite with 21 passing tests
  - ✅ Added CI workflow step to prevent generated code drift
  - ✅ All linting and build checks passing
- **[2025-01-30]** **PRODUCTION ENHANCEMENT:** Implemented browser/Node.js split for dual-environment support:
  - ✅ Node.js bundle uses native `dns.promises` module for optimal performance
  - ✅ Browser bundle uses DNS-over-HTTPS (Cloudflare DoH) for browser compatibility
  - ✅ Configured tsup with dual entry points: `src/index.ts` and `src/browser.ts`
  - ✅ Updated package.json with conditional exports: `"."` and `"./browser"`
  - ✅ Generated both ESM and CJS formats with TypeScript declarations
  - ✅ Verified all exports work correctly with parsing functionality
  - ✅ Package now production-ready for both Node.js and browser environments
- **[2025-01-30]** **TEST SUITE OPTIMIZATION:** Fixed test configuration for reliable CI/CD pipeline:
  - ✅ Fixed `aid-doctor` test script to use `vitest run` instead of `vitest` (no more watch mode)
  - ✅ Added basic smoke tests for CLI package to prevent "No test files found" errors
  - ✅ Fixed ESLint issues in test files (path imports, \_\_dirname usage, utf8 encoding)
  - ✅ Corrected package.json export condition order to eliminate build warnings
  - ✅ All tests now run once and complete successfully: 25 total tests passing (21 + 4)
  - ✅ Complete CI pipeline working: `pnpm test && pnpm build && pnpm lint` all pass
- **[2025-01-31]** **SPEC COMPLIANCE FIXES:** Addressed critical and moderate spec violations:
  - ✅ **Critical Fix:** Patched parser to enforce `https://` scheme for all remote protocols (`mcp`, `a2a`, etc.), preventing a URI validation flaw. Added new tests to cover this case.
  - ✅ **Node.js Client:** Replaced native `dns` module with `dns-query` to correctly fetch DNS `TTL` values, ensuring spec-compliant caching is possible.
  - ✅ **Robustness:** Hardened error handling in the Node.js client to use `error.code` instead of fragile string matching. Added `ERR_DNS_LOOKUP_FAILED` to the spec.
  - ✅ **Test Coverage:** Added test case for key-value pairs with empty values to ensure parser rejects them.
  - ✅ All 28 tests and lint checks now passing.
- **[2025-07-05]** **PRE-LAUNCH PATCH:** Fixed additional spec mismatches uncovered during audit:
  - ✅ Generator now maps `errorCodes.*.message` to `ERROR_MESSAGES`, eliminating `undefined` outputs.
  - ✅ Node client: IDN normalization, case-insensitive `v=` detection, protocol-specific subdomain & timeout support.
  - ✅ Implemented redirect-handling security rule (§3): new `enforceRedirectPolicy()` helper and CLI validation with tests.
  - ✅ CLI flags `--protocol` and `--timeout` now respected via updated `discover()` signature.
  - ✅ Linted codebase (unicorn rule) and all tests & lint pass (`pnpm lint` & `pnpm test`).
- **[2025-07-05]** **SECURITY HARDENING:** Updated the official specification (Section 3) with the mandatory "Redirect Handling" rule.

The core library and CLI now enforce this rule, completing all requirements for Phase 1.
