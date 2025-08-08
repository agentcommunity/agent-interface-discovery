# AID v1.0.0 Post-Release TODO (Prioritized)

This updates the earlier roadmap based on the v1.0.0 specification. Order: spec conformance → security/reliability → CLI/CI → docs/adoption → showcase → language ports → governance. Follow `.cursorrule` and keep `protocol/constants.yml` as the single source of truth.

## P0 — Spec Conformance & Interop (highest priority)

- [ ] Protocol-specific subdomain format (spec §2.4)
  - Spec uses `_agent._mcp.example.com` (underscore before protocol). Current code and Terraform examples use `_agent.mcp.example.com`.
  - Canonical: base `_agent.<domain>` remains default; protocol-specific subdomains are optional optimization only.
  - Plan: All clients try underscore form first, then non-underscore for backward compatibility.
  - Tasks:
    - [ ] TS (Node/Browser): try `_agent._{proto}.{domain}`, then `_agent.{proto}.{domain}`; add unit tests.
    - [ ] Python: same behavior; tests.
    - [ ] Go: same behavior; tests.
    - [ ] Update docs and Terraform examples to underscore form.
    - [ ] E2E to cover both variants.

- [ ] JSON Schema for AID record (spec §2.1)
  - Publish `@agentcommunity/aid-schema` and include schema in docs.
  - Enforce: `v=aid1`, `proto` xor `p`, `desc` ≤ 60 bytes (UTF-8), `https://` for remote protocols, local scheme allowlist.
  - CI validates fixtures and samples against the schema.

- [ ] Conformance suite package
  - Externalize golden fixtures plus a small runner as `@agentcommunity/aid-conformance` so third-party ports can run parity.

- [ ] Error semantics parity (spec §2.3 table; Appendix C)
  - Ensure symbol → numeric mapping and messages match across TS, Python, Go.

- [ ] Redirect policy helper parity (spec §3)
  - Provide Python and Go equivalents to TS `enforceRedirectPolicy` with tests and usage docs.

## P1 — Security & Reliability

- [ ] DNSSEC options (spec §3)
  - CLI: `--require-dnssec`, `--prefer-dnssec`.
  - Libraries: at minimum expose AD-bit from DoH responses; document full validation paths per language.

- [ ] DoH provider fallback/rotation
  - Support multiple DoH providers (Cloudflare, Google, Quad9) with jitter/backoff; env-configurable.

- [ ] IDN safety hints
  - Aid-doctor warns on potential confusables/homoglyph risks.

- [ ] Local execution guidance (spec §3)
  - Provide guidance/snippets for host apps: consent, fingerprinting, no shell interpretation, sandboxing.

## P2 — CLI & CI Ergonomics

- [ ] Aid-doctor outputs and batch
  - Add `--yaml` and `--plain` (JSON exists), batch from file/stdin, consistent exit codes for CI.

- [ ] GitHub Action
  - `aid-validate` action: validate domains, DNSSEC options, batch input.

- [ ] Coverage & static analysis
  - TS: coverage thresholds. Go: `staticcheck` + `govulncheck`. Python: `ruff`, `mypy`, add `py.typed`.

- [ ] SBOM & dependency audit
  - Emit CycloneDX SBOM; add periodic audit jobs for JS, Python, and Go.

## P3 — Documentation & Adoption

- [ ] New language port guide
  - Scaffold, acceptance criteria, parity instructions, publishing checklist.

- [ ] Registrar playbooks
  - Cloudflare, Route53, Vercel, GCP, Azure: screenshots, TTL 300–900 s, propagation tips.

- [ ] Security best practices
  - DNSSEC, redirect handling, IDN safety, local-exec safeguards, TTL & client caching expectations.

- [ ] Examples gallery
  - Add `examples/_agent.<domain>.txt` samples with multiple protocol/auth variants per `.cursorrule`.

## P4 — Showcase & Terraform

- [ ] Cloudflare provider module (in addition to Vercel)
  - Parameterize TTL; output record URLs; use underscore protocol subdomains.

- [ ] Propagation checks
  - Simple verification script/CI step post-apply with retries.

