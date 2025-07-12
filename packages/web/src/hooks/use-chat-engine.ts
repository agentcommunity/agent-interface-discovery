'use client';

import { useReducer, useCallback } from 'react';
import { LiveDatasource } from '@/lib/datasources/live-datasource';
import type { Datasource } from '@/lib/datasources/types';
import { MockDatasource } from '@/lib/datasources/mock-datasource';
import { toolManifests } from '@/lib/tool-manifest-data';
import type { ScenarioManifest } from '@/lib/tool-manifest-types';
import type { DiscoveryResult, DiscoveryData, DiscoveryMetadata } from '@/hooks/use-discovery';
import { type HandshakeResult, AuthRequiredError } from '@/hooks/use-connection';
import { isOk } from '@/lib/types/result';

// -----------------------------------------------------------------------------
// 1. Chat message modelling (kept close to previous shape for UI compatibility)
// -----------------------------------------------------------------------------

/** A discovery operation has completed. */
export interface DiscoveryResultMessage {
  type: 'discovery_result';
  id: string;
  domain: string;
  result: DiscoveryResult;
}

/** A handshake operation has completed. */
export interface ConnectionResultMessage {
  type: 'connection_result';
  id: string;
  status: 'success' | 'error' | 'needs_auth';
  /** The successful discovery data that led to this connection attempt. */
  discovery: { record: DiscoveryData; metadata: DiscoveryMetadata };
  result: HandshakeResult;
}

export type ChatLogMessage =
  | { type: 'user'; id: string; content: string }
  | { type: 'assistant'; id: string; content: string; onComplete?: () => void }
  | { type: 'tool_event'; id: string; tool: 'discovery' | 'connection'; detail: string }
  | DiscoveryResultMessage
  | ConnectionResultMessage
  // Legacy variants kept for UI compatibility during migration
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

// -----------------------------------------------------------------------------
// 2. Engine State & Actions (finite-state machine via useReducer)
// -----------------------------------------------------------------------------

interface EngineState {
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

const initialState: EngineState = {
  status: 'idle',
  domain: null,
  messages: [],
};

// External commands consumer can dispatch
export type EngineCommand =
  | { type: 'SUBMIT_DOMAIN'; payload: string }
  | { type: 'PROVIDE_AUTH'; payload: string };

// Internal reducer actions
type Action =
  | { type: 'SET_STATUS'; status: EngineState['status'] }
  | { type: 'SET_DOMAIN'; domain: string }
  | { type: 'SET_DISCOVERY'; result: DiscoveryResult }
  | { type: 'SET_HANDSHAKE'; result: HandshakeResult }
  | { type: 'ADD_MESSAGE'; message: ChatLogMessage };

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_DOMAIN':
      return { ...state, domain: action.domain };
    case 'SET_DISCOVERY':
      return { ...state, discovery: action.result };
    case 'SET_HANDSHAKE':
      return { ...state, handshake: action.result };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    default:
      return state;
  }
}

// -----------------------------------------------------------------------------
// 3. Helper utilities
// -----------------------------------------------------------------------------

const uniqueId = () => `${Date.now()}-${Math.random()}`;

const isValidDomain = (domain: string) => {
  const regex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
  return regex.test(domain);
};

