import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { WebSocketClientTransport } from '@modelcontextprotocol/sdk/client/websocket.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { ProtocolHandler, ProtocolHandlerOptions, ProtocolResult } from '../types';

/** Minimal superset of the SDK's Transport with header helpers */
interface HeaderCapableTransport {
  start: () => Promise<void>;
  close: () => Promise<void>;
  send: (...args: unknown[]) => Promise<void>;
  setHeaders?: (headers: Record<string, string>) => void;
  headers?: Record<string, string>;
}

/**
 * MCP protocol handler - performs MCP SDK handshake
 */
export class MCPHandler implements ProtocolHandler {
  readonly token = 'mcp' as const;
  readonly canConnect = true;

  async handle(options: ProtocolHandlerOptions): Promise<ProtocolResult> {
    const { uri, auth } = options;

    try {
      const url = new URL(uri);
      const transport = this.createTransport(url, auth);
      const client = new Client({ name: 'aid-discovery-web', version: '1.0.0' });

      await client.connect(transport as unknown as Transport);
      const toolsResult = await client.listTools();
      await client.close();

      // Map tools to our expected capability structure
      const capabilities = (toolsResult.tools ?? []).map((tool) => ({
        id: tool.name,
        type: 'tool' as const,
      }));

      return {
        success: true,
        proto: this.token,
        data: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: 'Connected Server', version: '1.0.0' },
          capabilities,
        },
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const needsAuth = /401|403|unauthori[sz]ed/i.test(msg);

      if (needsAuth) {
        return {
          success: false,
          proto: this.token,
          needsAuth: true,
          compliantAuth: false, // Will be set by route handler if compliant
          error: msg,
        };
      }

      return {
        success: false,
        proto: this.token,
        error: msg,
      };
    }
  }

  private createTransport(url: URL, auth?: ProtocolHandlerOptions['auth']): HeaderCapableTransport {
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
}