## P5 — Language Ports (tiered)

- Tier 1: Rust, C#/.NET, Java
  - Criteria: generated constants, parser error parity, discovery with IDN & TTL, conformance suite green, README + examples.
- Tier 2: Swift, Kotlin, Ruby, PHP, Elixir (based on demand)

## P6 — Governance & Registries (spec §6)

- [ ] Token registry repo (`aid-tokens`)
  - PR template and review policy for token additions.

- [ ] Global index/crawler (`aid-registry`)
  - Minimal `_agent` TXT crawler and seed dashboard with a privacy statement.

## Cross-cutting

- [ ] Tracking hygiene
  - Unify `tracking/PHASE_4.md` casing (all-caps). Keep status entries consistent.

- [ ] Docs links audit
  - Ensure README links for `SECURITY.md`, `CODE_OF_CONDUCT.md` resolve; add files if missing.

---

## Suggested execution order

1. P0 Spec Conformance (underscore subdomain support, JSON Schema, conformance suite, error parity, redirect helper parity)
2. P1 Security & Reliability (DNSSEC options, DoH rotation, IDN hints, local-exec guidance)
3. P2 CLI & CI (batch/outputs, GitHub Action, coverage/static checks, SBOM/audits)
4. P3 Docs & Adoption (port guide, registrar playbooks, best practices, examples)
5. P4 Showcase & Terraform (Cloudflare module, propagation checks)
6. P5 Language Ports (Rust/C#/Java → then Swift/Kotlin/Ruby/PHP/Elixir)
7. P6 Governance & Registries (aid-tokens, aid-registry)

Rationale: close spec gaps first to prevent drift, harden security, improve automation, accelerate adoption, then expand language coverage and governance.

---

## Acceptance & PR checklist addendum

- Include unit tests (and integration/E2E where relevant).
- Update docs if public API or behavior changes.
- Add a Changeset and pass `turbo run build test lint`.
- Confirm adherence to `.cursorrule` and reference relevant spec sections.

---

## Branching plan (execution)

Create small, focused branches/PRs and publish in one release train:

- fix/discovery-order
  - Make base `_agent.<domain>` canonical; keep protocol-specific as optional; no breaking changes.
- docs/protocol-subdomains
  - Clarify optional nature of protocol-specific subdomains; emphasize base record.
- feat/aid-conformance
  - New package with fixtures + runner + README.
- ci/parity-gates
  - Wire parity tests for TS/Py/Go; enforce error-code/message parity.
- chore/terraform-showcase (optional)
  - Ensure examples emphasize base record; adjust underscore examples if kept.

Release strategy:

- Merge the above into a short-lived `release/1.0.1` branch; run Changesets to publish one patch for core libs.
- Publish `@agentcommunity/aid-conformance` as a new package.

## Spec extension process (for future proposals)

When expanding the spec (new tokens/fields/rules), follow this process to stay contract-first and multi-language consistent:

1. Proposal issue

- Open an issue labeled `spec-proposal` describing motivation, examples, security implications, and backward compatibility.

2. Draft in docs

- Update `packages/docs/specification.md` (draft PR) with normative language and references; mark changes as “Proposed”.

3. Update canonical constants

- Edit `protocol/constants.yml` only for accepted proposals.
- Run `pnpm gen` to regenerate constants across TS/Py/Go; commit YAML + generated files.

4. Multi-language guards

- Implement validation and error semantics in TS first; mirror in Py/Go.
- Add/update `test-fixtures/golden.json` and parity tests; ensure green in all languages.

5. Versioning & migration notes

- Add a Changeset; bump affected packages; document migration in `packages/docs/versioning.md`.
- If breaking, gate behind opt-in flags until v2.

6. Release & communicate

- Merge docs + code; run full CI; publish.
- Announce in README/docs and link to the proposal issue for rationale.

Checklist for any spec change PR:

- [ ] Issue with rationale and security review
- [ ] `protocol/constants.yml` updated and regenerated
- [ ] TS/Py/Go validation + tests updated
- [ ] Parity suite green
- [ ] Docs/spec updated
- [ ] Changeset added and CI green
