'use client';

import { useState, useCallback, useRef } from 'react';
import { useDiscovery, type DiscoveryResult } from '@/hooks/use-discovery';
import { useConnection, type HandshakeResult } from '@/hooks/use-connection';
import { getManifestForDomain } from '@/lib/tool-manifests';

// Simple unique ID generator to avoid external dependency issues.
const uniqueId = () => `${Date.now()}-${Math.random()}`;

// Simple domain validation (no protocol / path)
const isValidDomain = (domain: string) => {
  const regex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
  return regex.test(domain);
};

// == 1. SHARED TYPES ==========================================================

export interface ToolResults {
  discovery?: DiscoveryResult;
  connection?: HandshakeResult;
}

export type ChatLogMessage =
  | { type: 'user'; id: string; content: string }
  | { type: 'assistant'; id: string; content: string; onComplete?: () => void }
  | {
      type: 'tool_call';
      id: string;
      toolId: 'discovery';
      status: 'running' | 'success' | 'error';
      domain: string;
      result: DiscoveryResult | null;
    }
  | {
      type: 'tool_call';
      id: string;
      toolId: 'connection';
      status: 'running' | 'success' | 'error' | 'needs_auth';
      discoveryResult: DiscoveryResult;
      result: HandshakeResult | null;
    }
  | { type: 'summary'; id: string; handshakeResult: HandshakeResult }
  | { type: 'error_message'; id: string; content: string };

export interface ChatEngineState {
  messages: ChatLogMessage[];
  status: 'idle' | 'running' | 'waiting_auth' | 'complete' | 'failed';
}

export type EngineCommand =
  | { type: 'SUBMIT_DOMAIN'; payload: string }
  | { type: 'PROVIDE_AUTH'; payload: string };

export interface ChatEngine {
  state: ChatEngineState;
  dispatch: (command: EngineCommand) => void;
}

const INITIAL_STATE: ChatEngineState = {
  messages: [],
  status: 'idle',
};

// == 2. THE CHAT ENGINE HOOK ==================================================

