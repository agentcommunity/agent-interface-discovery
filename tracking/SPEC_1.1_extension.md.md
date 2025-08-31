# Spec extension process (for v1.1 and future proposals)

When expanding the spec (new tokens/fields/rules), follow this process to stay contract-first and multi-language consistent. This ensures all language implementations (TypeScript, Python, Go, Rust, .NET, Java) remain synchronized and the ecosystem stays secure and maintainable.

## **Current Focus: v1.1 Implementation (PKA + Well-Known + Metadata)**

This document has been updated to incorporate the specific requirements for **AID v1.1**, which includes:
- **PKA (Public Key for Agent)**: Ed25519-based endpoint verification with HTTP Message Signatures
- **Well-Known Fallback**: HTTPS fallback for DNS-restricted environments
- **Key Aliases**: Single-letter aliases for byte efficiency (v, p, u, s, a, d, e, k, i)
- **Metadata Keys**: `docs` (documentation URL) and `dep` (deprecation timestamp)
- **Protocol Extensions**: `grpc`, `graphql`, `websocket`, `zeroconf`
- **Enhanced Security**: DNSSEC-aware PKA validation

---

## Agent Interface Discovery (AID) — v1.1 Changes (Draft)

Date: August 31, 2025  
Editor: Agent Community  
Status: Proposed  

Summary: This section tracks the draft changes from v1.0 to v1.1. It focuses on security, usability, and extensibility while keeping the spec minimal. Key additions include endpoint verification (PKA), key aliases, optional metadata keys, protocol extensions, and a client-side .well-known fallback. All changes are backward-compatible with v1.0.

### Rationale and Design Principles
v1.1 addresses feedback on security and deployment friction while keeping the DNS-first model. It prioritizes:
- Security: Verifiable endpoint proof without mandating DNSSEC.
- Usability: Metadata for operators; records fit typical 255-byte TXT limits.
- Extensibility: Protocol registry additions; client-side fallback for restricted networks.
- Realism: DNSSEC adoption remains limited. DNS stays canonical.

No breaking changes. v1.0 records remain valid.

### 1) Agent Endpoint Proof via PKA (Public Key for Agent)
Adds a way to bind the discovered endpoint to a public key. Clients can verify the server controls the matching private key. This resists MitM and hijacks.

- Normative requirements:
  - Providers MAY include `pka` (alias `k`) in the TXT record. The value is a multibase-encoded Ed25519 public key (32 bytes). Use base58btc for compactness.
  - Providers MUST include a companion `kid` (alias `i`) when `pka` is present. It is a 1–6 char id `[a-z0-9]` for rotation.
  - Clients MUST recognize aliases. Comparisons are case-insensitive for keys.
- Security model (opportunistic):
  - Baseline (no DNSSEC): PKA acts as a second factor. Spoofed records fail because the attacker lacks the private key.
  - Gold standard (with DNSSEC): Trust anchors to DNS. Clients SHOULD validate `RRSIG`.
- Handshake (normative):
  If `pka` is present, clients MUST perform a proof using HTTP Message Signatures (RFC 9421) with Ed25519.

  Pseudocode (client):
  ```
  function performPKAHandshake(uri, pka, kid):
      nonce = generateRandomBytes(32)
      challenge = base64urlEncode(nonce)
      headers = {
          "AID-Challenge": challenge,
          "Date": currentUTCTime()
      }
      response = sendGET(uri, headers)

      if response.status != 200:
          failWith(ERR_SECURITY)

      sigInput = response.headers["Signature-Input"]
      signature = response.headers["Signature"]

      created = parseCreated(sigInput)
      if |currentTime() - created| > 300 seconds:
          failWith(ERR_SECURITY)

      pubKey = multibaseDecode(pka)
      if not verifyEd25519(signature, sigInput.coveredFields, pubKey):
          failWith(ERR_SECURITY)

      // Success
  ```

