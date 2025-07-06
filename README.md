# Agent Interface Discovery (AID)

> **DNS for Agents** — Type a domain. Connect to its agent. Instantly.

[![Build Status](https://github.com/agent-community/agent-interface-discovery/actions/workflows/ci.yml/badge.svg)](https://github.com/agent-community/agent-interface-discovery/actions)
[![npm version](https://img.shields.io/npm/v/@agentcommunity/aid.svg)](https://www.npmjs.com/package/@agentcommunity/aid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AID is a minimal, open standard that answers one question: **"Given a domain name, where is its AI agent?"**

It uses a single DNS `TXT` record to make any agent service—whether it speaks MCP, A2A, or another protocol—instantly discoverable. No more digging through docs, no more manual configuration.

## ✨ The Magic

```bash
# A user wants to use Supabase's agent. They only know the domain.
$ npx @agentcommunity/aid-doctor check supabase.agentcommunity.org

✅ AID Record Found for _agent.supabase.agentcommunity.org
   Protocol:    mcp
   URI:         https://api.supabase.com/mcp
   Auth Hint:   pat
   Description: (Community Showcase)
```

**Zero configuration. Universal compatibility. Just DNS.**

## 🎯 Why AID?

- **🌐 For Providers:** Make your agent instantly discoverable with one DNS record.
- **⚡ For Client Devs:** Write one discovery function, not ten. Support any AID-compliant agent out of the box.
- **🤝 For the Ecosystem:** A simple, open, and decentralized standard for a truly interoperable agent web. No central registry, no lock-in.

## 🚀 Quick Start

### Use the CLI (`aid-doctor`)

The quickest way to check any domain's AID record.

```bash
npm install -g @agentcommunity/aid-doctor
aid-doctor check example.com
```

### Use the Library (`@agentcommunity/aid`)

The core library for building AID-aware clients.

```bash
pnpm add @agentcommunity/aid
```

**Node.js usage:**

```typescript
import { discover, AidError } from '@agentcommunity/aid';

try {
  // Discover any agent by domain
  const { record, ttl } = await discover('supabase.agentcommunity.org');
  console.log(`Found ${record.proto} agent at ${record.uri}`);
  console.log(`Record TTL: ${ttl} seconds`);
  //=> Found mcp agent at https://api.supabase.com/mcp
  //=> Record TTL: 60 seconds
} catch (error) {
  if (error instanceof AidError) {
    // Handle specific errors like NoRecordFound, InvalidRecord, etc.
    console.error(`AID Error (${error.code}): ${error.message}`);
  }
}
```

**Browser usage:**

```typescript
import { discover, AidError } from '@agentcommunity/aid/browser';

try {
  // Uses DNS-over-HTTPS for browser compatibility
  const { record } = await discover('supabase.agentcommunity.org');
  console.log(`Found ${record.proto} agent at ${record.uri}`);
} catch (error) {
  if (error instanceof AidError) {
    console.error(`AID Error (${error.code}): ${error.message}`);
  }
}
```

## 📖 How It Works

AID uses a well-known DNS `TXT` record at `_agent.<domain>`.

```dns
_agent.supabase.agentcommunity.org. 60 IN TXT "v=aid1;uri=https://api.supabase.com/mcp;proto=mcp;auth=pat;desc=(Community Showcase)"
```

The client queries this record, parses the `key=value` pairs, and uses the `uri` to connect. That's it. For full details, see the [**Full Specification**](./packages/docs/specification.md).

### Supported Protocols

The `proto` key (aliased as `p`) tells the client what language to speak.

| Token     | Protocol                | Description                                 |
| :-------- | :---------------------- | :------------------------------------------ |
| `mcp`     | Model Context Protocol  | Rich, stateful agent communication          |
| `a2a`     | Agent-to-Agent Protocol | Inter-agent communication standard          |
| `openapi` | OpenAPI Specification   | A REST API described by an OpenAPI document |
| `local`   | Local Execution         | Run an agent via Docker, NPX, or Pip        |

A full, community-maintained list is available at the [**Token Registry**](https://github.com/agentcommunity/aid-tokens).

## 📦 Packages in This Monorepo

| Package                                        | Version                                                                                                                                 | Description                            |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| **`@agentcommunity/aid`**                      | [![npm version](https://img.shields.io/npm/v/@agentcommunity/aid.svg)](https://www.npmjs.com/package/@agentcommunity/aid)               | Core TypeScript library (Node/Browser) |
| **`@agentcommunity/aid-doctor`**               | [![npm version](https://img.shields.io/npm/v/@agentcommunity/aid-doctor.svg)](https://www.npmjs.com/package/@agentcommunity/aid-doctor) | The official CLI tool                  |
| [`aid-discovery` (Python)](./packages/aid-py/) | _Beta_                                                                                                                                  | The official Python library            |
| [`aid-go` (Go)](./packages/aid-go/)            | _Beta_                                                                                                                                  | The official Go library                |

## 🏗️ Development

This project is a PNPM/Turborepo monorepo with a comprehensive test suite and CI pipeline.

```bash
# Clone and install
git clone https://github.com/agentcommunity/agent-interface-discovery.git
cd agent-interface-discovery
pnpm install

# Generate constants from the YAML contract
pnpm gen

# Build all packages (includes Node.js + browser bundles)
pnpm build

# Run all tests (across all languages)
pnpm test           # Node/TypeScript tests
python -m pytest    # Python tests
cd packages/aid-go && go test ./...

# Lint all code
pnpm lint

# Run end-to-end tests against live showcase records
pnpm e2e
```

### Project Structure

```
agent-interface-discovery/
├── protocol/
│   └── constants.yml          # Single source of truth for protocol constants
├── scripts/
│   └── generate-constants.ts  # Code generation script
├── packages/
│   ├── aid/                   # Core TypeScript library (Node.js + Browser)
│   ├── aid-doctor/            # CLI tool
│   ├── aid-py/                # Python library (beta)
│   ├── aid-go/                # Go library (beta)
│   └── docs/                  # Specification documents
├── tracking/                  # Development progress tracking
└── ...
```

## 🤝 Contributing

We welcome contributions! Please see our **[Contributing Guide](./CONTRIBUTING.md)** and the **[spec contribution process](./docs/CONTRIBUTING-spec.md)** for details. All community interaction is governed by our **[Code of Conduct](./CODE_OF_CONDUCT.md)**.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
