/**
 * Public façade for the chat engine hook.
 * Internal modules live in ./chat-engine/.
 */
export { useChatEngine } from './chat-engine/hook';
export type {
  ChatLogMessage,
  DiscoveryResultMessage,
  ConnectionResultMessage,
  EngineState,
  EngineCommand,
} from './chat-engine/types';
