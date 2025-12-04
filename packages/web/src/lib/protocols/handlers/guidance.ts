import type {
  ProtocolToken,
  ProtocolHandler,
  ProtocolHandlerOptions,
  ProtocolResult,
} from '../types';
import { safeHostFromUri } from '../utils';

/**
 * Get protocol-specific guidance for non-MCP, non-A2A protocols
 */
function getProtocolGuidance(proto: ProtocolToken, uri: string): ProtocolResult['guidance'] {
  const guides: Record<Exclude<ProtocolToken, 'mcp' | 'a2a'>, ProtocolResult['guidance']> = {
    openapi: {
      canConnect: false,
      title: 'OpenAPI Agent Discovered',
      description: 'This URI points to an OpenAPI specification document describing the agent API.',
      docsUrl: 'https://swagger.io/specification/',
      nextSteps: [
        'Fetch the OpenAPI spec at ' + uri,
        'Use tools like Swagger UI or Postman to explore the API',
        'Generate a client using openapi-generator',
      ],
    },
    graphql: {
      canConnect: false,
      title: 'GraphQL Agent Discovered',
      description: 'This agent exposes a GraphQL API endpoint.',
      docsUrl: 'https://graphql.org/',
      nextSteps: [
        'Connect to ' + uri + ' with a GraphQL client',
        'Run an introspection query to discover the schema',
        'Use GraphQL Playground or Apollo Studio to explore',
      ],
    },
    grpc: {
      canConnect: false,
      title: 'gRPC Agent Discovered',
      description: 'This agent uses gRPC over HTTP/2. Browser-based connection is limited.',
      docsUrl: 'https://grpc.io/',
      nextSteps: [
        'Use grpcurl or a native gRPC client',
        'grpcurl -plaintext ' + safeHostFromUri(uri) + ' list',
        'Check if the server supports gRPC-Web for browser access',
      ],
    },
    websocket: {
      canConnect: false,
      title: 'WebSocket Agent Discovered',
      description: 'This agent communicates over WebSocket (WSS).',
      nextSteps: [
        'Connect to ' + uri + ' using a WebSocket client',
        'Check the agent documentation for message format',
        'Use browser DevTools or wscat for testing',
      ],
    },
    local: {
      canConnect: false,
      title: 'Local Agent Discovered',
      description: 'This agent runs locally on your machine via Docker, npx, or pip.',
      command: uri,
      nextSteps: [
        'Run: ' + uri.replace(':', ' '),
        'The agent will start on your local machine',
        'Connect to it using the appropriate client',
      ],
    },
    zeroconf: {
      canConnect: false,
      title: 'Zeroconf Agent Discovered',
      description: 'This agent is discovered via mDNS/DNS-SD on your local network.',
      nextSteps: [
        'Browse for service: ' + uri.replace('zeroconf:', ''),
        'Use dns-sd or avahi-browse to find local instances',
        'Connect to the discovered IP:port',
      ],
    },
  };

  return guides[proto as Exclude<ProtocolToken, 'mcp' | 'a2a'>];
}

/**
 * Guidance handler for protocols that don't support direct connection
 */
export class GuidanceHandler implements ProtocolHandler {
  constructor(public readonly token: ProtocolToken) {}

  get canConnect(): boolean {
    return false;
  }

  handle(options: ProtocolHandlerOptions): Promise<ProtocolResult> {
    const guidance = getProtocolGuidance(this.token, options.uri);
    return Promise.resolve({
      success: true,
      proto: this.token,
      guidance,
    });
  }
}
