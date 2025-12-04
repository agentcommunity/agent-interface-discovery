import type {
  ProtocolToken,
  ProtocolHandler,
  ProtocolHandlerOptions,
  ProtocolResult,
} from './types';
import { MCPHandler } from './handlers/mcp';
import { A2AHandler } from './handlers/a2a';
import { GuidanceHandler } from './handlers/guidance';

/**
 * Protocol handler registry
 */
const handlers = new Map<ProtocolToken, ProtocolHandler>([
  ['mcp', new MCPHandler()],
  ['a2a', new A2AHandler()],
  ['openapi', new GuidanceHandler('openapi')],
  ['graphql', new GuidanceHandler('graphql')],
  ['grpc', new GuidanceHandler('grpc')],
  ['websocket', new GuidanceHandler('websocket')],
  ['local', new GuidanceHandler('local')],
  ['zeroconf', new GuidanceHandler('zeroconf')],
]);

/**
 * Get the protocol handler for a given protocol token
 */
export function getProtocolHandler(proto: ProtocolToken): ProtocolHandler {
  const handler = handlers.get(proto);
  if (!handler) {
    throw new Error(`No handler found for protocol: ${proto}`);
  }
  return handler;
}

/**
 * Handle a protocol connection/guidance request
 */
export async function handleProtocol(options: ProtocolHandlerOptions): Promise<ProtocolResult> {
  const handler = getProtocolHandler(options.proto);
  return handler.handle(options);
}

export type {
  ProtocolToken,
  ProtocolHandler,
  ProtocolHandlerOptions,
  ProtocolResult,
  AgentCard,
} from './types';
export { MCPHandler } from './handlers/mcp';
export { A2AHandler } from './handlers/a2a';
export { GuidanceHandler } from './handlers/guidance';
export { isLocalScheme, isSecureScheme, safeHostFromUri } from './utils';
