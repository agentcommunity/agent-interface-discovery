import type { DiscoveryResult, DiscoveryData, DiscoveryMetadata } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';

// ---------------------------------------------------------------------------
// Chat message modelling
// ---------------------------------------------------------------------------

export interface DiscoveryResultMessage {
  type: 'discovery_result';
  id: string;
  domain: string;
  result: DiscoveryResult;
}

export interface ConnectionResultMessage {
  type: 'connection_result';
  id: string;
  status: 'success' | 'error' | 'needs_auth';
  discovery: { record: DiscoveryData; metadata: DiscoveryMetadata };
  result: HandshakeResult;
}

export type ChatLogMessage =
  | { type: 'user'; id: string; content: string }
  | { type: 'assistant'; id: string; content: string; onComplete?: () => void }
  | { type: 'tool_event'; id: string; tool: 'discovery' | 'connection'; detail: string }
  | DiscoveryResultMessage
  | ConnectionResultMessage
  | {
      type: 'tool_call';
      id: string;
      toolId: 'discovery' | 'connection';
      status?: 'running' | 'success' | 'error' | 'needs_auth';
      domain?: string;
      result?: unknown;
      discoveryResult?: unknown;
    }
  | { type: 'summary'; id: string; handshakeResult: HandshakeResult }
  | { type: 'error_message'; id: string; content: string };

// ---------------------------------------------------------------------------
// Engine state
// ---------------------------------------------------------------------------

export interface EngineState {
  status:
    | 'idle'
    | 'discovering'
    | 'discovery_failed'
    | 'connecting'
    | 'needs_auth'
    | 'connected'
    | 'failed';
  domain: string | null;
  discovery?: DiscoveryResult;
  handshake?: HandshakeResult;
  messages: ChatLogMessage[];
}

export type EngineCommand =
  | { type: 'SUBMIT_DOMAIN'; payload: string }
  | { type: 'PROVIDE_AUTH'; payload: string };

export type Action =
  | { type: 'SET_STATUS'; status: EngineState['status'] }
  | { type: 'SET_DOMAIN'; domain: string }
  | { type: 'SET_DISCOVERY'; result: DiscoveryResult }
  | { type: 'SET_HANDSHAKE'; result: HandshakeResult }
  | { type: 'ADD_MESSAGE'; message: ChatLogMessage };
