---
title: 'The Missing MX Record for the Internet of Agents'
description: 'Why AID is the DNS MX-equivalent for the agentic web — a simple TXT record that points clients to the right endpoint.'
icon: material/file-document-outline
---

### The Missing `MX` Record for the Internet of Agents

Think about the last time you set up a new developer tool that needed to connect to an API. You went to their website, navigated to the developer docs, maybe signed up for an account, generated an API key, and found the base URL for the API endpoint. Then you copied those values into your code or a settings panel.

This little dance is so common we barely notice it anymore. But it's friction. It's a series of manual steps that stand between you and the thing you actually want to do.

Now, think about the last time you sent an email. You typed an address, like `jane@example.com`, and hit send. You didn't look up the IP address for `example.com`'s mail server. You didn't configure a special port. The system just knew where to send it.

It knew because of a simple, 40-year-old idea called the `MX` record. A little entry in the world's decentralized address book—DNS—that says, "If you have mail for this domain, deliver it here."

We are now building the internet of agents, and we are creating powerful, complex protocols like MCP and A2A for them to communicate. We have rich OpenAPI schemas that describe what they can do. We've designed the intricate grammar for their conversations.

But we've been making everyone look up the address in the manual.

Agent Interface Discovery (AID) is the `MX` record for this new internet. It’s a dead-simple, open standard that answers one question using the same global address book the internet has always used: **"Given a domain, where is its agent?"**

The entire mechanism is a single DNS `TXT` record. If you want to find the agent for `notion.so`, you just look up the record at `_agent.notion.so`. It looks like this:

`v=aid1;uri=https://api.notion.com/agent/v1;p=mcp`

That's it. A version, a location, and a protocol. It’s so simple you can read it with a command-line tool. It’s so fundamental that it feels like it should have always been there. This isn't a complex new platform. It's a piece of missing infrastructure.

This small thing changes the game for everyone building in the agent ecosystem.

#### For Developers Publishing an Agent (MCP, A2A, OpenAPI)

You've done the hard work of building your agent and defining its interface. Your last step shouldn't be hoping people can find your API docs. With AID, you can make your agent a first-class citizen of your domain. You add one `TXT` record to your DNS, and your agent is now universally discoverable. You haven't just published an API; you've given your agent a public address. It signals to the entire world, "The agent for this domain lives here."

#### For Developers Building Autonomous Agents

The goal of autonomy is to act without being pre-programmed for every situation. An agent that needs a hardcoded list of endpoints is not truly autonomous. It’s just a fancy script. AID gives your agents the primitive they need for true discovery. Your agent can be tasked to work with `supabase.com`, and instead of having `api.supabase.com/mcp` in its code, it can discover that endpoint programmatically, in real-time. This is how agents move from executing instructions to navigating the world.

#### For Developers Building Client Applications

You want your users to have a magical experience. You don't want to show them a settings panel that asks for a "Server URL" and an "API Key." That's friction, and it kills adoption. With AID, you can build a UI where the user simply types a domain name. Your application performs the AID lookup, discovers the endpoint, and initiates the connection. For the user, it just works. The tedious setup vanishes, replaced by an experience that feels instant and intuitive.

AID doesn't replace the rich protocols like MCP or the detailed schemas of OpenAPI. It's the layer zero pointer _to_ them. It's the front door. By separating the _discovery_ of an agent from the _interaction_ with it, we get a clean, layered system.

We have the chance to build the next internet on a foundation that’s open, decentralized, and simple. It starts with giving every agent an address.

