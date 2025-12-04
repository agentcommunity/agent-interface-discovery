import { NextResponse } from 'next/server';
import { runCheck } from '@agentcommunity/aid-engine';
import { handleProtocol, isLocalScheme } from '@/lib/protocols';
import type { ProtocolToken } from '@/lib/protocols';

export const runtime = 'nodejs';

type SupportedScheme = 'http:' | 'https:' | 'ws:' | 'wss:';

interface AuthCredentials {
  bearer?: string;
  basic?: string;
  apikey?: string;
}

interface HandshakeRequestBody {
  uri: string;
  proto?: ProtocolToken;
  auth?: AuthCredentials;
  /** Auth hint from discovery record (e.g., 'pat', 'oauth2_device') */
  authHint?: string;
}

/** Safely extract host from URI, handling non-URL schemes */
function safeHostFromUri(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri.split('/')[0] || uri;
  }
}

/**
 * Get security info for a domain using aid-engine
 */
async function getSecurityInfo(hostname: string): Promise<Record<string, unknown> | undefined> {
  try {
    if (isPrivateHost(hostname)) return undefined;
    const report = await runCheck(hostname, {
      timeoutMs: 4000,
      allowFallback: true,
      wellKnownTimeoutMs: 1500,
      showDetails: true,
    });
    return {
      dnssec: report.dnssec.present,
      pka: report.pka,
      tls: report.tls,
      warnings: report.record.warnings,
      errors: report.record.errors,
    };
  } catch {
    return undefined;
  }
}

/**
 * Build auth error response with appropriate message based on URI scheme and auth hint
 */
function buildAuthError(
  error: unknown,
  uri: string,
  authHint?: string,
  compliantAuth?: boolean,
  metadataUri?: string,
): { body: Record<string, unknown>; status: number } {
  const msg = error instanceof Error ? error.message : String(error);
  const isLocal = isLocalScheme(uri);

  const body: Record<string, unknown> = {
    success: false,
    error: msg,
    needsAuth: true,
    compliantAuth: compliantAuth ?? false,
  };

  if (metadataUri) {
    body.metadataUri = metadataUri;
  }

  // Add auth type hint based on URI scheme and auth field
  if (isLocal) {
    body.authType = 'local_cli';
  } else switch (authHint) {
 case 'pat': {
    body.authType = 'pat';
  
 break;
 }
 case 'oauth2_device': {
    body.authType = 'oauth2_device';
  
 break;
 }
 case 'oauth2_code': {
    body.authType = 'oauth2_code';
  
 break;
 }
 default: body.authType = compliantAuth ? 'compliant' : 'generic';
 }

  return { body, status: 401 };
}

/* -------------------------------------------------------------------------- */
/*                               Route Handler                                */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  const parsed = await safeParseBody(request);
  if (!parsed.ok) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const { uri, proto: protoParam, auth, authHint } = parsed.value;
  const proto: ProtocolToken = (protoParam || 'mcp');

  // Guardrails: check for private hosts and unsupported schemes
  try {
    const url = new URL(uri);
    if (isPrivateHost(url.hostname)) {
      return NextResponse.json(
        { success: false, error: 'Target host not allowed' },
        { status: 400 },
      );
    }
    if (!isSupportedScheme(url.protocol as SupportedScheme) && proto === 'mcp') {
      return NextResponse.json(
        {
          success: false,
          needsAuth: true,
          compliantAuth: false,
          authType: isLocalScheme(uri) ? 'local_cli' : 'generic',
          error:
            'Unsupported URI scheme: ' +
            url.protocol +
            '. Provide a Personal Access Token or run a local proxy.',
        },
        { status: 401 },
      );
    }
  } catch {
    // URI parsing failed - might be a local scheme like npx:, docker:, etc.
    // Continue to protocol handler
  }

  // Optional unauthenticated probe for compliant auth (MCP only)
  let isCompliantAuth = false;
  let authMetadataUri: string | undefined;

  if (proto === 'mcp') {
    try {
      const url = new URL(uri);
      if (url.protocol.startsWith('http')) {
        const head = await fetch(url.toString(), { method: 'HEAD', redirect: 'manual' });
        if (head.status === 401) {
          const headerVal = head.headers.get('www-authenticate') ?? undefined;
          const match = headerVal?.match(/as_uri="([^"]+)"/i);
          if (match) {
            isCompliantAuth = true;
            authMetadataUri = match[1];
          }
        }
      }
    } catch {
      /* probe failures are non-fatal */
    }
  }

  // Use protocol registry to handle the request
  try {
    const result = await handleProtocol({
      uri,
      proto,
      auth,
    });

    // Get security info if we have a hostname
    let security: Record<string, unknown> | undefined;
    try {
      const hostname = safeHostFromUri(uri).split(':')[0];
      if (hostname && !isPrivateHost(hostname)) {
        security = await getSecurityInfo(hostname);
      }
    } catch {
      /* best-effort */
    }

    // Handle successful results
    if (result.success) {
      const response: Record<string, unknown> = {
        success: true,
        proto: result.proto,
        security,
      };

      // Add protocol-specific data
      if (result.data) {
        response.data = {
          ...result.data,
          security: security || result.data.security,
        };
      }

      if (result.agentCard) {
        response.agentCard = result.agentCard;
      }

      if (result.guidance) {
        response.guidance = result.guidance;
      }

      return NextResponse.json(response);
    }

    // Handle errors
    if (result.needsAuth) {
      const { body, status } = buildAuthError(
        new Error(result.error || 'Authentication required'),
        uri,
        authHint,
        result.compliantAuth ?? isCompliantAuth,
        result.metadataUri || authMetadataUri,
      );
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Protocol handling failed',
      },
      { status: 500 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const needsAuth = /401|403|unauthori[sz]ed/i.test(msg);

    if (needsAuth) {
      const { body, status } = buildAuthError(
        error,
        uri,
        authHint,
        isCompliantAuth,
        authMetadataUri,
      );
      return NextResponse.json(body, { status });
    }

    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 },
    );
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