export function useChatEngine(): ChatEngine {
  const [state, setState] = useState<ChatEngineState>(INITIAL_STATE);

  const discovery = useRef(useDiscovery());
  const connection = useRef(useConnection());

  const run = useCallback(async (domain: string) => {
    setState((s) => ({ ...s, status: 'running' }));
    const manifest = getManifestForDomain(domain);
    const currentToolResults: ToolResults = {};

    for (const step of manifest.script) {
      if (step.type === 'narrative') {
        const content = step.content(currentToolResults, domain);
        await new Promise<void>((resolve) => {
          const newMessage: ChatLogMessage = {
            type: 'assistant',
            id: uniqueId(),
            content,
            onComplete: resolve,
          };
          setState((s) => ({ ...s, messages: [...s.messages, newMessage] }));
        });
      } else if (step.type === 'tool_call') {
        if (step.toolId === 'discovery') {
          const msgId = uniqueId();
          const toolMessage: ChatLogMessage = {
            type: 'tool_call',
            id: msgId,
            toolId: 'discovery',
            status: 'running',
            domain: domain,
            result: null,
          };
          setState((s) => ({ ...s, messages: [...s.messages, toolMessage] }));

          const result = await discovery.current.execute(domain);
          currentToolResults.discovery = result;
          lastDiscoveryResultRef.current = result;
          setState((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === msgId && m.type === 'tool_call' && m.toolId === 'discovery'
                ? { ...m, status: result.success ? 'success' : 'error', result }
                : m,
            ),
          }));

          if (!result.success) {
            setState((s) => ({ ...s, status: 'failed' }));
            if (manifest.id === 'default-failure') {
              return;
            }
          }
        } else if (step.toolId === 'connection') {
          if (!currentToolResults.discovery?.success || !currentToolResults.discovery.data?.uri) {
            const errorMessage: ChatLogMessage = {
              type: 'error_message',
              id: uniqueId(),
              content: 'Discovery failed, cannot connect.',
            };
            setState((s) => ({
              ...s,
              status: 'failed',
              messages: [...s.messages, errorMessage],
            }));
            return;
          }

          const msgId = uniqueId();
          const toolMessage: ChatLogMessage = {
            type: 'tool_call',
            id: msgId,
            toolId: 'connection',
            status: 'running',
            discoveryResult: currentToolResults.discovery,
            result: null,
          };
          setState((s) => ({ ...s, messages: [...s.messages, toolMessage] }));

          const result = await connection.current.execute(currentToolResults.discovery.data.uri);
          currentToolResults.connection = result;
          setState((s) => {
            const newMessages = s.messages.map((m) => {
              if (m.id !== msgId || m.type !== 'tool_call' || m.toolId !== 'connection') {
                return m;
              }

              // Determine new status clearly
              let newStatus: 'success' | 'needs_auth' | 'error';
              if (result.success) {
                newStatus = 'success';
              } else if (result.needsAuth) {
                newStatus = 'needs_auth';
              } else {
                newStatus = 'error';
              }
              return { ...m, status: newStatus, result };
            });
            return { ...s, messages: newMessages };
          });

          if (result.needsAuth) {
            setState((s) => ({ ...s, status: 'waiting_auth' }));
            return;
          }

          if (!result.success) {
            setState((s) => ({ ...s, status: 'failed' }));
          }
        }
      }
    }

    if (currentToolResults.connection?.success) {
      const summaryMessage: ChatLogMessage = {
        type: 'summary',
        id: uniqueId(),
        handshakeResult: currentToolResults.connection,
      };
      setState((s) => ({
        ...s,
        status: 'complete',
        messages: [...s.messages, summaryMessage],
      }));
    } else if (state.status !== 'failed' && manifest.id !== 'default-failure') {
      setState((s) => ({ ...s, status: 'failed' }));
    }
  }, []);

  const lastDiscoveryResultRef = useRef<DiscoveryResult | null>(null);

  const dispatch = useCallback(
    (command: EngineCommand) => {
      if (state.status === 'running') return;

      if (command.type === 'SUBMIT_DOMAIN') {
        const trimmed = command.payload.trim();

        const userMessage: ChatLogMessage = {
          type: 'user',
          id: uniqueId(),
          content: trimmed,
        };

        const newMessages: ChatLogMessage[] = [userMessage];

        if (!isValidDomain(trimmed)) {
          const assistantMessage: ChatLogMessage = {
            type: 'assistant',
            id: uniqueId(),
            content:
              'This workbench is designed for agent discovery via domain names. Please enter a valid domain, or try one of the examples to get started.',
          };
          newMessages.push(assistantMessage);

          setState({
            messages: newMessages,
            status: 'failed',
          });
          return;
        }

        setState({
          ...INITIAL_STATE,
          messages: newMessages,
        });

        void run(trimmed);
      } else if (command.type === 'PROVIDE_AUTH') {
        if (!lastDiscoveryResultRef.current?.success || !lastDiscoveryResultRef.current.data?.uri) {
          return;
        }

        const uri = lastDiscoveryResultRef.current.data.uri;

        const msgId = uniqueId();
        const toolMessage: ChatLogMessage = {
          type: 'tool_call',
          id: msgId,
          toolId: 'connection',
          status: 'running',
          discoveryResult: lastDiscoveryResultRef.current,
          result: null,
        };
        setState((s) => ({
          ...s,
          status: 'running',
          messages: [...s.messages, toolMessage],
        }));

        void (async () => {
          const result = await connection.current.execute(uri, {
            auth: { bearer: command.payload },
          });
          setState((s) => {
            const newMessages = s.messages.map((m) => {
              if (m.id !== msgId || m.type !== 'tool_call' || m.toolId !== 'connection') {
                return m;
              }

              // Determine new status clearly
              let newStatus: 'success' | 'needs_auth' | 'error';
              if (result.success) {
                newStatus = 'success';
              } else if (result.needsAuth) {
                newStatus = 'needs_auth';
              } else {
                newStatus = 'error';
              }
              return { ...m, status: newStatus, result };
            });
            return { ...s, messages: newMessages };
          });

          if (result.success) {
            const summaryMessage: ChatLogMessage = {
              type: 'summary',
              id: uniqueId(),
              handshakeResult: result,
            };
            setState((s) => ({
              ...s,
              status: 'complete',
              messages: [...s.messages, summaryMessage],
            }));
          } else if (result.needsAuth) {
            setState((s) => ({ ...s, status: 'waiting_auth' }));
          } else {
            setState((s) => ({ ...s, status: 'failed' }));
          }
        })();
      }
    },
    [state.status, run],
  );

  return { state, dispatch };
}
