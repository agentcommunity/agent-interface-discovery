## The Missing Grep

The most powerful ideas in computing are often the simplest. They're the ones that, in retrospect, seem obvious. `grep` is obvious. Hash tables are obvious. DNS is so obvious that the modern internet is unimaginable without it. You type a name, you get an address. The whole system is built on that simple abstraction.

We're now building the next internet—an internet of agents—and we're smart enough to have designed a rich, powerful language for them to speak: the Model Context Protocol. MCP is impressive. It handles the hard parts: stateful sessions, capability negotiation, resource management, fine-grained security, and even a robust authorization framework based on OAuth 2.1. It solves the problem of how a client and a server should have a complex, secure conversation once they're connected.

But how do they connect?

Right now, connecting to an MCP server feels like the pre-web internet. You have to know the address. Not just the domain, but the full, specific endpoint URI. The user, or a developer, has to find this URI in some documentation and manually paste it into a configuration field.

This is friction. And friction is the enemy of adoption.

The MCP specification rightly focuses on the intricate dance of an active session. It details the `initialize` handshake, the back-and-forth of tool calls, and the complex but necessary sequences of an OAuth flow. These are Layer 2 problems. They are about the content and rules of the conversation.

But there's a Layer 1 problem that needs to be solved first: discovery. Given a name, how do you get an address?

This is the problem Agent Interface Discovery (AID) solves. And it solves it in the most obvious way imaginable: it uses DNS.

If you want to find the email server for a domain, you don't look in a centralized "email store." You ask the domain's own DNS for its `MX` record. AID proposes we do the same for agents. If you want to find the agent for `supabase.com`, you ask its DNS for the `_agent.supabase.com` record.

The entire mechanism is a single `TXT` record. It looks like this:

`v=aid1;uri=https://api.supabase.com/mcp;p=mcp`

Look at that. The protocol token is literally `mcp`. AID isn't trying to replace the rich grammar of MCP. It's the public signpost that points directly to the front door of your MCP server.

AID does not compete with MCP. It completes it. It's the missing `grep` for the agentic web.

MCP is designed to be highly composable and secure. One of its core principles is that servers shouldn't be able to see into other servers. The host application is the orchestrator. This is the right model. But for that host to orchestrate anything, it first needs to know who to talk to.

Imagine you're building a host application. Without AID, you have two bad options: maintain a hardcoded list of MCP servers, which is brittle and centralized, or force your users to manually configure every single connection.

With AID, you can build a UI where a user simply types `notion.so`, and your application can:

1.  Perform an AID lookup for `_agent.notion.so`.
2.  See from the record that it speaks `mcp`.
3.  Find the exact `uri` for its MCP server.
4.  Initiate the rich, secure MCP `initialize` handshake to that `uri`.

The user experience goes from a tedious setup wizard to just working. It becomes magic.

For those of us building MCP servers, AID is even more important. It makes our servers universally discoverable. You no longer have to hope developers find your API docs. If they know your domain, they can find your agent. Autonomously.

This unlocks the most exciting promise of an agentic web: true agent-to-agent interoperability. An autonomous agent tasked with analyzing data in a Supabase project doesn't need to be pre-configured with Supabase's MCP endpoint. It can discover it programmatically. It can find the address on its own.

MCP solves the hard, stateful part of the problem. It was designed to do that well, and its focus is its strength. By trying to solve discovery, it would have become bloated and complex in the wrong places. A protocol that tries to do everything ends up doing nothing well.

AID does one thing: it maps a name to an address. By being ruthlessly simple, it provides the universal on-ramp that every MCP server can use. It is the public address book for the world of agents you're building.

Make your server a public citizen of the agentic web.

Give it an address.

Learn more and generate a record for your own service at [**aid.agentcommunity.org**](https://aid.agentcommunity.org).

---

**Related Reading:**

- [AID Specification](../specification.md)
- [Design Rationale](../rationale.md)
- [Quick Start Guide](../quickstart/index.md)
