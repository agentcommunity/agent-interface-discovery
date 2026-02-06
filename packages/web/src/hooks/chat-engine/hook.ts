'use client';

import { useReducer, useCallback } from 'react';
import type { Datasource } from '@/lib/datasources/types';
import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';
import type { ChatLogMessage, EngineState, EngineCommand } from './types';
import { reducer, initialState, uniqueId, isValidDomain } from './reducer';
import {
  processDomain as processdomainOrch,
  provideAuth as provideAuthOrch,
} from './orchestration';

export function useChatEngine({ datasource }: { datasource?: Datasource } = {}) {
  const [state, dispatchInternal] = useReducer(reducer, initialState);

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

  const actions = { addMessage, sendAssistant, setStatus, setDiscovery, setHandshake };

  const processDomain = useCallback(
    (domain: string) => processdomainOrch(domain, datasource, actions),
    [datasource, actions.sendAssistant, actions.addMessage],
  );

  const provideAuth = useCallback(
    (token: string) => provideAuthOrch(token, state, datasource, actions),
    [datasource, state.status, state.discovery, state.domain, actions.addMessage],
  );

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
