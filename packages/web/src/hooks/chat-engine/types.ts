import type { DiscoveryResult, DiscoveryData, DiscoveryMetadata } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';

// ---------------------------------------------------------------------------
// Chat message modelling
// ---------------------------------------------------------------------------

export type SignalStage = 'input' | 'discovery' | 'connection' | 'auth';
export type SignalStatus = 'running' | 'success' | 'error' | 'needs_auth' | 'info';

export interface SignalDetail {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

export interface StatusSignalMessage {
  type: 'status_signal';
  id: string;
  stage: SignalStage;
  status: SignalStatus;
  title: string;
  summary?: string;
  domain?: string;
  errorCode?: string;
  details?: SignalDetail[];
  hints?: string[];
  discoveryResult?: DiscoveryResult;
  connectionResult?: {
    discovery: { record: DiscoveryData; metadata: DiscoveryMetadata };
    result: HandshakeResult;
  };
}

export type ChatLogMessage =
  | { type: 'user'; id: string; content: string }
  | { type: 'assistant'; id: string; content: string; onComplete?: () => void }
  | StatusSignalMessage
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
  | { type: 'REPLACE_MESSAGE'; id: string; message: ChatLogMessage }
  | { type: 'ADD_MESSAGE'; message: ChatLogMessage };
