import React from 'react';
import { AuthPrompt } from './auth-prompt';
import { PatPrompt } from './pat-prompt';
import { OAuthPrompt } from './oauth-prompt';
import { LocalCliNotice } from './local-cli-notice';
import type { AuthRequiredError } from '@/hooks/use-connection';

interface AuthPromptsProps {
  error: AuthRequiredError;
  uri?: string;
  authHint?: string;
  onProvideAuth?: (token: string) => void;
}

/**
 * Centralized auth prompt component that routes to appropriate prompt based on authType
 */
export function AuthPrompts({ error, uri, authHint, onProvideAuth }: AuthPromptsProps) {
  const authType = error.authType || (error.compliantAuth ? 'compliant' : 'generic');

  // Handle compliant auth with metadata
  if (error.compliantAuth && error.metadata) {
    return <OAuthPrompt metadata={error.metadata} metadataUri={error.metadataUri} />;
  }

  // Route to appropriate prompt based on authType
  switch (authType) {
    case 'local_cli':
      return <LocalCliNotice uri={uri} />;
    case 'pat':
      return (
        <>
          <PatPrompt />
          {onProvideAuth && <AuthPrompt onSubmit={onProvideAuth} authHint={authHint} />}
        </>
      );
    case 'oauth2_device':
      return (
        <OAuthPrompt metadata={error.metadata} metadataUri={error.metadataUri} type="device" />
      );
    case 'oauth2_code':
      return <OAuthPrompt metadata={error.metadata} metadataUri={error.metadataUri} type="code" />;
    case 'compliant':
      return <OAuthPrompt metadata={error.metadata} metadataUri={error.metadataUri} />;
    default:
      return (
        <>
          <LegacyNotice authHint={authHint} />
          {onProvideAuth && <AuthPrompt onSubmit={onProvideAuth} authHint={authHint} />}
        </>
      );
  }
}

function LegacyNotice({ authHint }: { authHint?: string }) {
  return (
    <p className="text-xs text-yellow-700 mb-2">
      This server does not implement the latest MCP auth discovery. Provide your{' '}
      {authHint ?? 'access'} token manually.
    </p>
  );
}

export { AuthPrompt } from './auth-prompt';
export { PatPrompt } from './pat-prompt';
export { OAuthPrompt } from './oauth-prompt';
export { LocalCliNotice } from './local-cli-notice';
