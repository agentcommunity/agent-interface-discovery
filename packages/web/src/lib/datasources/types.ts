import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';

export type ProtocolToken =
  | 'mcp'
  | 'a2a'
  | 'openapi'
  | 'grpc'
  | 'graphql'
  | 'websocket'
  | 'local'
  | 'zeroconf'
  | 'ucp';

export interface HandshakeOptions {
  /** Bearer token for authenticated handshake */
  authBearer?: string;
  /** Protocol token from discovery - determines connection behavior */
  proto?: ProtocolToken;
  /** Auth hint from discovery record (e.g., 'pat', 'oauth2_device') */
  authHint?: string;
}

/**
 * Datasource represents a strategy for performing the two core network operations of
 * the workbench: DNS discovery and protocol handshake. Different implementations (live,
 * mock, test) can satisfy this contract, allowing us to reuse a single conversation
 * engine regardless of environment.
 */
export interface Datasource {
  /** Perform AID discovery for the given domain. */
  discover(domain: string): Promise<DiscoveryResult>;

  /**
   * Perform a protocol handshake against the given URI.
   * For MCP: performs full MCP SDK handshake
   * For other protocols: returns guidance on how to connect
   */
  handshake(uri: string, options?: HandshakeOptions): Promise<HandshakeResult>;
}
