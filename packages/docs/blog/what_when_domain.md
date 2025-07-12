# What Should Happen When You Type a Domain Name?

For thirty years, the answer has been simple: you get a website. You type `google.com` into a browser, and a search page appears. It’s an instantaneous, magical translation of a name into a service. We take it for granted, but this seamlessness is the foundation of the entire web.

We are now building the next web, an internet of AI agents. But if you want to connect your application to an agent today, the experience is anything but seamless. You have to hunt through developer docs, find a long, ugly API endpoint, and paste it into a configuration box. It’s the digital equivalent of looking up a phone number in a giant, disorganized paper directory. This is friction. And friction is the enemy of progress.

What _should_ happen when your AI assistant needs to connect to Notion's agent? You should just be able to tell it `notion.so`. The connection should just happen.

The problem is that the agentic web is missing its most fundamental layer: a public address book.

The funny thing is, the internet already has the world's most successful, decentralized address book. We use it every day. It’s called DNS.

When you send an email to someone at `example.com`, your email client doesn't look in a centralized "email store." It makes a DNS query for something called an `MX` record. This record, published by `example.com` itself, simply points to the address of its mail server.

This is the obvious thing we’ve been missing.

### The Signpost, Not the Blueprint

Agent Interface Discovery (AID) is a simple, open standard that applies this proven idea to the world of agents. It answers one question and one question only: **“Given a domain, where is its AI agent?”**

It does this with a single DNS `TXT` record. If you want to find the agent for a service, you just look for a record at `_agent.<domain>`.

That’s it. The entire mechanism is one DNS lookup. For a service like Supabase that speaks the Model Context Protocol (MCP), the record might look like this:

`v=aid1;uri=https://api.supabase.com/mcp;p=mcp`

Notice how minimal this is. AID isn’t trying to be a complex communication protocol like MCP or A2A. Those protocols are the detailed _blueprints_ for how an agent works. AID is just the _signpost_ on the side of the road, pointing you to the front door.

It's the simple, robust, and decentralized discovery layer that the agentic web needs to function.

### Why This is the Aha! Moment for…

This isn't just an academic exercise. This simple standard fundamentally changes the game for everyone building on the agentic web.

**a) 💻 For developers building agent protocols and servers (like MCP or A2A):**

You’ve painstakingly designed a powerful and secure server. Now you want people to use it. With AID, you are no longer hidden behind API documentation. By adding a single DNS record—a task that takes five minutes—you make your agent a first-class citizen of the internet. Any client, anywhere, can find you just by knowing your domain name. You become instantly and universally discoverable.

**b) 🤖 For agent builders (the creators):**

You are building agents that need to collaborate, pull data, and orchestrate tasks across different services. Right now, you have to hard-code every endpoint. This is brittle. When an endpoint changes, your agent breaks. With AID, your agent can discover other agents dynamically. It can take a name, `github.com`, and find the agent’s front door on its own. This is the foundation for creating truly autonomous and resilient systems that don't need a central directory to function.

**c) ✨ For client developers (the builders of UIs and hosts):**

You can now build experiences that feel like magic. Imagine your user wants to connect your app to a new AI tool. Instead of presenting them with a confusing setup wizard asking for an "MCP Endpoint URL," you just give them a text box. They type `my-saas.com`. Your application performs an AID lookup in the background, finds the agent's URI and protocol, and establishes the connection. For the user, it just works. This isn't just a better user experience; it's a profound competitive advantage.

### It’s Time to Build

Agent Interface Discovery is not a future-facing proposal. It’s a finished standard with libraries in TypeScript, Python, and Go. It is deliberately simple so that it can be adopted today, by everyone, without waiting for a central authority.

This is the missing piece of the puzzle. It’s the zero-friction layer that will allow the agentic web to grow from a collection of siloed services into a truly interconnected ecosystem.

Don’t let your agent be an island. Give it an address.

**See it in action and generate a record for your own agent in minutes at [aid.agentcommunity.org](https://aid.agentcommunity.org).**

---

**Related Reading:**

- [AID Specification](../specification.md)
- [Design Rationale](../rationale.md)
- [Quick Start Guide](../quickstart/index.md)
