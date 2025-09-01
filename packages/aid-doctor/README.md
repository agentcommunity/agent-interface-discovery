# @agentcommunity/aid-doctor

Official CLI for Agent Interface Discovery (AID).

- Website: https://aid.agentcommunity.org
- Docs: https://docs.agentcommunity.org/aid

## Install

```bash
npm install -g @agentcommunity/aid-doctor
# or
pnpm add -D @agentcommunity/aid-doctor
```

## Usage

```bash
# Human-readable check
aid-doctor check example.com

# JSON output (machine-readable)
aid-doctor json example.com
```

### Options

- `--protocol <proto>`: try a protocol-specific subdomain (e.g., `mcp` tries `_agent._mcp.<domain>` first)
- `--timeout <ms>`: DNS query timeout (default: 5000)
- `--no-fallback`: disable `.well-known` fallback on DNS miss
- `--fallback-timeout <ms>`: HTTP timeout for `.well-known` (default: 2000)
- `--show-details`: include fallback usage and PKA status in output
- `--code` (check): exit with specific error code on failure

### Exit codes

- `0` success
- `1000` `ERR_NO_RECORD`
- `1001` `ERR_INVALID_TXT`
- `1002` `ERR_UNSUPPORTED_PROTO`
- `1003` `ERR_SECURITY`
- `1004` `ERR_DNS_LOOKUP_FAILED`
- `1` unknown error

## Generate an AID record

```bash
aid-doctor generate
```

Interactive prompts help you craft a valid TXT value for `_agent.<domain>`.

## Examples

```bash
# Check with protocol hint (underscore-first fallback)
aid-doctor check example.com --protocol mcp

# JSON for CI
aid-doctor json example.com > result.json

# Show PKA/fallback details (v1.1)
aid-doctor check example.com --show-details

# Local testing with a mock HTTP server (insecure well-known)
# (Use only for local dev)
AID_ALLOW_INSECURE_WELL_KNOWN=1 aid-doctor check localhost:19081 --show-details --fallback-timeout 2000

### PKA handshake expectations

- Required covered fields: `"AID-Challenge" "@method" "@target-uri" "host" "date"`
- `alg` must be `ed25519`
- `created` and HTTP `Date` must both be within ±300s of the current time
- `keyid` must match the record `kid` (quotes allowed in header, compare normalized)
- Public key is multibase base58btc (`z...`) for the raw 32‑byte Ed25519 key

### Loopback HTTP (dev‑only)

When `AID_ALLOW_INSECURE_WELL_KNOWN=1` is set and the domain is loopback (`localhost`/`127.0.0.1`/`::1`), the doctor permits `http://` in the `.well-known` path for local testing. All other validations, including PKA, still run. TXT discovery always enforces `https://` for remote agents.
```

## License

MIT © Agent Community
