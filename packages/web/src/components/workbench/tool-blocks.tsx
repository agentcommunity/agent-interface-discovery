/**
 * Re-exports from blocks/ for backward compatibility.
 * New code should import directly from './blocks'.
 */
import React from 'react';
import type { ChatLogMessage } from '@/hooks/use-chat-engine';
import { DiscoverySuccessBlock } from './discovery-success-block';
import { ToolListSummary } from './tool-list-summary';

export { DiscoveryToolBlock } from './blocks/discovery-block';
export { ConnectionToolBlock } from './blocks/connection-block';

export const ToolBlocks: React.FC<{ messages: ChatLogMessage[] }> = ({ messages }) => {
  const lastDiscovery = messages.find((m) => m.type === 'discovery_result');
  const lastConnection = messages.find((m) => m.type === 'connection_result');

  return (
    <>
      {lastDiscovery && 'result' in lastDiscovery && (
        <DiscoverySuccessBlock result={lastDiscovery.result} />
      )}
      {lastConnection && 'result' in lastConnection && (
        <ToolListSummary handshakeResult={lastConnection.result} />
      )}
    </>
  );
};
