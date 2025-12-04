import React from 'react';
import { Key } from 'lucide-react';

/**
 * Prompt specifically for Personal Access Token (PAT) authentication
 */
export function PatPrompt() {
  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Key className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800 mb-1">Personal Access Token Required</p>
          <p className="text-xs text-blue-700">
            This MCP server requires a Personal Access Token for authentication. Please provide your
            PAT to continue.
          </p>
        </div>
      </div>
    </div>
  );
}
