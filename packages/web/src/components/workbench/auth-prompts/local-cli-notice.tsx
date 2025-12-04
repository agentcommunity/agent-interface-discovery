import React from 'react';
import { Terminal } from 'lucide-react';

interface LocalCliNoticeProps {
  uri?: string;
}

/**
 * Notice for local CLI agents (npx:, docker:, pip:, etc.)
 */
export function LocalCliNotice({ uri }: LocalCliNoticeProps) {
  return (
    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
      <div className="flex items-start gap-2">
        <Terminal className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">Local CLI required</p>
          <p>
            This agent is configured to run via a local command
            {uri ? (
              <>
                :{' '}
                <code className="bg-white border px-1 py-0.5 rounded text-xs break-words">
                  {uri}
                </code>
              </>
            ) : null}
            . Start the CLI on your machine and make it accessible via an HTTP/WebSocket URL, then
            re-enter its address or provide a Personal Access Token if the CLI exposes one.
          </p>
        </div>
      </div>
    </div>
  );
}
