import { NextResponse } from 'next/server';
import { runCheck } from '@agentcommunity/aid-engine';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export const runtime = 'nodejs';

type SupportedScheme = 'http:' | 'https:' | 'ws:' | 'wss:';

interface AuthCredentials {
  bearer?: string;
  basic?: string;
  apikey?: string;
}

interface HandshakeRequestBody {
  uri: string;
  auth?: AuthCredentials;
}

/** Minimal superset of the SDK’s Transport with header helpers */
export interface HeaderCapableTransport {
  start: () => Promise<void>;
  close: () => Promise<void>;
  send: (...args: unknown[]) => Promise<void>;
  setHeaders?: (headers: Record<string, string>) => void;
  headers?: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/*                               Route Handler                                */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  const parsed = await safeParseBody(request);
  if (!parsed.ok) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const { uri, auth } = parsed.value;
  const url = new URL(uri);

  // Guardrails
  if (isPrivateHost(url.hostname)) {
    return NextResponse.json({ success: false, error: 'Target host not allowed' }, { status: 400 });
  }
  // If the scheme isn't one we can connect to directly from the browser, treat it as
  // requiring a local Personal Access Token (PAT) / CLI proxy rather than a hard failure.
  if (!isSupportedScheme(url.protocol as SupportedScheme)) {
    return NextResponse.json(
      {
        success: false,
        needsAuth: true,
        compliantAuth: false,
        error: `Unsupported URI scheme: ${url.protocol}. Provide a Personal Access Token or run a local proxy.`,
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

    // The cast is safe because createTransport conforms to Transport at runtime
    await client.connect(transport as unknown as Transport);
    const capabilities = await client.listTools();
    await client.close();

    // Build a minimal security snapshot via engine (domain-based)
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
    // assert to unknown so the RHS is not `any`
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
  if (auth.bearer) hdrs.Authorization = `Bearer ${auth.bearer}`;
  if (auth.basic) hdrs.Authorization = `Basic ${auth.basic}`;
  if (auth.apikey) hdrs['x-api-key'] = auth.apikey;

  if (Object.keys(hdrs).length === 0) return transport;

  if (typeof transport.setHeaders === 'function') {
    transport.setHeaders(hdrs);
  } else {
    // clone into a new object → avoids the “useless fallback in spread” warning
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