**Check out the standard, try the live workbench, and give your agent an address today at [aid.agentcommunity.org](https://aid.agentcommunity.org).**

---

### Technical Guide 1: Using AID with the Model Context Protocol (MCP)

**Goal:** To use AID to discover an MCP server's endpoint and initiate the MCP handshake.

MCP is a stateful, session-based protocol. The crucial first step is finding the single endpoint where the `initialize` handshake must occur. AID provides this endpoint directly.

#### Part 1: For MCP Server Providers (Publishing)

If you have an MCP server running at `https://api.my-saas.com/mcp`, you can make it discoverable with AID.

1.  **Identify your MCP Endpoint:** This is the full URL that accepts MCP JSON-RPC messages.
    - Example: `https://api.my-saas.com/mcp`

2.  **Construct the AID TXT Record:** The protocol token for MCP is `mcp`.
    - **Record content:** `v=aid1;uri=https://api.my-saas.com/mcp;p=mcp;desc=My SaaS AI Assistant`

3.  **Publish to DNS:** Add a `TXT` record to your domain's DNS settings.
    - **Type:** `TXT`
    - **Name (Host):** `_agent` (for the domain `my-saas.com`)
    - **Value:** The record content string from Step 2.

Your MCP server is now discoverable.

#### Part 2: For MCP Clients (Discovering)

Your client application needs to connect to the MCP server for `my-saas.com`.

1.  **Perform the AID Lookup:** Use an AID library to discover the endpoint for the domain.
2.  **Verify the Protocol:** Check that the returned `record.proto` is `mcp`.
3.  **Initiate MCP Handshake:** Use the discovered `record.uri` as the target for your MCP `initialize` request.

**Complete TypeScript Example:**

```typescript
import { discover } from '@agentcommunity/aid';
import { createMcpClient } from 'some-mcp-client-library'; // Fictional MCP client library

async function connectToMcpAgent(domain: string) {
  try {
    // Step 1: Discover the agent's location using AID
    console.log(`Discovering agent for ${domain}...`);
    const { record } = await discover(domain);

    // Step 2: Validate that it's an MCP agent
    if (record.proto !== 'mcp') {
      throw new Error(`Expected 'mcp' protocol, but found '${record.proto}'`);
    }

    console.log(`Found MCP agent at: ${record.uri}`);
    console.log(`Description: ${record.desc}`);

    // Step 3: Use the discovered URI to connect with an MCP client
    const mcpClient = createMcpClient({ endpoint: record.uri });

    // Initiate the MCP lifecycle
    const { serverInfo } = await mcpClient.initialize({
      clientInfo: { name: 'MyAwesomeClient' },
      capabilities: {
        /* ... your client's capabilities ... */
      },
    });

    console.log(`Successfully connected to MCP server: ${serverInfo.name}`);
    // You can now use the mcpClient for further operations...
  } catch (error) {
    console.error(`Failed to connect to ${domain}:`, error.message);
  }
}

connectToMcpAgent('supabase.agentcommunity.org'); // Use a real AID-enabled domain
```

**Conclusion:** AID provides the missing link for MCP by making the initial endpoint discovery automatic, allowing clients to seamlessly begin the rich, stateful MCP lifecycle.

---

### Technical Guide 2: Using AID with the Agent-to-Agent (A2A) Protocol

**Goal:** To use AID to discover the location of an A2A `AgentCard`, fetch it, and begin A2A communication.

The A2A protocol uses a rich `AgentCard` (often an `agent.json` file) as its primary manifest. AID's role is to provide the canonical, discoverable pointer to this card.

#### Part 1: For A2A Agent Providers (Publishing)

If you have an A2A `AgentCard` available at `https://my-a2a-agent.com/agent.json`, you can make it discoverable.

1.  **Identify your AgentCard URL:** This is the direct, publicly accessible URL to your `AgentCard` JSON file.
    - Example: `https://my-a2a-agent.com/agent.json`

2.  **Construct the AID TXT Record:** The protocol token for A2A is `a2a`.
    - **Record content:** `v=aid1;uri=https://my-a2a-agent.com/agent.json;p=a2a;desc=My Advanced A2A Agent`

3.  **Publish to DNS:** Add a `TXT` record to your domain's DNS settings.
    - **Type:** `TXT`
    - **Name (Host):** `_agent` (for the domain `my-a2a-agent.com`)
    - **Value:** The record content string from Step 2.

Your `AgentCard` is now discoverable.

#### Part 2: For A2A Clients (Discovering)

Your client or autonomous agent needs to interact with the A2A agent at `my-a2a-agent.com`.

1.  **Perform the AID Lookup:** Discover the location of the `AgentCard`.
2.  **Verify the Protocol:** Check that the returned `record.proto` is `a2a`.
3.  **Fetch the AgentCard:** Make an HTTP GET request to the discovered `record.uri`.
4.  **Initiate A2A Communication:** Parse the `AgentCard` and use its contents (e.g., `preferredTransport`, `skills`, `securitySchemes`) to start the A2A conversation.

**Complete TypeScript Example:**

```typescript
import { discover } from '@agentcommunity/aid';
import axios from 'axios'; // For making HTTP requests

// A fictional type definition for the A2A AgentCard
interface AgentCard {
  protocolVersion: string;
  name: string;
  skills: { id: string; name: string }[];
  preferredTransport?: string;
  url: string;
}

async function connectToA2aAgent(domain: string) {
  try {
    // Step 1: Discover the AgentCard's location using AID
    console.log(`Discovering agent for ${domain}...`);
    const { record } = await discover(domain);

    // Step 2: Validate that it's an A2A agent
    if (record.proto !== 'a2a') {
      throw new Error(`Expected 'a2a' protocol, but found '${record.proto}'`);
    }

    console.log(`Found A2A AgentCard at: ${record.uri}`);

    // Step 3: Fetch the AgentCard from the discovered URI
    const response = await axios.get<AgentCard>(record.uri);
    const agentCard = response.data;

    console.log(`Successfully fetched AgentCard for: ${agentCard.name}`);
    console.log(`Agent Skills:`, agentCard.skills.map((s) => s.name).join(', '));

    // Step 4: Use the AgentCard to determine how to communicate
    const endpoint = agentCard.url;
    const transport = agentCard.preferredTransport || 'jsonrpc';
    console.log(`Ready to communicate with agent at ${endpoint} via ${transport}`);
    // Now, use an A2A library to send a task to the agent's endpoint...
  } catch (error) {
    console.error(`Failed to connect to ${domain}:`, error.message);
  }
}

connectToA2aAgent('a2a.agentcommunity.org'); // Fictional example domain
```

**Conclusion:** AID provides a robust, network-level pointer to the A2A `AgentCard`, cleanly separating the discovery step from the protocol's rich capability negotiation.

---

### Technical Guide 3: Using AID with OpenAPI

**Goal:** To use AID to discover the location of an OpenAPI specification document (`openapi.json` or YAML) and bootstrap an API client.

OpenAPI provides a standard for describing RESTful APIs. AID can make these API descriptions themselves discoverable.

#### Part 1: For OpenAPI Providers (Publishing)

If you have an OpenAPI specification hosted at `https://api.my-service.io/v3/openapi.json`, you can make it discoverable.

1.  **Identify your OpenAPI Spec URL:** This is the direct URL to your `openapi.json` or `openapi.yaml` file.
    - Example: `https://api.my-service.io/v3/openapi.json`

2.  **Construct the AID TXT Record:** The protocol token for OpenAPI is `openapi`.
    - **Record content:** `v=aid1;uri=https://api.my-service.io/v3/openapi.json;p=openapi;desc=My Public Service API`

3.  **Publish to DNS:** Add a `TXT` record to your domain's DNS settings.
    - **Type:** `TXT`
    - **Name (Host):** `_agent` (for the domain `my-service.io`)
    - **Value:** The record content string from Step 2.

Your OpenAPI specification is now discoverable.

#### Part 2: For OpenAPI Clients (Discovering)

Your application needs to interact with the API provided by `my-service.io`.

1.  **Perform the AID Lookup:** Discover the location of the OpenAPI spec file.
2.  **Verify the Protocol:** Check that the returned `record.proto` is `openapi`.
3.  **Fetch the OpenAPI Specification:** Make an HTTP GET request to the discovered `record.uri`.
4.  **Interact with the API:** Use the fetched specification to configure an OpenAPI client library (like `axios-openapi-client` or others) or to allow an autonomous agent to understand the API's capabilities and endpoints.

**Complete TypeScript Example:**

```typescript
import { discover } from '@agentcommunity/aid';
import axios from 'axios';
// A fictional OpenAPI client library that takes a spec URL
import createOpenAPIClient from 'some-openapi-client-library';

async function connectToOpenAPIAgent(domain: string) {
  try {
    // Step 1: Discover the OpenAPI spec's location using AID
    console.log(`Discovering OpenAPI spec for ${domain}...`);
    const { record } = await discover(domain);

    // Step 2: Validate the protocol
    if (record.proto !== 'openapi') {
      throw new Error(`Expected 'openapi' protocol, but found '${record.proto}'`);
    }

    console.log(`Found OpenAPI spec at: ${record.uri}`);

    // Step 3 & 4: Use the discovered URI to configure an OpenAPI client
    // Many libraries can fetch the URL directly.
    const apiClient = await createOpenAPIClient({ specUrl: record.uri });

    // We can now make type-safe calls based on the spec
    console.log('API Client created. Fetching user list...');
    // const users = await apiClient.get('/users'); // Example API call
    // console.log('Successfully fetched users:', users);

    console.log('An autonomous agent could now parse this spec to understand its capabilities.');
    // const response = await axios.get(record.uri);
    // const openApiSpec = response.data;
    // console.log(`API Title: ${openApiSpec.info.title}`);
  } catch (error) {
    console.error(`Failed to connect to ${domain}:`, error.message);
  }
}

connectToOpenAPIAgent('openapi.agentcommunity.org'); // Fictional example domain
```

**Conclusion:** AID serves as the universal discovery layer for OpenAPI, allowing clients and autonomous agents to programmatically find an API's specification just by knowing its domain name.

---

**Related Reading:**

- [AID Specification](../specification.md)
- [Design Rationale](../rationale.md)
- [Quick Start Guide](../quickstart/index.md)
