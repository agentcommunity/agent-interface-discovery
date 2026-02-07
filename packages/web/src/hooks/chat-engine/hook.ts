'use client';

import { useReducer, useCallback, useMemo } from 'react';
import type { Datasource } from '@/lib/datasources/types';
import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';
import type { ChatLogMessage, EngineState, EngineCommand } from './types';
import { reducer, initialState, uniqueId, normalizeDomainInput } from './reducer';
import {
  processDomain as processdomainOrch,
  provideAuth as provideAuthOrch,
} from './orchestration';
import { buildInputValidationSignal } from './signals';

export function useChatEngine({ datasource }: { datasource?: Datasource } = {}) {
  const [state, dispatchInternal] = useReducer(reducer, initialState);

  const addMessage = useCallback(
    (msg: ChatLogMessage) => dispatchInternal({ type: 'ADD_MESSAGE', message: msg }),
    [],
  );
  const replaceMessage = useCallback(
    (id: string, message: ChatLogMessage) =>
      dispatchInternal({ type: 'REPLACE_MESSAGE', id, message }),
    [],
  );
  const sendAssistant = useCallback(
    (content: string) => {
      addMessage({ type: 'assistant', id: uniqueId(), content });
    },
    [addMessage],
  );
  const setStatus = useCallback(
    (status: EngineState['status']) => dispatchInternal({ type: 'SET_STATUS', status }),
    [],
  );
  const setDiscovery = useCallback(
    (result: DiscoveryResult) => dispatchInternal({ type: 'SET_DISCOVERY', result }),
    [],
  );
  const setHandshake = useCallback(
    (result: HandshakeResult) => dispatchInternal({ type: 'SET_HANDSHAKE', result }),
    [],
  );

  const actions = useMemo(
    () => ({ addMessage, replaceMessage, sendAssistant, setStatus, setDiscovery, setHandshake }),
    [addMessage, replaceMessage, sendAssistant, setStatus, setDiscovery, setHandshake],
  );

  const processDomain = useCallback(
    (domain: string) => processdomainOrch(domain, datasource, actions),
    [datasource, actions],
  );

  const provideAuth = useCallback(
    (token: string) => provideAuthOrch(token, state, datasource, actions),
    [datasource, state, actions],
  );

  const dispatch = useCallback(
    (cmd: EngineCommand) => {
      if (cmd.type === 'SUBMIT_DOMAIN') {
        const input = cmd.payload.trim();
        addMessage({ type: 'user', id: uniqueId(), content: input });

        const normalized = normalizeDomainInput(input);
        if (!normalized.ok) {
          addMessage({
            type: 'status_signal',
            id: uniqueId(),
            ...buildInputValidationSignal(input, normalized.error),
          });
          setStatus('failed');
          return;
        }

        const domain = normalized.domain;
        if (domain !== input.toLowerCase()) {
          addMessage({
            type: 'status_signal',
            id: uniqueId(),
            stage: 'input',
            status: 'info',
            title: 'Input normalized',
            summary: `Using domain ${domain} for discovery.`,
            details: [
              { label: 'Original input', value: input },
              { label: 'Normalized domain', value: domain, tone: 'success' },
            ],
          });
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
