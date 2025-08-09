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
```

## License

MIT © Agent Community
