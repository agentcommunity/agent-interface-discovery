### Technical Guide 3: Using AID with OpenAPI

**Target Audience:** API providers and developers of tools or agents that consume APIs programmatically.

**Goal:** To use AID to discover an API's OpenAPI specification document, enabling dynamic client generation or autonomous agent interaction.

OpenAPI provides a standard for describing REST APIs. AID makes the specification itself discoverable, transforming any API into a resource that can be understood and used by autonomous agents.

#### Part 1: For OpenAPI Providers (Publishing Your Spec)

If your OpenAPI specification is hosted at a public URL, you can make it discoverable.

1.  **Identify Your OpenAPI Spec URL:** This is the direct URL to your `openapi.json` or `openapi.yaml` file.
    - **Example:** `https://api.my-service.io/v3/openapi.json`

2.  **Construct the AID TXT Record:** The protocol token is `openapi`. The `uri` points to your spec file.
    - **Record Content:** `v=aid1;uri=https://api.my-service.io/v3/openapi.json;p=openapi;desc=My Public Service API`

3.  **Publish to DNS:** Add a `TXT` record at the `_agent` subdomain for `my-service.io`.
    - **Type:** `TXT`
    - **Name (Host):** `_agent`
    - **Value:** The record content string from Step 2.

Your API's capabilities are now discoverable by any agent or tool that understands OpenAPI.

#### Part 2: For OpenAPI Clients & Agents (Dynamic Discovery)

Your application or agent needs to interact with the API provided by `my-service.io`.

1.  **AID Lookup:** Discover the location of the OpenAPI specification file.
2.  **Protocol Validation:** Ensure the `proto` is `openapi`.
3.  **Fetch the OpenAPI Spec:** Make an HTTP GET request to the discovered URI.
4.  **Interact with the API:** Use the fetched specification to dynamically configure an API client or allow an autonomous agent to reason about the API's endpoints, schemas, and required parameters.

**Complete TypeScript Example:**

```typescript
import { discover } from '@agentcommunity/aid';
import axios from 'axios';
// For a real use case, you'd use a library like 'swagger-client' or 'openapi-typescript-codegen'
// This example just fetches and inspects the spec.

interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  paths: object;
}

async function discoverAndAnalyzeApi(domain: string) {
  try {
    // 1. Discover the OpenAPI spec's location using AID
    console.log(`Discovering OpenAPI spec for ${domain}...`);
    const { record } = await discover(domain);

    // 2. Validate the protocol
    if (record.proto !== 'openapi') {
      throw new Error(`Expected 'openapi' protocol, but found '${record.proto}'`);
    }
    console.log(`Found OpenAPI spec at: ${record.uri}`);

    // 3. Fetch the OpenAPI specification
    const response = await axios.get<OpenApiSpec>(record.uri);
    const spec = response.data;

    // 4. Analyze the spec for programmatic use
    console.log(`Successfully fetched spec for API: "${spec.info.title}" (v${spec.info.version})`);
    console.log(`Description: ${spec.info.description}`);

    const endpoints = Object.keys(spec.paths);
    console.log(`Discovered ${endpoints.length} endpoints: ${endpoints.slice(0, 3).join(', ')}...`);

    // An autonomous agent could now use this 'spec' object to:
    // - Understand which endpoints are available.
    // - Know the required parameters and request body schemas.
    // - Formulate valid API calls to achieve a goal.
  } catch (error) {
    console.error(`Failed to connect to ${domain}:`, error.message);
  }
}

// Replace with a real domain publishing an OpenAPI AID record
connectToOpenAPIAgent('openapi.agentcommunity.org'); // Fictional example domain
```

**Conclusion:** AID promotes APIs from being just human-readable documentation to being machine-discoverable resources, paving the way for a new generation of autonomous agents that can find and use tools across the internet.

For libraries in other languages (including Rust/.NET/Java WIP), see the [Package Overview](./index.md#package-overview).

---

**See also:**

- [General Quick Start](./index.md)
- [MCP Quick Start](./quickstart_mcp.md)
- [A2A Quick Start](./quickstart_a2a.md)
