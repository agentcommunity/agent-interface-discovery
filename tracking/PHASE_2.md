# Phase 2 - Multi-Language Support & Ecosystem Expansion

Started: 2025-07-06

- **[2025-07-06]** Phase 2 initiated – multi-language support (Python & Go) and showcase zone work has begun.
- **[2025-07-06]** Python package scaffolded (`packages/aid-py`): added `pyproject.toml`, README, and initial `aid_py` module with API stubs. Updated monorepo README and verified tests/lint remain green.
- **[2025-07-06]** Implemented full Python parser (`aid_py/parser.py`) + constants, added pytest suite (6 tests) – all tests pass.
- **[2025-07-06]** Added DNS-based `discover()` in Python using dnspython; wrote 2 unit tests (total Python tests now 8) – all pass.
- **[2025-07-06]** Ported Go implementation (`packages/aid-go`): constants, `AidError`, parser, DNS-based `Discover`, and 5 unit tests – all pass (`go test ./...`).
- **[2025-07-06]** Added CycloneDX SBOM generation step to CI workflow (`ci.yml`) covering Node, Python & Go dependencies.
- **[2025-07-06]** Added cross-language parity tests (`parity.*`) reading shared `test-fixtures/golden.json`; implemented in TypeScript, Python & Go – all pass locally.
- **[2025-07-06]** Scaffolded Vercel DNS IaC: added `showcase/terraform/main.tf` (Terraform + vercel provider) and GitHub Actions workflow `showcase-dns.yml` for plan/apply.
- **[2025-07-06]** Finalised showcase TXT records (7 total) in `showcase/terraform/main.tf` – simple, local-docker, messy, multi-string, supabase, auth0, openai.
- **[2025-07-07]** Deployed live showcase DNS records to production on `agentcommunity.org` using Terraform and GitHub Actions after resolving Vercel provider issues. All 7 showcase records are now live and verifiable via `dig`.
- **[2025-07-07]** Added live E2E test suite (`packages/e2e-tests`) and integrated into Turbo + CI. All 7 showcase domains validated successfully.
- **[2025-07-07]** Terraform TTL set to 360 s for all showcase records; spec updated with DNSSEC guidance.
- **[2025-07-07]** Hardened parser & discovery client: trims whitespace, ignores unknown keys, duplicate-key detection. E2E suite now fully green in CI.

## Next Milestones (Planned)

1. **Showcase DNS Zone (`showcase.aid.agentcommunity.org`)** ✅ **Done**
   - ~~Register / configure sub-domain in DNS provider.~~
   - Published the 7 planned reference records (simple, local-docker, messy, multi-string, supabase, auth0, openai) to the apex domain `agentcommunity.org`.
   - Terraform Infrastructure-as-code is live and managing all records.
2. **E2E Test Suite (`e2e/` workspace)** ✅ **Done**
   - New Turbo pipeline: `turbo run e2e`.
   - Tests invoke CLI (`aid-doctor`) against live showcase records and assert `exit 0`.
   - Run nightly in CI; fail build on regression.
3. **Cross-Language Parity Checks** ✅ **Done (initial set)**
   - Added shared JSON fixtures under `test-fixtures/`.
   - Implemented parity tests across TS (`vitest`), Python (`pytest`), and Go (`go test`).
4. **Packaging & Release Prep**
   - Python: wheel + sdist via `build` / `twine check`.
   - Go: `go mod tidy`; set semantic import version if v1 tag prepped.
   - TypeScript: bump to `0.2.0-beta` with Changeset.
5. **Documentation Sync**
   - Update `packages/docs/*` to include multi-language examples.
   - Run `spec sync` to regenerate constants (sanity guard).
6. **Automated SBOM generation (security rule §6)** ✅ **Done**
   - CycloneDX GitHub Action configured in `ci.yml`; outputs `sbom.xml` as build artifact.
7. **Progress Gates**
   - Mark each bullet complete in this file + open a Phase 2 PR checklist.