- Rotation and downgrade protection: Providers MUST use `kid` for explicit rotation. Clients SHOULD warn on downgrade (missing `pka` after prior presence).
- Fallback (non-normative): Stacks without RFC 9421 MAY use a simplified `AID-Proof` header (Appendix reference in spec).

### 2) Key Aliases for Byte Efficiency
To fit richer records within ~255 bytes (single string recommended; multi-string concatenation handled by clients):

- Normative: Clients MUST recognize single-letter lowercase aliases for all keys. Providers SHOULD use aliases when near limits.
- Mapping:
  - `version` → `v`
  - `proto` → `p`
  - `uri` → `u`
  - `desc` → `s`
  - `auth` → `a`
  - `docs` → `d`
  - `dep` → `e`
  - `pka` → `k`
  - `kid` → `i`

Records MUST NOT include both a full key and its alias.

### 3) Metadata Keys
- `docs` (`d`): Absolute `https://` URL to human-readable documentation. Clients MAY display it.
- `dep` (`e`): ISO 8601 UTC timestamp. Clients SHOULD warn if in the future. Clients SHOULD fail gracefully if past.

### 4) Protocol Registry Extensions
- Core additions (remote): `grpc` (`https://`), `graphql` (`https://`), `websocket` (`wss://`). Reject insecure schemes with `ERR_SECURITY`.
- Optional extension (local): `zeroconf` (`zeroconf:<service_type>`, e.g., `_http._tcp`). Requires explicit user consent.
- Deferred: `ble` (consider in v1.2).

Governance: New tokens require a PR with spec/reference implementation and a 30-day community review.

### 5) .well-known Fallback (Client Recommendation)
- Clients MAY fallback to `GET https://<domain>/.well-known/agent` on DNS failure (`ERR_NO_RECORD` or `ERR_DNS_LOOKUP_FAILED`).
- Format: JSON mirroring TXT keys (e.g., `{ "v": "aid1", "u": "https://...", "k": "..." }`).
- Security: Relies on TLS. PKA handshake still applies.
- Hierarchy: DNS is canonical. Clients MUST try DNS first.

### 6) Future Extensions (Non-Normative)
- Explore non-domain identifiers (e.g., DHT/DID). No commitments for v1.1.
- Upgrade to SRV/HTTPS records remains planned.

### Updated Client Algorithm
1. Normalize domain.
2. DNS TXT lookup for `_agent.<domain>`.
3. If it fails, OPTIONAL: Fallback to `.well-known` GET.
4. Parse and validate (support aliases).
5. If `pka` is present, perform the handshake.
6. Return details or fail.

### Error Codes Update
Add `ERR_FALLBACK_FAILED` (`1005`) for `.well-known` issues.

### Example Records
Fort Knox (Remote MCP, full security):
```
v=aid1;p=mcp;u=https://api.example.com/mcp;k=z7rW8rTq8o4mM6vVf7w1k3m4uQn9p2YxCAbcDeFgHiJ;i=g1;d=https://docs.example.com/agent;e=2026-01-01T00:00:00Z;s=Secure AI Gateway
```

Local Zeroconf (Minimal):
```
v=aid1;p=zeroconf;u=zeroconf:_mcp._tcp;s=Local Dev Agent
```

A2A Crypto (No MCP):
```
v=aid1;p=a2a;u=https://peer.example.com/a2a;k=zAbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbC;i=a1;d=https://docs.example.com/a2a;e=2027-06-30T00:00:00Z;s=Decentralized Peer
```

---

## Change Log (Live)

