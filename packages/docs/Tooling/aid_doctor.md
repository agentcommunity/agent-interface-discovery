---
title: 'aid-doctor CLI'
description: 'Validate, secure, and generate AID records'
icon: material/stethoscope
---

# aid-doctor (CLI)

## ELI5

Think of `aid-doctor` as a helpful mechanic for your domain’s agent record. You give it a domain; it looks up the `_agent.<domain>` TXT record, checks every detail, tries a safe fallback if needed, and tells you exactly what’s right or wrong. It also helps you create a perfect record and manage PKA keys.

```bash
# Human-readable check with detailed step-by-step report
aid-doctor check example.com

# JSON (for CI)
aid-doctor json example.com > result.json

# Generate an AID TXT record interactively
aid-doctor generate

# PKA helpers
aid-doctor pka generate
aid-doctor pka verify --key zBase58...
```

## What it does

- DNS-first discovery of `_agent.<domain>`
- Strict validation of record fields (v=aid1, uri, proto, aliases, metadata)
- Optional `.well-known` fallback (HTTPS JSON ≤64KB) on DNS miss
- Security checks: TLS (redirect policy, cert info), DNSSEC presence probe, and PKA handshake.
- Downgrade warnings using a small local cache (`~/.aid/cache.json`)
- JSON output for CI/CD
- Interactive record generator with draft saving capability
- PKA key generation and verification helpers
- Standardized error messages for consistent UX
- Comprehensive test coverage (12/12 tests passing)
- Actionable recommendations to fix common problems.

## Example Output

```bash
$ aid-doctor check example.com
[1/6] DNS TXT _agent.example.com ... ✅ Found (DNS) (TTL 300, 112 bytes)
[2/6] Record validation ... ✅ Valid
[3/6] DNSSEC (RRSIG) ... 💡 Not detected
[4/6] TLS https://api.example.com/mcp ... ✅ Valid (SAN matches, expires in 84 days)
[5/6] PKA handshake ... ✅ Verified (alg=ed25519, kid=g1)
[6/6] Downgrade check ... ✅ No change

--- Summary ---
✅ Record is valid and secure.

--- Recommendations ---
💡 Enable DNSSEC: Improve the integrity of your DNS records by enabling DNSSEC at your domain registrar.
```

---

## Commands

### check

```bash
aid-doctor check <domain> \
  [--protocol <proto>] \
  [--probe-proto-subdomain] [--probe-proto-even-if-base] \
  [--timeout <ms>] [--no-fallback] [--fallback-timeout <ms>] \
  [--dump-well-known[=<path>]] [--check-downgrade] [--no-color]
```

- Base-first resolution. If `--protocol` is set, you may probe `_agent._<proto>.<domain>` for diagnostics.
- Shows numbered steps with ✅/❌/⚠️/💡 and a final summary.
- Honors `AID_SKIP_SECURITY=1` in CI to skip TLS inspection when needed.

### json

```bash
aid-doctor json <domain> [--protocol <proto>] [--timeout <ms>] [--no-fallback] [--fallback-timeout <ms>]
```

- Emits a structured report object including `queried`, `record`, `dnssec`, `tls`, `pka`, `downgrade`, and `exitCode`.

### generate (wizard)

```bash
aid-doctor generate [--save-draft <path>]
```

- Interactive prompts for `uri`, `proto`, optional `auth`, `desc`, `docs`, `dep`, and PKA (`pka` + `kid`).
- Outputs both full and alias variants; picks the shorter and copies it to clipboard.
- `--save-draft` flag saves the generated record to a file for later deployment.

**Example with draft saving:**

```bash
$ aid-doctor generate --save-draft /path/to/my-record.txt
# ... interactive prompts ...
✅ Success! The TXT record value has been copied to your clipboard.
💾 Draft saved to /path/to/my-record.txt
```

### pka helpers

```bash
aid-doctor pka generate [--label <name>] [--out <dir>] [--print-private]
aid-doctor pka verify --key <z...>
```

- Generate Ed25519 keys (prints multibase public key; saves private key to `~/.aid/keys`).
- Verify the format of a PKA public key.

---

## Validation rules (summary)

- Required: `v=aid1`, `uri`, `proto`/`p`
- Aliases: accept single-letter aliases; do not allow key+alias duplicates
- `desc`: ≤ 60 UTF‑8 bytes
- `docs`: absolute `https://` URL
- `dep`: ISO 8601 with `Z`. Errors if in the past, warns if in the future.
- Schemes: remote `https://` (or `wss://` for `websocket`); `local` uses `docker:`, `npx:`, `pip:`; `zeroconf:` for `zeroconf`
- Byte length: warn if TXT payload exceeds 255 bytes
- **Standardized Error Messages**: Consistent, actionable error messages across all validation paths

---

## Security checks

- DNSSEC: presence via DoH RRSIG probe (informational)
- TLS: first-hop redirect policy enforced; cert issuer/SAN/dates/days remaining (warns if < 21 days).
- PKA: Performs full cryptographic handshake per spec v1.1.
- Downgrade: warns if a domain previously had `pka`/`kid` and now removed or changed (`--check-downgrade` flag required).

---

## JSON output shape (abridged)

```json
{
  "domain": "example.com",
  "queried": { "strategy": "base-first", "attempts": [], "wellKnown": {} },
  "record": {
    "raw": "...",
    "parsed": { "v": "aid1", "uri": "...", "proto": "mcp" },
    "valid": true
  },
  "dnssec": { "present": false, "method": "RRSIG", "proof": null },
  "tls": { "checked": true, "valid": true, "host": "...", "san": ["..."], "daysRemaining": 84 },
  "pka": { "present": true, "attempted": true, "verified": true, "kid": "g1" },
  "downgrade": { "checked": true, "status": "no_change" },
  "exitCode": 0
}
```

---

## Exit codes

- 0 success
- 1000 `ERR_NO_RECORD`
- 1001 `ERR_INVALID_TXT`
- 1002 `ERR_UNSUPPORTED_PROTO`
- 1003 `ERR_SECURITY`
- 1004 `ERR_DNS_LOOKUP_FAILED`
- 1005 `ERR_FALLBACK_FAILED`
- 1 unknown

---

## Tips

- Use aliases (`u,p,a,s,d,e,k,i`) to reduce TXT size.
- Enable DNSSEC at your registrar; it improves integrity.
- Add `pka`/`kid` for endpoint proof; rotate via `kid`.
- For dev-only loopback `.well-known`, set `AID_ALLOW_INSECURE_WELL_KNOWN=1`.
- Use `--save-draft` with `generate` to save records for later deployment.
- Error messages are standardized for consistent troubleshooting experience.
