# @agentcommunity/aid

The official TypeScript/JavaScript library for [Agent Interface Discovery (AID)](https://aid.agentcommunity.org) — the open, decentralized DNS-based discovery protocol for AI agents.

## Features

- Discover agent endpoints via DNS TXT records
- Supports Node.js (native DNS) and browser (DNS-over-HTTPS)
- Protocol-agnostic: MCP, A2A, OpenAPI, local
- Strict, spec-aligned parsing and validation

## Installation

```bash
pnpm add @agentcommunity/aid
# or
npm install @agentcommunity/aid
```

## Usage

**Node.js:**

```ts
import { discover } from '@agentcommunity/aid';

const { record, ttl } = await discover('supabase.agentcommunity.org');
console.log(`Found ${record.proto} agent at ${record.uri} (TTL: ${ttl}s)`);
```

**Browser:**

```ts
import { discover } from '@agentcommunity/aid/browser';

const { record } = await discover('supabase.agentcommunity.org');
console.log(`Found ${record.proto} agent at ${record.uri}`);
```

## Documentation

- [AID Protocol Spec](https://github.com/agent-community/agent-interface-discovery/blob/main/packages/docs/specification.md)
- [Project README](https://github.com/agent-community/agent-interface-discovery#readme)

## License

MIT — see [LICENSE](../../LICENSE)