- 2025-08-31: Added the v1.1 Changes draft section above.
- 2025-08-31: Updated `packages/docs/specification.md` to v1.1 (Proposed). Added aliases, metadata keys, PKA, protocol extensions, fallback, new examples, and error code 1005.
- 2025-08-31: Updated `AGENTS.md` with v1.1 pointers, PKA and `.well-known` notes.
- 2025-08-31: Updated `protocol/constants.yml` for v1.1 (protocols: grpc/graphql/websocket/zeroconf; aliases: u/a/s/d/e/k/i; keys: docs/dep/pka/kid; error 1005).
- 2025-08-31: Enhanced `scripts/generate-constants.ts` to emit dynamic AidRecord/RawAidRecord from YAML (aliases + new keys). Regenerated TS/Py/Go/Rust/.NET/Java constants with `pnpm gen`.
- 2025-08-31: TS client (`packages/aid`): Implemented `.well-known` fallback (HTTPS JSON, 2s timeout, 64KB limit, content-type guard) and wired to trigger only on `ERR_NO_RECORD`/`ERR_DNS_LOOKUP_FAILED`.
- 2025-08-31: TS parser: Added alias duplication checks; added `docs`/`dep` basic validation; enforced `websocket` wss:// and `zeroconf:` scheme rules.
- 2025-08-31: TS PKA handshake: added `packages/aid/src/pka.ts` using Ed25519 + HTTP Message Signatures fields (AID-Challenge, @method, @target-uri, host, date). Client now performs handshake when `pka` present.
- 2025-08-31: Enforced `kid` required when `pka` present across TS, Python, Go, .NET, Java (Rust returns optional but parsers validated presence in usage layer).
- 2025-08-31: TS test suite expanded:
  - `parser.v11.test.ts` (aliases, metadata, schemes, kid-with-pka).
  - `client.fallback.test.ts` (well-known fallback success/errors).
  - `client.pka.test.ts` (handshake invocation unit).
  - `client.pka.integration.test.ts` (Ed25519 end-to-end header signing; alg-mismatch failure).

---

## Handoff Context (end of TS v1.1 work)

This section summarizes what’s complete and what’s next so the next agent can continue with language parity and Workbench integration.

### Current State (v1.1)
- Spec: `packages/docs/specification.md` is v1.1 (Final). Includes aliases, metadata (`docs`, `dep`), protocol extensions (`grpc`, `graphql`, `websocket`, `zeroconf`), `.well-known` fallback guidance, PKA handshake (Appendix D), and new error `ERR_FALLBACK_FAILED` (1005).
- Constants/codegen: `protocol/constants.yml` updated for v1.1. `scripts/generate-constants.ts` now emits canonical `protocol/spec.ts` (mirrored to `packages/web/src/generated/spec.ts`). Dynamic record shapes generated from YAML.
- Canonical module: `protocol/spec.ts` is the single source for app-level tokens/types (plus mirror for Web).

### TypeScript (reference impl)
- Parser: `packages/aid/src/parser.ts`
  - Accepts aliases: `u,a,s,d,e,k,i`. Rejects full+alias duplicates at parse time.
  - Validates metadata: `docs` must be `https://`; `dep` must be ISO 8601 UTC (Z). `desc` ≤ 60 bytes.
  - Enforces protocol schemes: `websocket` wss://, `zeroconf:` prefix, remote `https://`, local scheme allowlist.
  - Requires `kid` when `pka` present. Returns optional fields: `docs`, `dep`, `pka`, `kid`.
- Client: `packages/aid/src/client.ts`
  - DNS-first discovery. Optional `.well-known` fallback on `ERR_NO_RECORD`/`ERR_DNS_LOOKUP_FAILED`.
  - Fallback guards: 2s timeout, ≤64KB, JSON content-type, no redirects. Canonicalizes aliases (no alias echo) then validates.
  - Runs PKA handshake when `pka` present (DNS and fallback paths).
- PKA: `packages/aid/src/pka.ts`
  - Verifies Ed25519 HTTP Message Signatures covering: `AID-Challenge`, `@method`, `@target-uri`, `host`, `date`.
  - Multibase z/base58btc decoding for `pka`. Enforces created±300s window, `keyid` match, `alg="ed25519"`.
  - Uses WebCrypto (Node’s `webcrypto` fallback) — no external deps. Minimal local types avoid DOM typings.

