---

### Technical Guide 2: Using AID with the Agent-to-Agent (A2A) Protocol

**Target Audience:** Developers building autonomous agents and platforms using the A2A specification.

**Goal:** To use AID to discover the location of an A2A `AgentCard` (`agent.json`), fetch it, and use its contents to initiate A2A communication.

The A2A protocol is defined by a rich `AgentCard` manifest that describes skills, transports, and security. AID provides the canonical, network-level pointer _to_ this application-level manifest.

#### Part 1: For A2A Agent Providers (Publishing Your AgentCard)

If your agent's `AgentCard` is hosted at a public URL, you can make it discoverable.

1.  **Identify Your AgentCard URL:** This is the direct, stable URL to your `agent.json` file.
    - **Example:** `https://api.my-a2a-agent.com/agent.json`

2.  **Construct the AID TXT Record:** The protocol token is `a2a`. The `uri` points to your `AgentCard`.
    - **Record Content:** `v=aid1;uri=https://api.my-a2a-agent.com/agent.json;p=a2a;desc=My Autonomous A2A Agent`

3.  **Publish to DNS:** Add a `TXT` record at the `_agent` subdomain for `my-a2a-agent.com`.
    - **Type:** `TXT`
    - **Name (Host):** `_agent`
    - **Value:** The record content string from Step 2.

Your A2A agent's manifest is now globally discoverable.

#### Part 2: For A2A Clients (Discovering and Parsing the AgentCard)

Your autonomous agent needs to interact with the agent at `my-a2a-agent.com`.

1.  **AID Lookup:** Discover the URI of the `AgentCard`.
2.  **Protocol Validation:** Ensure the `proto` is `a2a`.
3.  **Fetch AgentCard:** Make an HTTP GET request to the discovered URI.
4.  **Initiate A2A Communication:** Parse the fetched `AgentCard` and use its rich metadata (e.g., `url`, `preferredTransport`, `skills`, `securitySchemes`) to establish a connection.

**Complete TypeScript Example:**

```typescript
import { discover } from '@agentcommunity/aid';
import axios from 'axios'; // For making HTTP requests

// A simplified interface based on the A2A AgentCard specification
interface AgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string; // The actual interaction endpoint
  preferredTransport?: string;
  skills: { id: string; name: string; description: string }[];
  securitySchemes?: { [scheme: string]: any };
}

async function connectToA2aAgent(domain: string) {
  try {
    // 1. Discover the AgentCard's location using AID
    console.log(`Discovering A2A AgentCard for ${domain}...`);
    const { record } = await discover(domain);

    // 2. Validate that it's an A2A agent
    if (record.proto !== 'a2a') {
      throw new Error(`Expected 'a2a' protocol, but found '${record.proto}'`);
    }
    console.log(`Found A2A AgentCard at: ${record.uri}`);

    // 3. Fetch the AgentCard from the discovered URI
    const response = await axios.get<AgentCard>(record.uri);
    const agentCard = response.data;

    console.log(`Successfully fetched card for agent: "${agentCard.name}"`);
    console.log(`Description: ${agentCard.description}`);
    console.log(`Skills:`, agentCard.skills.map((s) => s.name).join(', '));

    // 4. Use the card's data to determine how to communicate
    const interactionEndpoint = agentCard.url; // This is the agent's actual endpoint
    const transport = agentCard.preferredTransport || 'jsonrpc';

    console.log(`Ready to initiate A2A task at ${interactionEndpoint} via ${transport}`);
    // Now, use your A2A library to send a task to the 'interactionEndpoint'...
  } catch (error) {
    console.error(`Failed to connect to ${domain}:`, error.message);
  }
}

// Replace with a real domain publishing an A2A AID record
connectToA2aAgent('a2a.agentcommunity.org'); // Fictional example domain
```

**Conclusion:** AID provides a clean separation of concerns. It uses DNS for network-level discovery of the `AgentCard`'s location, allowing the A2A protocol itself to handle the rich capability negotiation that follows.

---

**See also:**

- [General Quick Start](./index.md)
- [MCP Quick Start](./quickstart_mcp.md)
- [OpenAPI Quick Start](./quickstart_openapi.md)
