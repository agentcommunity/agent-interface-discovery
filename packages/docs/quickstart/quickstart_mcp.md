Excellent. Based on the technical specifications for MCP, A2A, and general best practices for OpenAPI, here are the refined, developer-focused quick-start guides. Each is tailored to its specific community, using its terminology and addressing its unique discovery challenges.

---

### Technical Guide 1: Using AID with the Model Context Protocol (MCP)

**Target Audience:** Developers building or integrating with MCP servers and clients.

**Goal:** To use AID to discover an MCP server's endpoint and initiate the stateful MCP `initialize` handshake.

The Model Context Protocol (MCP) is a powerful, session-based protocol for rich, stateful interactions. Its entire lifecycle begins with a successful `initialize` request to a specific server endpoint. AID solves the critical first problem: how does a client find that endpoint automatically?

#### Part 1: For MCP Server Providers (Publishing Your Endpoint)

If your MCP server is live and accepting JSON-RPC messages at a specific URL, you can make it instantly discoverable.

1.  **Identify Your MCP Endpoint:** This is the full URL where your server listens for the initial `initialize` request.
    - **Example:** `https://api.my-mcp-service.com/v1/mcp`

2.  **Construct the AID TXT Record:** The official protocol token for MCP is `mcp`. The `uri` is your endpoint from Step 1.
    - **Record Content:** `v=aid1;uri=https://api.my-mcp-service.com/v1/mcp;p=mcp;desc=My Awesome MCP Assistant`

3.  **Publish to DNS:** Go to your DNS provider and add a `TXT` record for your service's domain (`my-mcp-service.com`).
    - **Type:** `TXT`
    - **Name (or Host):** `_agent`
    - **Value:** The record content string from Step 2.

Your MCP server is now discoverable by any AID-aware client.

#### Part 2: For MCP Clients (Dynamic Discovery and Connection)

Your client application needs to connect to an MCP server, but you only know its domain name (e.g., `my-mcp-service.com`).

1.  **AID Lookup:** Use an AID library to find the agent's endpoint.
2.  **Protocol Validation:** Ensure the discovered protocol (`proto`) is `mcp`.
3.  **Initiate MCP Handshake:** Use the discovered URI to send the `initialize` request and begin the MCP session.

**Complete TypeScript Example:**

```typescript
import { discover } from '@agentcommunity/aid';
// This is a fictional MCP client library for demonstration.
// Use your actual MCP implementation.
import { createMcpClient, McpCapabilities } from 'your-mcp-client-library';

// Based on the MCP specification for the initialize handshake
interface ClientInfo {
  name: string;
  version?: string;
}

async function connectToMcpServer(domain: string) {
  try {
    // 1. Discover the agent's endpoint URI using AID
    console.log(`Discovering agent for ${domain}...`);
    const { record } = await discover(domain);

    // 2. Validate that it's an MCP agent
    if (record.proto !== 'mcp') {
      throw new Error(`Expected 'mcp' protocol, but found '${record.proto}'`);
    }

    console.log(`Found MCP agent at: ${record.uri}`);
    console.log(`Description: ${record.desc}`);

    // 3. Use the discovered URI to initiate the MCP lifecycle
    const mcpClient = createMcpClient({ endpoint: record.uri });

    const clientInfo: ClientInfo = { name: 'MyAwesomeClient', version: '1.0.0' };
    const capabilities: McpCapabilities = { sampling: {}, roots: { listChanged: true } };

    console.log('Sending MCP initialize request...');
    const { serverInfo } = await mcpClient.initialize({ clientInfo, capabilities });

    console.log(
      `Successfully connected to MCP server: ${serverInfo.name} (v${serverInfo.version})`,
    );
    // The MCP session is now active. You can proceed with other MCP operations.
    // e.g., const tools = await mcpClient.tools.list();
  } catch (error) {
    console.error(`Failed to connect to ${domain}:`, error.message);
  }
}

// Use a domain that has published an AID record for its MCP server
connectToMcpServer('supabase.agentcommunity.org');
```

**Conclusion:** AID seamlessly bridges the gap between knowing a service's domain and starting the rich, stateful MCP conversation, making dynamic connections trivial.

---

**See also:**

- [General Quick Start](./index.md)
- [A2A Quick Start](./quickstart_a2a.md)
- [OpenAPI Quick Start](./quickstart_openapi.md)