### Tests (TS)
- `packages/aid/src/parser.v11.test.ts`: aliases, duplicates, docs/dep, websocket/zeroconf, kid-with-pka.
- `packages/aid/src/client.fallback.test.ts`: fallback success + content-type guard failure.
- `packages/aid/src/client.pka.test.ts`: confirms handshake is invoked when `k` + `i` present.
- `packages/aid/src/client.pka.integration.test.ts`: Ed25519 end-to-end; valid signature passes; alg mismatch fails (add created/kid mismatch if desired).
- Vitest config: `packages/aid/vitest.config.ts` uses `pool: 'forks'` to avoid tinypool recursion in constrained envs.

### Other SDKs (parsers updated)
- Python/Go/Rust/.NET/Java parsers accept aliases and metadata; enforce schemes; require `kid` with `pka`. Constants regenerated in each.
- Handshake + `.well-known` fallback not yet added for these SDKs (TS is the reference impl).

### Runbook
- Generate: `pnpm gen`
- TS tests: `pnpm -C packages/aid test` (or `test:coverage`)
- Python tests: `python3 -m pip install -e './packages/aid-py[dev]' && python3 -m pytest packages/aid-py`
- Go tests: `cd packages/aid-go && go test ./...`

### Next Agent TODOs
1) PKA handshake + Fallback in other SDKs
   - Python: use `cryptography` (Ed25519) + base58btc; HTTP fallback with JSON guards.
   - Go: `crypto/ed25519`, base58; net/http fallback with guards.
   - Optional: Rust/.NET/Java handshake (or leave as parser-only if scope-limited).
2) TS Tests (optional additions)
   - PKA created skew outside ±300s → `ERR_SECURITY`.
   - PKA keyid mismatch → `ERR_SECURITY`.
3) Docs & READMEs
   - Update each SDK README with v1.1 notes (aliases, metadata, `websocket`/`zeroconf`, PKA, fallback).
   - Main README highlights v1.1 features; migration examples for aliases; PKA explanation.
4) Workbench integration (last)
   - Optionally import canonical `protocol/spec.ts` directly (mirror remains for now).
   - UI: show PKA verification status; fallback indicator; feature flag remains (`NEXT_PUBLIC_FEATURE_WELLKNOWN`).

### Notes / Decisions
- We avoided DOM lib dependencies by adding minimal local types for fetch/headers/crypto in `pka.ts`.
- Regex parsing for signature headers was hardened (order-insensitive parameter extraction, robust tokenization of covered fields).
- `.well-known` is TLS-anchored convenience; DNS remains canonical per spec.

- 2025-08-31: Generator now outputs canonical `protocol/spec.ts` and mirrors to `packages/web/src/generated/spec.ts` for back-compat.
- 2025-08-31: Python parser (`packages/aid-py/aid_py/parser.py`): Alias support (u/a/s/d/e/k/i), duplicate checks, docs/dep validation, websocket+wss and zeroconf scheme rules.
- 2025-08-31: Go parser (`packages/aid-go/parser.go` + `record.go`): Alias support and duplicate checks; added optional fields (docs/dep/pka/kid); scheme validation for websocket and zeroconf.
- 2025-08-31: Rust parser (`packages/aid-rs/src/parser.rs` + `record.rs`): Added new protocols, alias support, optional fields, and scheme rules; errors mapping includes `ERR_FALLBACK_FAILED`.
- 2025-08-31: .NET parser (`packages/aid-dotnet/src/Parser.cs` + `Record.cs`): Alias support and duplicate checks; optional fields and scheme rules; docs/dep validation.
- 2025-08-31: Java parser (`packages/aid-java/src/main/java/org/agentcommunity/aid/Parser.java` + `AidRecord.java`): Alias support and duplicate checks; optional fields; scheme rules; updated valid protocol list.
- 2025-08-31: Docs: Updated references to include error 1005 in troubleshooting; minor spec tag/date finalized.

## 1) Open a proposal issue
- Label: `spec-proposal`
- Include: motivation, examples, security implications, backward compatibility, and migration considerations.
- Tag relevant community maintainers for early feedback
- Consider impact on existing showcase domains and E2E tests

