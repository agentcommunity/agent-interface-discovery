import { NextResponse } from 'next/server';
import { runCheck } from '@agentcommunity/aid-engine';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export const runtime = 'nodejs';

type SupportedScheme = 'http:' | 'https:' | 'ws:' | 'wss:';
type ProtocolToken =
  | 'mcp'
  | 'a2a'
  | 'openapi'
  | 'grpc'
  | 'graphql'
  | 'websocket'
  | 'local'
  | 'zeroconf';

interface AuthCredentials {
  bearer?: string;
  basic?: string;
  apikey?: string;
}

interface HandshakeRequestBody {
  uri: string;
  proto?: ProtocolToken;
  auth?: AuthCredentials;
}

interface ProtocolGuidance {
  canConnect: false;
  title: string;
  description: string;
  command?: string;
  docsUrl?: string;
  nextSteps: string[];
}

/** Minimal superset of the SDK's Transport with header helpers */
export interface HeaderCapableTransport {
  start: () => Promise<void>;
  close: () => Promise<void>;
  send: (...args: unknown[]) => Promise<void>;
  setHeaders?: (headers: Record<string, string>) => void;
  headers?: Record<string, string>;
}

/** Get protocol-specific guidance for non-MCP agents */
function getProtocolGuidance(proto: ProtocolToken, uri: string): ProtocolGuidance {
  const guides: Record<Exclude<ProtocolToken, 'mcp'>, ProtocolGuidance> = {
    a2a: {
      canConnect: false,
      title: 'A2A Agent Discovered',
      description:
        'This agent uses the Agent-to-Agent (A2A) protocol. Connection testing requires an A2A-compatible client.',
      docsUrl: 'https://google.github.io/A2A/',
      nextSteps: [
        'Use an A2A-compatible client to connect',
        'Fetch the agent card at ' + uri,
        'The agent card describes available skills and auth requirements',
      ],
    },
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

  return guides[proto as Exclude<ProtocolToken, 'mcp'>];
}

/** Safely extract host from URI, handling non-URL schemes */
function safeHostFromUri(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri.split('/')[0] || uri;
  }
}

