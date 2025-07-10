---
title: 'Agent Interface Discovery (AID)'
description: 'The DNS-based discovery protocol for the agent web.'
icon: material/dns

edit_url: https://github.com/agentcommunity/agent-interface-discovery/edit/main/packages/docs/index.md
extra_css_class: aid-page
---

[View raw markdown](https://github.com/agentcommunity/agent-interface-discovery/raw/main/packages/docs/index.md)

# Agent Interface Discovery (AID)

> ## DNS for Agents
>
> _Type a domain. Connect to its agent. Instantly._

AID is a minimal, open standard that answers one question: **“Given a domain name, where is its AI agent?”**

It uses a single DNS `TXT` record to make any agent service—whether it speaks MCP, A2A, or another protocol—instantly discoverable. No more digging through docs, no more manual configuration.

!!! agent "The 'It Just Works' Moment"
A developer wants to use Supabase's tools. They type `supabase.com` into their client. The client queries DNS, finds the official MCP endpoint, and connects. **Zero extra steps.**

```mermaid
flowchart LR
    subgraph User Action
        User["User/Agent"] --> Domain["supabase.com"];
    end
    subgraph AID Discovery
        Domain --> DNS["DNS Query: _agent._mcp.supabase.com"];
        DNS --> Endpoint["TXT Record: uri=https://..."];
    end
    subgraph Connection
        Endpoint --> MCP["Connect via MCP"];
    end
```

## How It Works (The 15-Second Version)

1.  **Provider Publishes a Record:** A service provider (e.g., Google) adds a single `TXT` record to their DNS at a standard location: `_agent.<protocol>.<domain>`.
2.  **Client Queries DNS:** A client application takes the user's input (`google.com`) and the protocol it wants (`mcp`) to query `_agent._mcp.google.com`.
3.  **Client Connects:** The `TXT` record contains the `uri` of the agent endpoint. The client uses this to connect directly.

That's it. The heavy lifting (authentication, capability negotiation) is handled by the agent protocol itself (like MCP). AID just gets you to the right front door.

## Why You Should Care

- **For Providers:** Make your agent instantly discoverable. It's one DNS record.
- **For Client Devs:** Write one discovery function, not ten. Support any AID-compliant agent out of the box.
- **For the Ecosystem:** A simple, open, and decentralized standard is the foundation for a truly interoperable agent web. No central registry, no lock-in.

## Links

<div class="grid cards" markdown>

- [:material-file-document-outline:{ .lg .middle } **Specification**](v1/specification.md)

  Read the full v1.0.0 Specification. Lean, mean, and ready to implement.

- [:material-forum:{ .lg .middle } **Design Rationale**](rationale.md)

  Understand the "why" behind the new, simplified design.

- [:material-source-branch:{ .lg .middle } **Token Registries**](https://github.com/agent-community/aid-tokens)

  See the official list of `proto` and `auth` tokens.

- [:material-rocket-launch:{ .lg .middle } **Get Started**](generator.md)

  Use our simple tools to validate or generate your AID record.

</div>

---

### Want the deep dive?

- [**Rationale**](rationale.md) – _Why we chose DNS, why the manifest was removed, and why simplicity wins._
- [**Specification**](v1/specification.md) – _The exact `TXT` record format, client algorithm, and security rules._