## 2) Draft changes in docs
- Update `packages/docs/specification.md` in a draft PR using normative language and references.
- Clearly mark sections as "Proposed" with version annotations
- Update `packages/docs/versioning.md` with migration guidance if breaking changes are anticipated
- Ensure documentation includes concrete examples and error scenarios

## 3) Security review process (v1.1 Focus: PKA + Well-Known)
- **Mandatory for v1.1**: Conduct comprehensive security review covering:
  - **PKA Implementation**: Ed25519 key handling, HTTP Message Signatures (RFC 9421), nonce generation, signature verification
  - **Well-Known Fallback**: TLS certificate validation, JSON parsing security, private IP blocking, timeout handling
  - **Key Management**: `kid` rotation, downgrade attack prevention, multibase encoding/decoding
  - **DNSSEC Integration**: RRSIG validation, opportunistic vs mandatory DNSSEC modes
- **v1.1 Specific Attack Vectors**:
  - DNS spoofing with PKA bypass attempts
  - Malicious well-known endpoints serving invalid JSON
  - Cross-origin redirects in well-known fallback
  - Key rotation attacks (kid manipulation)
  - Signature replay attacks (nonce/timestamp validation)
- Document security analysis in the proposal issue
- Consider algorithm agility for future quantum-safe signatures
- If needed, consult with cryptography experts for Ed25519 implementation

## 4) Update canonical constants (v1.1: PKA + Aliases + Metadata)
- Edit `protocol/constants.yml` to add v1.1 constants:
  - **PKA Constants**: `PROTO_PKA`, `AUTH_KID`, error codes for signature validation
  - **Key Aliases**: All single-letter aliases (v, p, u, s, a, d, e, k, i)
  - **New Protocols**: `PROTO_GRPC`, `PROTO_GRAPHQL`, `PROTO_WEBSOCKET`, `PROTO_ZEROCONF`
  - **Metadata Keys**: `META_DOCS`, `META_DEP`
  - **Well-Known**: Constants for fallback path and guards
  - **Error Codes**: `ERR_FALLBACK_FAILED`, `ERR_SIGNATURE_INVALID`, etc.
- **v1.1 Specific Generation Requirements**:
  - Ensure multibase decoding functions are available in generated code
  - Include HTTP Message Signatures constants for RFC 9421 compliance
  - Generate Ed25519 public key validation helpers
  - Include well-known fallback timeout and size limit constants
- Run `pnpm gen` to regenerate constants across all language SDKs:
  - TypeScript: `packages/aid/src/constants.ts` (add PKA validation helpers)
  - Python: `packages/aid-py/aid_py/constants.py` (add cryptography dependencies)
  - Go: `packages/aid-go/constants_gen.go` (add crypto/ed25519 imports)
  - Web UI: `packages/web/src/generated/spec.ts` (add well-known fetch helpers)
  - Rust: `packages/aid-rs/src/constants_gen.rs` (add signature verification)
  - .NET: `packages/aid-dotnet/src/Constants.g.cs` (add cryptography namespaces)
  - Java: `packages/aid-java/src/main/java/org/agentcommunity/aid/Constants.java` (add crypto imports)
- **Post-Generation Validation**: Verify all languages can import and use new constants without compilation errors

## 5) Multi-language implementation (v1.1: PKA + Well-Known + Aliases)
- **TypeScript First (Reference Implementation)**:
  - Implement PKA handshake with HTTP Message Signatures (RFC 9421)
  - Add Ed25519 signature verification using Web Crypto API or noble-ed25519
  - Implement well-known fallback with TLS validation and JSON parsing
  - Add key alias support (case-insensitive parsing)
  - Add metadata key validation (docs URL format, dep ISO 8601 timestamp)
  - Update client algorithm to include well-known fallback logic
- **Python Implementation**:
  - Use `cryptography` library for Ed25519 operations
  - Implement HTTP Message Signatures with `requests` + `cryptography`
  - Add `httpx` for well-known fallback with certificate validation
  - Ensure compatibility with Python 3.11+ cryptography APIs
