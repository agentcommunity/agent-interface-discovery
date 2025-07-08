import React from 'react';
import { type HandshakeResult } from '@/hooks/use-connection';
import { getEnhancedCapability } from '@/lib/tool-manifests';

interface ToolListSummaryProps {
  handshakeResult?: HandshakeResult | null;
}

export function ToolListSummary({ handshakeResult }: ToolListSummaryProps) {
  if (!handshakeResult?.success || !handshakeResult.data?.capabilities) {
    return null;
  }

  const capabilities = handshakeResult.data.capabilities;

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm animate-fade-in">
      <div className="mb-3">
        <h4 className="font-medium text-gray-800 text-sm">Available Tools</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          {capabilities.length} {capabilities.length === 1 ? 'capability' : 'capabilities'} ready to
          use
        </p>
      </div>

      <div className="space-y-3">
        {capabilities.map((capability) => {
          const enhanced = getEnhancedCapability(capability);
          return (
            <div key={capability.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-md">
              <div className="flex-shrink-0 mt-0.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    capability.type === 'tool' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-mono bg-white border border-gray-200 text-gray-800 rounded px-1.5 py-0.5">
                    {capability.id}
                  </code>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {capability.type}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{enhanced.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {capabilities.length > 3 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            This agent provides a rich set of {capabilities.length} capabilities for your use.
          </p>
        </div>
      )}
    </div>
  );
}
