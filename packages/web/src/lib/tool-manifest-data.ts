import type { ToolManifest } from './tool-manifest-types';
import type { DiscoveryResult } from './tool-manifest-types';
import type { HandshakeResult } from './tool-manifest-types';

const mockDiscoveryFailure = (domain: string): DiscoveryResult => ({
  success: false,
  error: 'Live domain, no mock implemented.',
  metadata: { dnsQuery: domain, recordType: 'TXT', lookupTime: 0, source: 'DNS' },
});

const mockHandshakeFailure = (_domain: string): HandshakeResult => ({
  success: false,
  error: 'Live domain, no mock implemented.',
});

export const toolManifests: Record<string, ToolManifest> = {
  'simple.agentcommunity.org': {
    id: 'simple',
    label: 'Simple',
    icon: '🤖',
    mockDiscoveryResult: (domain) => ({
      success: true,
      data: {
        v: 'aid1',
        uri: 'ws://simple.agentcommunity.org:8080/mcp',
        protocol: 'mcp',
        host: 'simple.agentcommunity.org',
        port: 8080,
        desc: 'Simple demo agent',
      },
      metadata: {
        dnsQuery: domain,
        lookupTime: 89,
        recordType: 'TXT',
        source: 'DNS',
        txtRecord:
          'v=aid1;uri=ws://simple.agentcommunity.org:8080/mcp;protocol=mcp;desc=Simple demo agent',
      },
    }),
    mockHandshakeResult: (_domain) => ({
      success: true,
      data: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'Simple Agent', version: '1.0.0' },
        capabilities: [
          { id: 'echo', type: 'tool' as const },
          { id: 'greet', type: 'tool' as const },
        ],
      },
    }),
    script: [
      {
        type: 'narrative',
        content: (_, domain) => `Alright, let me check ${domain} for you...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) => {
          if (!results.discovery?.success) {
            const err = results.discovery?.error || 'Unknown error';
            return `Hmm, I couldn't find an agent. Discovery failed because: **${err}**`;
          }
          const agentDesc = results.discovery.data?.desc ?? 'the agent';
          const protocol = results.discovery.data?.protocol ?? 'unknown protocol';
          return `Perfect! I found the '${agentDesc}' using the '${protocol}' protocol. Now let's establish a connection...`;
        },
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: (results) => {
          if (!results.connection?.success) {
            const err = results.connection?.error || 'Unknown error';
            return `Connection attempt failed: **${err}**`;
          }
          const capCount = results.connection.data?.capabilities.length ?? 0;
          return `Connection established! The agent is ready and offers ${capCount} capabilities:`;
        },
      },
    ],
  },
  'supabase.agentcommunity.org': {
    id: 'supabase',
    label: 'Supabase',
    icon: '⚡',

    // Replace the complex casts with our clean helper functions
    mockDiscoveryResult: mockDiscoveryFailure,
    mockHandshakeResult: mockHandshakeFailure,

    script: [
      {
        type: 'narrative',
        content: (_, domain) =>
          `I'm checking ${domain} to see if there's a Supabase agent available for database operations...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) => {
          if (!results.discovery?.success) {
            return `Discovery failed: **${results.discovery?.error || 'Unknown error'}**`;
          }
          const agentDesc = results.discovery.data?.desc ?? 'the database agent';
          const hasAuth = results.discovery.data?.auth ? ' with authentication' : '';
          return `Excellent! I found the '${agentDesc}'${hasAuth}. Let me establish a secure connection to see what database tools are available...`;
        },
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: (results) => {
          if (!results.connection?.success) {
            return `Connection failed: **${results.connection?.error || 'Unknown error'}**`;
          }
          const capCount = results.connection.data?.capabilities.length ?? 0;
          return `Connected successfully! The Supabase agent is ready with ${capCount} database management tools:`;
        },
      },
    ],
  },
  'auth0.agentcommunity.org': {
    id: 'auth0',
    label: 'Auth0',
    icon: '🔐',
    mockDiscoveryResult: mockDiscoveryFailure,
    mockHandshakeResult: mockHandshakeFailure,

    script: [
      {
        type: 'narrative',
        content: (_, domain) =>
          `Let me investigate ${domain} for identity and authentication services...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) => {
          if (!results.discovery?.success) {
            return `Discovery failed: **${results.discovery?.error || 'Unknown error'}**`;
          }
          const agentDesc = results.discovery.data?.desc ?? 'the authentication agent';
          const protocol = results.discovery.data?.protocol ?? 'unknown';
          return `Great! I discovered the '${agentDesc}' using ${protocol}. Now let's connect and explore the identity management capabilities...`;
        },
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: (results) => {
          if (!results.connection?.success) {
            return `Connection failed: **${results.connection?.error || 'Unknown error'}**`;
          }
          const capCount = results.connection.data?.capabilities.length ?? 0;
          return `Authentication established! The Auth0 agent provides ${capCount} identity management tools:`;
        },
      },
    ],
  },
  'messy.agentcommunity.org': {
    id: 'messy',
    label: 'Messy',
    icon: '🤖',
    mockDiscoveryResult: (domain) => ({
      success: true,
      data: {
        v: 'aid1',
        uri: 'tcp://messy.agentcommunity.org:9999/weird-path',
        protocol: 'custom-mcp',
        host: 'messy.agentcommunity.org',
        port: 9999,
        desc: 'Chaotic experimental agent with non-standard config',
      },
      metadata: {
        dnsQuery: domain,
        lookupTime: 245,
        recordType: 'TXT',
        source: 'DNS',
        txtRecord:
          'v=aid1;uri=tcp://messy.agentcommunity.org:9999/weird-path;protocol=custom-mcp;desc=Chaotic experimental agent with non-standard config;extra=random-data;format=chaos',
      },
    }),
    mockHandshakeResult: (_domain) => ({
      success: true,
      data: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'Chaos Agent', version: '0.1.0-alpha' },
        capabilities: [
          { id: 'random_chaos', type: 'tool' as const },
          { id: 'break_things', type: 'tool' as const },
          { id: 'confuse_user', type: 'tool' as const },
        ],
      },
    }),
    script: [
      {
        type: 'narrative',
        content: (_, domain) =>
          `Hmm, ${domain} looks interesting... let me see what's going on here...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) => {
          const agentDesc = results.discovery?.data?.desc || 'this chaotic agent';
          return `Well, this is unusual! I found '${agentDesc}' with some non-standard configuration. Let me try to connect despite the chaos...`;
        },
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: (results) => {
          const capCount = results.connection?.data?.capabilities.length || 0;
          return `Surprisingly, the connection worked! This chaotic agent offers ${capCount} experimental tools (use at your own risk):`;
        },
      },
    ],
  },
  'firecrawl.agentcommunity.org': {
    id: 'firecrawl',
    label: 'Firecrawl',
    icon: '🔥',
    mockDiscoveryResult: mockDiscoveryFailure,
    mockHandshakeResult: mockHandshakeFailure,
    script: [
      {
        type: 'narrative',
        content: () =>
          `Connecting to the Firecrawl MCP server... This agent is specialized for web scraping and research.`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: () =>
          `Discovery complete. The server is available. Now, initializing the connection to fetch the available scraping tools.`,
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: () =>
          `Connected! Firecrawl provides a powerful toolkit for data extraction. Here are the main tools you can use:`,
      },
    ],
  },
  'playwright.agentcommunity.org': {
    id: 'playwright',
    label: 'Playwright',
    icon: '🎭',
    mockDiscoveryResult: mockDiscoveryFailure,
    mockHandshakeResult: mockHandshakeFailure,
    script: [
      {
        type: 'narrative',
        content: () =>
          `Okay, I'm inspecting playwright.agentcommunity.org to see if there's a browser automation agent available...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) =>
          `Great! I found the '${results.discovery?.data?.desc}'. Now, let's try to connect and see what tools it offers.`,
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: () =>
          `Connection successful! The agent is ready. Here are the browser automation tools you can now use:`,
      },
    ],
  },
  'local-docker.agentcommunity.org': {
    id: 'local-docker',
    label: 'Local Docker',
    icon: '🐳',
    mockDiscoveryResult: (domain) => ({
      success: true,
      data: {
        v: 'aid1',
        uri: 'docker:my-agent:latest',
        protocol: 'local',
        host: domain,
        port: 0,
        desc: 'Local Docker Agent',
      },
      metadata: {
        dnsQuery: domain,
        lookupTime: 8,
        recordType: 'TXT',
        source: 'DNS',
        txtRecord: 'v=aid1;uri=docker:my-agent:latest;proto=local;desc=Local Docker Agent',
      },
    }),
    mockHandshakeResult: (_domain) => ({
      success: true,
      data: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'Local Docker MCP', version: '1.0.0' },
        capabilities: [
          { id: 'list_containers', type: 'tool' as const },
          { id: 'run_command', type: 'tool' as const },
          { id: 'get_logs', type: 'tool' as const },
        ],
      },
    }),
    script: [
      {
        type: 'narrative',
        content: (_, domain) => `Checking for a local agent manifest at ${domain}...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) =>
          `Found it! The record points to a local Docker agent: '${results.discovery?.data?.uri}'. Let's connect.`,
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: (results) =>
          `Connected to the local agent. It offers ${
            results.connection?.data?.capabilities.length || 0
          } tools for managing Docker.`,
      },
    ],
  },
  'multi-string.agentcommunity.org': {
    id: 'multi-string',
    label: 'Multi-String Record',
    icon: '📄',
    mockDiscoveryResult: (domain) => ({
      success: true,
      data: {
        v: 'aid1',
        uri: 'wss://multi.string.com/api',
        protocol: 'mcp',
        host: 'multi.string.com',
        port: 443,
        desc: 'Agent from multiple TXT records',
      },
      metadata: {
        dnsQuery: domain,
        lookupTime: 140,
        recordType: 'TXT',
        source: 'DNS',
        txtRecord:
          '"v=aid1;uri=wss://multi.string.com" "p=mcp;desc=Agent from multiple TXT records"',
      },
    }),
    mockHandshakeResult: (_domain) => ({
      success: true,
      data: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'Data Processor Agent', version: '3.2.1' },
        capabilities: [
          { id: 'concat_strings', type: 'tool' as const },
          { id: 'split_string', type: 'tool' as const },
          { id: 'reverse_string', type: 'tool' as const },
        ],
      },
    }),
    script: [
      {
        type: 'narrative',
        content: (_, domain) =>
          `Querying ${domain}, which should have its AID record split across multiple DNS strings...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) =>
          `Success. The resolver correctly joined the TXT records. The agent is '${results.discovery?.data?.desc}'. Connecting...`,
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: (results) =>
          `Connection established. This agent offers ${
            results.connection?.data?.capabilities.length || 0
          } data manipulation tools.`,
      },
    ],
  },
  'no-server.agentcommunity.org': {
    id: 'no-server',
    label: 'Offline Agent',
    icon: '👻',
    mockDiscoveryResult: (domain) => ({
      success: true,
      data: {
        v: 'aid1',
        uri: 'https://does-not-exist.agentcommunity.org:1234',
        protocol: 'mcp',
        host: 'does-not-exist.agentcommunity.org',
        port: 1234,
        desc: 'Offline Agent',
      },
      metadata: {
        dnsQuery: domain,
        lookupTime: 95,
        recordType: 'TXT',
        source: 'DNS',
        txtRecord:
          'v=aid1;uri=https://does-not-exist.agentcommunity.org:1234;p=mcp;desc=Offline Agent',
      },
    }),
    mockHandshakeResult: (_domain) => ({
      success: false,
      error: 'Connection refused by server.',
    }),
    script: [
      {
        type: 'narrative',
        content: (_, domain) =>
          `Okay, this is a special test case. I'm going to check ${domain}, which should be discoverable but offline...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) => {
          if (results.discovery?.success) {
            return `Discovery succeeded, as expected. I found the record for '${results.discovery.data?.desc}'. Now, I'll attempt to connect, but I expect this to fail...`;
          }
          return `This is unexpected. Even the discovery failed for this test case.`;
        },
      },
      { type: 'tool_call', toolId: 'connection' },
      {
        type: 'narrative',
        content: (results) => {
          if (!results.connection?.success) {
            return `Perfect, the connection failed as planned. This demonstrates a key concept: an agent can be **discoverable** (its DNS record exists) but not **reachable** (the server at the URI is offline or refusing connections). This is a common real-world scenario.`;
          }
          return `This is unexpected. The connection to the 'no-server' agent actually succeeded.`;
        },
      },
    ],
  },
  'live-unsupported': {
    id: 'live-unsupported',
    label: 'Live Domain',
    icon: '🌐',
    mockDiscoveryResult: (domain) => ({
      success: false,
      error: 'No _agent TXT record found.',
      metadata: {
        dnsQuery: domain,
        recordType: 'TXT',
        lookupTime: 120,
        source: 'DNS',
      },
    }),
    mockHandshakeResult: (_domain) => ({
      success: false,
      error: 'Connection not attempted - discovery failed.',
    }),
    script: [
      {
        type: 'narrative',
        content: (_, domain) => `Let me look up ${domain} for an agent record...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results, domain) => {
          if (results.discovery?.success) {
            return `Success! I discovered an agent at ${domain}. This public workbench does not currently support live handshakes, but your discovery record looks correct.`;
          }
          const err = results.discovery?.error || 'Unknown error';
          return `I couldn't find an agent at ${domain}. Discovery failed because: **${err}**`;
        },
      },
    ],
  },
  'default-failure': {
    id: 'default-failure',
    label: '',
    icon: '',
    mockDiscoveryResult: (domain) => ({
      success: false,
      error: 'No _agent TXT record found.',
      metadata: {
        dnsQuery: domain,
        recordType: 'TXT',
        lookupTime: 120,
        source: 'DNS',
      },
    }),
    mockHandshakeResult: (_domain) => ({
      success: false,
      error: 'Connection not attempted - discovery failed.',
    }),
    script: [
      {
        type: 'narrative',
        content: (_, domain) => `Let me check ${domain} for any available agents...`,
      },
      { type: 'tool_call', toolId: 'discovery' },
      {
        type: 'narrative',
        content: (results) => {
          const error = results.discovery?.error || 'Unknown error';
          return `I couldn't find an MCP-compliant agent at that domain. The discovery failed because: **${error}**

For an agent to be discoverable, it needs a specific DNS TXT record at \`_agent.${
            results.discovery?.metadata?.dnsQuery || 'domain.com'
          }\` containing agent interface information.`;
        },
      },
    ],
  },
};