/* -------------------------------------------------------------------------- */
/*                               Route Handler                                */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  const parsed = await safeParseBody(request);
  if (!parsed.ok) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const { uri, proto, auth } = parsed.value;

  // Handle non-MCP protocols with guidance instead of connection attempt
  if (proto && proto !== 'mcp') {
    const guidance = getProtocolGuidance(proto, uri);

    // Still try to get security info via aid-engine for non-MCP protocols
    let security: Record<string, unknown> | undefined;
    try {
      const parsedUri = safeHostFromUri(uri);
      const isSecureScheme = uri.startsWith('https://') || uri.startsWith('wss://');
      if (parsedUri && isSecureScheme && !isPrivateHost(parsedUri.split(':')[0])) {
        const report = await runCheck(parsedUri.split(':')[0], {
          timeoutMs: 4000,
          allowFallback: true,
          wellKnownTimeoutMs: 1500,
          showDetails: true,
        });
        security = {
          dnssec: report.dnssec.present,
          pka: report.pka,
          tls: report.tls,
          warnings: report.record.warnings,
          errors: report.record.errors,
        };
      }
    } catch {
      /* best-effort security check */
    }

    return NextResponse.json({
      success: true,
      proto,
      guidance,
      security,
    });
  }

  const url = new URL(uri);

  // Guardrails
  if (isPrivateHost(url.hostname)) {
    return NextResponse.json({ success: false, error: 'Target host not allowed' }, { status: 400 });
  }
  if (!isSupportedScheme(url.protocol as SupportedScheme)) {
    return NextResponse.json(
      {
        success: false,
        needsAuth: true,
        compliantAuth: false,
        error:
          'Unsupported URI scheme: ' +
          url.protocol +
          '. Provide a Personal Access Token or run a local proxy.',
      },
      { status: 401 },
    );
  }

  /* ---------- Optional unauthenticated probe for compliant auth ---------- */
  let isCompliantAuth = false;
  let authMetadataUri: string | undefined;

  if (url.protocol.startsWith('http')) {
    try {
      const head = await fetch(url.toString(), { method: 'HEAD', redirect: 'manual' });
      if (head.status === 401) {
        const headerVal = head.headers.get('www-authenticate') ?? undefined;
        const match = headerVal?.match(/as_uri="([^"]+)"/i);
        if (match) {
          isCompliantAuth = true;
          authMetadataUri = match[1];
        }
      }
    } catch {
      /* probe failures are non-fatal */
    }
  }

  /* ------------------------------ Handshake ------------------------------ */
  try {
    const transport = createTransport(url, auth);
    const client = new Client({ name: 'aid-discovery-web', version: '1.0.0' });

    await client.connect(transport as unknown as Transport);
    const capabilities = await client.listTools();
    await client.close();

    let security: Record<string, unknown> | undefined;
    try {
      const report = await runCheck(url.hostname, {
        timeoutMs: 4000,
        allowFallback: true,
        wellKnownTimeoutMs: 1500,
        showDetails: true,
      });
      security = {
        dnssec: report.dnssec.present,
        pka: report.pka,
        tls: report.tls,
        warnings: report.record.warnings,
        errors: report.record.errors,
      };
    } catch {
      /* best-effort; ignore */
    }

    return NextResponse.json({
      success: true,
      proto: proto || 'mcp',
      data: {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'Connected Server', version: '1.0.0' },
        capabilities: capabilities.tools ?? [],
        security,
      },
    });
  } catch (error: unknown) {
    const { body, status } = buildError(error, isCompliantAuth, authMetadataUri);
    return NextResponse.json(body, { status });
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

function isSupportedScheme(p: SupportedScheme): boolean {
  return ['http:', 'https:', 'ws:', 'wss:'].includes(p);
}

function isPrivateHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

async function safeParseBody(
  req: Request,
): Promise<
  | { ok: true; value: HandshakeRequestBody }
  | { ok: false; error: { success: false; error: string } }
> {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== 'object') {
      return { ok: false, error: { success: false, error: 'Missing or invalid body' } };
    }
    const maybe = body as Partial<HandshakeRequestBody>;
    if (typeof maybe.uri !== 'string') {
      return { ok: false, error: { success: false, error: 'Missing or invalid URI' } };
    }
    return { ok: true, value: maybe as HandshakeRequestBody };
  } catch {
    return { ok: false, error: { success: false, error: 'Invalid JSON body' } };
  }
}

function createTransport(url: URL, auth?: AuthCredentials): HeaderCapableTransport {
  const transport: HeaderCapableTransport = url.protocol.startsWith('ws')
    ? (new WebSocketClientTransport(url) as unknown as HeaderCapableTransport)
    : (new StreamableHTTPClientTransport(url) as unknown as HeaderCapableTransport);

  if (!auth) return transport;

  const hdrs: Record<string, string> = {};
  if (auth.bearer) hdrs.Authorization = 'Bearer ' + auth.bearer;
  if (auth.basic) hdrs.Authorization = 'Basic ' + auth.basic;
  if (auth.apikey) hdrs['x-api-key'] = auth.apikey;

  if (Object.keys(hdrs).length === 0) return transport;

  if (typeof transport.setHeaders === 'function') {
    transport.setHeaders(hdrs);
  } else {
    transport.headers = transport.headers ? { ...transport.headers, ...hdrs } : { ...hdrs };
  }

  return transport;
}

function buildError(error: unknown, compliant: boolean, metaUri?: string) {
  const msg = error instanceof Error ? error.message : String(error);
  const needsAuth = /401|403|unauthori[sz]ed/i.test(msg);
  const body: Record<string, unknown> = { success: false, error: msg };
  if (needsAuth) {
    body.needsAuth = true;
    body.compliantAuth = compliant;
    if (metaUri) body.metadataUri = metaUri;
  }
  return { status: needsAuth ? 401 : 500, body };
}