- **Go Implementation**:
  - Use `crypto/ed25519` standard library for signature verification
  - Implement HTTP Message Signatures parsing
  - Add well-known fallback with `net/http` and TLS validation
  - Ensure FIPS compliance where required
- **Cross-Language Requirements**:
  - All implementations must support multibase decoding (base58btc for PKA keys)
  - Consistent error handling for signature validation failures
  - Identical well-known fallback behavior (DNS first, then HTTPS)
  - Support for all key aliases in parsing logic
  - ISO 8601 timestamp parsing for `dep` field
- Update `test-fixtures/golden.json` with v1.1 examples
- Add PKA test vectors and well-known fallback test scenarios
- Ensure parity tests validate identical behavior across all languages

## 6) CI/CD validation
- **Multi-language CI jobs**: Ensure all language-specific build and test jobs pass:
  - TypeScript/JavaScript (core + web)
  - Python (pytest)
  - Go (native tests)
  - Rust (cargo test)
  - .NET (dotnet test)
  - Java (gradle test)
- **Parity suite**: Run `pnpm test:parity` to verify TS/Py/Go implementations behave identically
- **E2E tests**: Update and verify against live showcase domains
- **SBOM generation**: Ensure CycloneDX SBOM is generated and uploaded
- **Security scanning**: All security checks must pass

## 7) Breaking change impact analysis
- If breaking: provide opt-in flags or transitional behavior until v2
- Analyze impact across all language implementations
- Update migration documentation with concrete code examples
- Consider deprecation warnings in client libraries
- Plan rollback procedures if deployment issues occur

## 8) Community coordination
- Coordinate with community maintainers for each language implementation
- Ensure all language packages receive the same version bump
- Update language-specific documentation and examples
- Consider impact on third-party integrations and client applications

## 9) Well-known fallback implementation (v1.1: REQUIRED)
- **v1.1 Implementation Requirements**:
  - **Path**: `GET https://<domain>/.well-known/agent`
  - **Format**: JSON object with same key-value structure as TXT record
  - **Security Guards**:
    - Block private IPs (RFC 1918, RFC 4193, localhost)
    - Enforce TLS 1.2+ with certificate validation
    - Set 5-second timeout maximum
    - Enforce `application/json` content-type
    - Cap response size at 64 KB
    - Validate JSON structure matches TXT record format
  - **Client Algorithm**: DNS first, well-known only on ERR_NO_RECORD or ERR_DNS_LOOKUP_FAILED
  - **Error Handling**: Return ERR_FALLBACK_FAILED for well-known issues
- **Web UI Implementation**:
  - Add well-known fetch logic to discovery engine
  - Update UI to show fallback source in metadata
  - Add feature flag: `NEXT_PUBLIC_FEATURE_WELLKNOWN=true`
  - Implement progress indicators for fallback attempts
- **Cross-Language Consistency**:
  - Identical fallback behavior across all SDKs
  - Consistent error codes and messages
  - Same timeout and size limits
  - TLS validation requirements

## 10) Versioning & migration notes (v1.1: Minor Version)
- **v1.1 Changeset Strategy**:
  - **aid (core)**: Minor bump (1.0.x → 1.1.0) - new PKA and well-known features
  - **aid-doctor**: Minor bump - new validation for PKA, aliases, metadata
  - **aid-py**: Minor bump - cryptography dependency addition
  - **aid-go**: Minor bump - crypto/ed25519 usage
  - **web**: Minor bump - well-known UI and PKA validation display
  - **aid-rs, aid-dotnet, aid-java**: Minor bump if implemented
- **README Updates Required**:
  - Update main README.md with v1.1 features (PKA, well-known, aliases)
  - Add examples showing PKA-enabled records and well-known fallback
  - Update each package README with v1.1 compatibility notes
  - Document new dependencies (cryptography libraries)
  - Update architecture documentation with PKA flow diagrams
