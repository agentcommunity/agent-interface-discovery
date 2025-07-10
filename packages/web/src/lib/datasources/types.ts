import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';

/**
 * Datasource represents a strategy for performing the two core network operations of
 * the workbench: DNS discovery and MCP handshake.  Different implementations (live,
 * mock, test) can satisfy this contract, allowing us to reuse a single conversation
 * engine regardless of environment.
 */
export interface Datasource {
  /** Perform AID discovery for the given domain. */
  discover(domain: string): Promise<DiscoveryResult>;

  /** Perform an MCP handshake against the given URI. */
  handshake(uri: string, options?: { authBearer?: string }): Promise<HandshakeResult>;
}
