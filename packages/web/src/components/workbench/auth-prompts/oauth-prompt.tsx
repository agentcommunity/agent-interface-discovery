import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';

interface OAuthPromptProps {
  metadata?: unknown;
  metadataUri?: string;
  type?: 'device' | 'code';
}

/**
 * Prompt for OAuth2 authentication (device flow or authorization code)
 */
export function OAuthPrompt({ metadata, metadataUri, type }: OAuthPromptProps) {
  const oauthType = type || (metadata ? 'device' : 'code');
  const isDeviceFlow = oauthType === 'device';

  return (
    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-start gap-2">
        <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-purple-800 mb-1">
            {isDeviceFlow ? 'OAuth2 Device Flow Required' : 'OAuth2 Authorization Required'}
          </p>
          <p className="text-xs text-purple-700 mb-2">
            {isDeviceFlow
              ? 'This server uses OAuth2 device flow. Follow the device flow to obtain an access token.'
              : 'This server requires OAuth2 authorization. You will be redirected to authorize the application.'}
          </p>
          {metadataUri && (
            <a
              href={metadataUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View auth metadata
            </a>
          )}
          {metadata !== undefined && metadata !== null && (
            <details className="mt-2">
              <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800">
                View auth metadata
              </summary>
              <pre className="text-xs bg-white border border-purple-200 p-2 rounded mt-1 overflow-auto max-h-48">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