- **Migration Documentation**:
  - Document backward compatibility (v1.0 records still work)
  - Explain PKA as optional enhancement
  - Detail well-known fallback as client-side feature
  - Provide migration examples for key aliases
  - Update `packages/docs/versioning.md` with v1.1 migration guide

## 11) Release & communicate (v1.1: Major Feature Announcement)
- **v1.1 Release Coordination**:
  - Merge all implementation PRs together for atomic v1.1 release
  - Publish packages in dependency order (aid first, then dependents)
  - Enable `NEXT_PUBLIC_FEATURE_WELLKNOWN=true` in production
- **Web UI Updates for v1.1**:
  - Update workbench to display PKA validation status
  - Add well-known fallback indicators in discovery UI
  - Show key aliases in record parsing display
  - Add metadata fields (docs links, deprecation warnings) to record details
  - Update examples to include PKA-enabled showcase domains
- **Documentation Updates**:
  - Update public website with v1.1 feature announcements
  - Add PKA security documentation and best practices
  - Include well-known fallback configuration guides
  - Update API documentation with new metadata fields
- **Community Communication**:
  - Announce v1.1 features in GitHub Discussions and Discord
  - Highlight PKA security enhancements and well-known enterprise support
  - Provide migration guides and backward compatibility assurances
  - Monitor DNS health alerts for PKA-enabled showcase records

## 12) Post-release monitoring
- Monitor DNS health checks for showcase domains
- Watch for issues reported on community channels
- Be prepared to execute rollback procedures if critical issues emerge
- Update tracking documentation with lessons learned

## Rollback procedures (emergency response)

If a spec change causes issues after release:

1. **Immediate rollback**: Create emergency PR reverting the YAML changes
2. **Version bump**: Use patch version for rollback (e.g., v1.0.1)
3. **Communication**: Notify community of rollback with timeline for fix
4. **Investigation**: Analyze root cause before re-attempting the change
5. **DNS updates**: If showcase records are affected, update Terraform configs

## **v1.1 Implementation Checklist**
- [ ] **PKA Security Review**: Ed25519, HTTP Message Signatures, and DNSSEC integration analyzed
- [ ] **Well-Known Security**: TLS validation, private IP blocking, and JSON parsing security verified
- [ ] **Cryptography Dependencies**: All languages have Ed25519/multibase support added
- [ ] **Key Aliases**: All single-letter aliases (v,p,u,s,a,d,e,k,i) implemented and tested
- [ ] **Metadata Fields**: `docs` URL and `dep` ISO 8601 timestamp validation added
- [ ] **Protocol Extensions**: `grpc`, `graphql`, `websocket`, `zeroconf` constants and validation
- [ ] **Error Codes**: `ERR_FALLBACK_FAILED`, signature validation errors added
- [ ] **Constants Generation**: `protocol/constants.yml` updated with v1.1 additions
- [ ] **Multi-Language PKA**: HTTP Message Signatures implemented in TS, Python, Go
- [ ] **Well-Known Fallback**: HTTPS fallback with guards implemented across all SDKs
- [ ] **Web UI Updates**: PKA validation display, well-known indicators, metadata fields
- [ ] **Test Coverage**: PKA test vectors, well-known scenarios, alias parsing tests
- [ ] **Parity Tests**: All languages behave identically for v1.1 features
- [ ] **E2E Validation**: Showcase domains updated with PKA examples
- [ ] **README Updates**: All package READMEs updated with v1.1 features and examples
- [ ] **Changesets**: Minor version bumps for all affected packages (aid, aid-doctor, web, etc.)
- [ ] **CI Validation**: All language jobs pass with new cryptography dependencies
- [ ] **Security Scans**: SBOM generated, dependency vulnerability scans pass
- [ ] **Documentation**: Spec, versioning, and migration docs updated for v1.1
- [ ] **Community Coordination**: Language maintainers aligned on v1.1 implementation
- [ ] **Rollback Plan**: Emergency procedures documented for PKA/well-known issues
- [ ] **Release Coordination**: Atomic v1.1 release with feature flag activation