// -----------------------------------------------------------------------------
// 4. The Hook (datasource-agnostic)
// -----------------------------------------------------------------------------
export function useChatEngine({ datasource }: { datasource?: Datasource } = {}) {
  const [state, dispatchInternal] = useReducer(reducer, initialState);

  // Helper wrappers to reduce boilerplate in async logic
  const addMessage = useCallback(
    (msg: ChatLogMessage) => dispatchInternal({ type: 'ADD_MESSAGE', message: msg }),
    [],
  );
  const sendAssistant = useCallback(
    (content: string): Promise<void> =>
      new Promise((resolve) => {
        addMessage({ type: 'assistant', id: uniqueId(), content, onComplete: resolve });
      }),
    [addMessage],
  );
  const setStatus = (status: EngineState['status']) =>
    dispatchInternal({ type: 'SET_STATUS', status });
  const setDiscovery = (result: DiscoveryResult) =>
    dispatchInternal({ type: 'SET_DISCOVERY', result });
  const setHandshake = (result: HandshakeResult) =>
    dispatchInternal({ type: 'SET_HANDSHAKE', result });

  const processDomain = useCallback(
    async (domain: string) => {
      // Select datasource and manifest (if any)
      const scenario: ScenarioManifest | undefined = toolManifests[domain];
      const selectedDs =
        datasource ??
        (scenario && !scenario.live ? new MockDatasource(domain) : new LiveDatasource());

      // Narrative 1 (always)
      await (scenario?.narrative1 ? sendAssistant(scenario.narrative1.replace('{domain}', domain)) : sendAssistant('Let me see…'));

      // 1. Discovery phase
      setStatus('discovering');
      const discoveryRes = await selectedDs.discover(domain);
      setDiscovery(discoveryRes);

      if (!isOk(discoveryRes)) {
        // Discovery failed path
        addMessage({
          type: 'discovery_result',
          id: uniqueId(),
          result: discoveryRes,
          domain,
        });

        if (scenario?.narrative2) {
          const errMsg = discoveryRes.error.message ?? 'Error';
          await sendAssistant(scenario.narrative2.replace('{error}', errMsg));
        } else {
          await sendAssistant(
            `I couldn’t find an _agent record for ${domain}. If you manage this domain you can create one using our generator tool.`,
          );
        }

        setStatus('discovery_failed');
        return;
      }

      // --- Discovery succeeded ---
      const { record: discoveryRecord } = discoveryRes.value;

      // Successful discovery narrative2
      if (scenario?.narrative2 && !scenario.narrative2.includes('{error}')) {
        const formatted = scenario.narrative2
          .replace('{desc}', discoveryRecord.desc ?? '')
          .replace('{protocol}', discoveryRecord.proto)
          .replace('{uri}', discoveryRecord.uri)
          .replace('{domain}', domain);
        await sendAssistant(formatted);
      }

      addMessage({
        type: 'discovery_result',
        id: uniqueId(),
        result: discoveryRes,
        domain,
      });

      // 2. Connection phase
      setStatus('connecting');
      const handshakeRes = await selectedDs.handshake(discoveryRecord.uri);
      setHandshake(handshakeRes);

      if (isOk(handshakeRes)) {
        // --- Handshake succeeded ---
        addMessage({
          type: 'connection_result',
          id: uniqueId(),
          status: 'success',
          discovery: discoveryRes.value,
          result: handshakeRes,
        });
        if (scenario?.narrative3) {
          const handshakeData = handshakeRes.value;
          const capCount = handshakeData.capabilities.length;
          await sendAssistant(scenario.narrative3.replace('{capCount}', String(capCount)));
        }
        setStatus('connected');
        return;
      }

      // --- Handshake failed ---
      if (handshakeRes.error instanceof AuthRequiredError) {
        addMessage({
          type: 'connection_result',
          id: uniqueId(),
          status: 'needs_auth',
          discovery: discoveryRes.value,
          result: handshakeRes,
        });
        setStatus('needs_auth');
      } else {
        if (scenario?.narrative3) {
          await sendAssistant(`Connection failed: ${handshakeRes.error.message}`);
        }
        addMessage({
          type: 'connection_result',
          id: uniqueId(),
          status: 'error',
          discovery: discoveryRes.value,
          result: handshakeRes,
        });
        setStatus('failed');
      }
    },
    [datasource, sendAssistant, addMessage],
  );

  const provideAuth = useCallback(
    async (token: string) => {
      if (state.status !== 'needs_auth' || !state.discovery || !isOk(state.discovery)) return;

      const uri = state.discovery.value.record.uri;
      setStatus('connecting');
      addMessage({ type: 'tool_event', id: uniqueId(), tool: 'connection', detail: 'auth_retry' });

      const selectedDs =
        datasource ??
        (toolManifests[state.domain!] ? new MockDatasource(state.domain!) : new LiveDatasource());

      const handshakeRes = await selectedDs.handshake(uri, { authBearer: token });
      setHandshake(handshakeRes);

      if (isOk(handshakeRes)) {
        setStatus('connected');
        addMessage({ type: 'tool_event', id: uniqueId(), tool: 'connection', detail: 'succeeded' });
        // TODO: Push a new `connection_result` message to update the UI with tools.
      } else {
        setStatus('failed');
        addMessage({ type: 'tool_event', id: uniqueId(), tool: 'connection', detail: 'failed' });
        // TODO: Push a new `connection_result` message to show the new error.
      }
    },
    [datasource, state.status, state.discovery, state.domain, addMessage],
  );

  // Public dispatcher
  const dispatch = useCallback(
    (cmd: EngineCommand) => {
      if (cmd.type === 'SUBMIT_DOMAIN') {
        const domain = cmd.payload.trim();
        addMessage({ type: 'user', id: uniqueId(), content: domain });

        if (!isValidDomain(domain)) {
          addMessage({
            type: 'assistant',
            id: uniqueId(),
            content: 'Please enter a valid domain (e.g., example.com).',
          });
          setStatus('failed');
          return;
        }

        dispatchInternal({ type: 'SET_DOMAIN', domain });
        void processDomain(domain);
      } else if (cmd.type === 'PROVIDE_AUTH') {
        void provideAuth(cmd.payload);
      }
    },
    [processDomain, provideAuth, addMessage],
  );

  return { state, dispatch } as const;
}
