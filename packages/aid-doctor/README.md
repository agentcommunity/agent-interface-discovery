# @agentcommunity/aid-doctor

The official CLI tool for [Agent Interface Discovery (AID)](https://aid.agentcommunity.org) — the open, decentralized DNS-based discovery protocol for AI agents.

## Features

- Validate and debug AID DNS records
- Generate new agent TXT records
- Cross-platform CLI (Node.js)
- Strict, spec-aligned checks

## Installation

```bash
pnpm add -g @agentcommunity/aid-doctor
# or
npm install -g @agentcommunity/aid-doctor
```

## Usage

```bash
aid-doctor check supabase.agentcommunity.org
# → Validates and prints the discovered agent record

aid-doctor generate --proto mcp --uri https://api.example.com/mcp --auth pat
# → Outputs a valid TXT record for your agent
```

## Documentation

- [AID Protocol Spec](https://github.com/agent-community/agent-interface-discovery/blob/main/packages/docs/specification.md)
- [Project README](https://github.com/agent-community/agent-interface-discovery#readme)

## License

MIT — see [LICENSE](../../LICENSE)
