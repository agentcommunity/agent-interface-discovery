import React from 'react';
import { Search, Plug } from 'lucide-react';
import { AID_GENERATOR_URL } from '@/lib/constants';
import { ToolCallBlock } from './tool-call-block';
import type { DiscoveryResult } from '@/hooks/use-discovery';
import type { HandshakeResult } from '@/hooks/use-connection';
import { DiscoverySuccessBlock } from './discovery-success-block';
import { ToolListSummary } from './tool-list-summary';
import type { ChatLogMessage } from '@/hooks/use-chat-engine';

// --- Removed legacy type definitions ---

type ToolStatus = 'running' | 'success' | 'error' | 'needs_auth';

interface DiscoveryToolBlockProps {
  status: ToolStatus;
  result?: DiscoveryResult | null;
  domain: string;
}

interface ConnectionToolBlockProps {
  status: ToolStatus;
  result?: HandshakeResult | null;
  discoveryResult?: DiscoveryResult | null;
  onProvideAuth?: (token: string) => void;
}

// Type for error with metadata
interface ErrorWithMetadata {
  message?: string;
  metadata?: {
    lookupTime?: number;
  };
}

// Type for auth error
interface AuthError {
  message?: string;
  compliantAuth?: boolean;
  metadata?: Record<string, unknown>;
}

export function DiscoveryToolBlock({ status, result, domain }: DiscoveryToolBlockProps) {
  const getCodeSnippets = () => {
    const snippets = [
      {
        title: 'DNS Lookup Command',
        code: `dig TXT _agent.${domain}`,
      },
    ];

    if (status === 'success' || status === 'error') {
      if (result?.ok && result.value?.metadata?.txtRecord) {
        // Break long TXT records at semicolons for mobile readability
        const formattedTxtRecord = result.value.metadata.txtRecord.replaceAll(';', ';\n');
        snippets.push({
          title: 'Found TXT Record',
          code: formattedTxtRecord,
        });
      }

      if (result?.ok && result.value?.record) {
        const data = result.value.record;
        const parsedRecord = [
          `Version: ${data.v}`,
          `URI: ${data.uri}`,
          `Protocol: ${data.protocol}`,
          `Host: ${data.host}:${data.port}`,
          data.desc ? `Description: ${data.desc}` : null,
          data.auth ? `Auth: ${data.auth}` : null,
        ]
          .filter(Boolean)
          .join('\n');

        snippets.push({
          title: 'Parsed Agent Record',
          code: parsedRecord,
        });
      } else if (result && !result.ok && result.error) {
        // error case - properly type the error
        const lookupTime = (result.error as ErrorWithMetadata)?.metadata?.lookupTime ?? 'N/A';
        const errorMessage = (result.error as ErrorWithMetadata)?.message || 'Unknown error';

        snippets.push({
          title: 'Error Details',
          code: `Error: ${errorMessage}\nLookup time: ${lookupTime}ms`,
        });
      }
    }

    return snippets;
  };

  const getStatusText = () => {
    if (!result) return status;
    if (status === 'running') return 'Querying DNS...';
    if (result.ok) {
      return result.value?.record?.desc ? `Found: ${result.value.record.desc}` : 'Agent discovered';
    } else {
      const errorMessage = (result.error as ErrorWithMetadata)?.message || 'No _agent record found';
      return errorMessage;
    }
  };

  return (
    <ToolCallBlock
      title="Agent Discovery"
      Icon={Search}
      status={status}
      statusText={getStatusText()}
      codeSnippets={getCodeSnippets()}
      defaultExpanded={status === 'error'}
    >
      {result && !result.ok && (
        <>
          <DiscoveryDetailsView result={result} />
          <p className="mt-3 text-xs text-gray-600">
            If you manage this domain, you can{' '}
            <a
              href={AID_GENERATOR_URL}
              target="_self"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              create an AID record
            </a>{' '}
            using our generator.
          </p>
        </>
      )}
    </ToolCallBlock>
  );
}

export function ConnectionToolBlock({
  status,
  result,
  discoveryResult,
  onProvideAuth,
}: ConnectionToolBlockProps) {
  const getCodeSnippets = () => {
    const uri = (discoveryResult?.ok && discoveryResult.value?.record?.uri) || 'unknown-uri';
    const snippets = [
      {
        title: 'Connection Request',
        code: `// MCP Handshake Request\nfetch('/api/handshake', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    uri: "${uri}"\n  })\n})`,
      },
    ];

    if (status === 'success' || status === 'error' || status === 'needs_auth') {
      if (result?.ok && result.value) {
        const data = result.value;
        const response = {
          protocolVersion: data.protocolVersion,
          serverInfo: data.serverInfo,
          capabilities: data.capabilities.map((cap) => ({
            id: cap.id,
            type: cap.type,
          })),
        };
        snippets.push({
          title: 'Handshake Response',
          code: JSON.stringify(response, null, 2),
        });
      } else if (result && !result.ok && result.error) {
        const errorMessage = (result.error as AuthError)?.message || 'Unknown error';
        snippets.push({
          title: status === 'needs_auth' ? 'Authentication Required' : 'Connection Error',
          code: `Error: ${errorMessage}`,
        });
      }
    }

    return snippets;
  };

  const getStatusText = () => {
    if (!result) return status;
    if (status === 'running') return 'Establishing connection...';
    if (result.ok) {
      const capCount = result.value?.capabilities?.length || 0;
      return `Connected (${capCount} capabilities)`;
    } else if (status === 'needs_auth') {
      return 'Authentication required';
    } else {
      const errorMessage = (result.error as AuthError)?.message;
      return errorMessage || 'Connection failed';
    }
  };

  const defaultExpand = status === 'needs_auth' || status === 'error';

  // Helper: get compliantAuth and metadata from error if present
  let compliantAuth: boolean | null = null;
  let metadata: Record<string, unknown> | null = null;
  if (result && !result.ok && 'compliantAuth' in result.error) {
    compliantAuth = (result.error as AuthError)?.compliantAuth ?? null;
    metadata = (result.error as AuthError)?.metadata ?? null;
  }

  return (
    <ToolCallBlock
      title="Agent Connection"
      Icon={Plug}
      status={status === 'needs_auth' ? 'needs_auth' : status}
      statusText={getStatusText()}
      codeSnippets={getCodeSnippets()}
      defaultExpanded={defaultExpand}
    >
      {result && <ConnectionDetailsView result={result} />}
      {status === 'needs_auth' &&
        (compliantAuth && metadata ? (
          <MetadataAuthView metadata={metadata} />
        ) : (compliantAuth === false ? (
          <LocalSchemeNotice
            uri={discoveryResult?.ok ? discoveryResult.value?.record?.uri : undefined}
          />
        ) : (
          <>
            <LegacyNotice
              authHint={discoveryResult?.ok ? discoveryResult.value?.record?.auth : undefined}
            />
            {onProvideAuth && (
              <AuthPrompt
                onSubmit={onProvideAuth}
                authHint={discoveryResult?.ok ? discoveryResult.value?.record?.auth : undefined}
              />
            )}
          </>
        )))}
    </ToolCallBlock>
  );
}

function getStepStatusClassName(step: { hasError?: boolean; completed?: boolean }) {
  if (step.hasError) {
    return 'bg-red-500';
  }
  if (step.completed) {
    return 'bg-green-500';
  }
  return 'bg-gray-300';
}

function DiscoveryDetailsView({ result }: { result: DiscoveryResult }) {
  if (!result) return null;
  const steps = [
    {
      text: `Querying DNS for _agent.${result.ok ? result.value?.metadata?.dnsQuery : ''}...`,
      completed: true,
    },
    {
      text: result.ok ? 'Found TXT Record' : 'No TXT Record found',
      completed: true,
      hasError: !result.ok,
    },
    {
      text: result.ok ? 'Parsing agent record...' : 'Discovery failed',
      completed: !!result.ok,
      hasError: !result.ok,
    },
  ];

  return (
    <div className="mt-3 space-y-2.5 pl-2 border-l-2 border-gray-200 ml-3">
      {steps.map((step, index) => (
        <div key={index} className="pl-5 -ml-1.5 relative">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px ${getStepStatusClassName(
              step,
            )}`}
          />
          <div
            className={`flex items-center gap-2 text-sm ${
              step.hasError ? 'text-red-700' : 'text-gray-800'
            }`}
          >
            {step.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConnectionDetailsView({ result }: { result: HandshakeResult }) {
  if (!result) return null;
  const steps = [
    {
      text: 'Initializing handshake...',
      completed: true,
    },
    {
      text: result.ok ? 'Handshake complete' : 'Handshake failed',
      completed: true,
      hasError: !result.ok,
    },
    {
      text: result.ok
        ? `Agent offers ${result.value?.capabilities.length || 0} capabilities`
        : 'No capabilities available',
      completed: !!result.ok,
      hasError: !result.ok,
    },
  ];

  return (
    <div className="mt-3 space-y-2.5 pl-2 border-l-2 border-gray-200 ml-3">
      {steps.map((step, index) => (
        <div key={index} className="pl-5 -ml-1.5 relative">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px ${getStepStatusClassName(
              step,
            )}`}
          />
          <div
            className={`flex items-center gap-2 text-sm ${
              step.hasError ? 'text-red-700' : 'text-gray-800'
            }`}
          >
            {step.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuthPrompt({
  onSubmit,
  authHint,
}: {
  onSubmit: (token: string) => void;
  authHint?: string;
}) {
  const [token, setToken] = React.useState('');

  const handle = () => {
    if (token.trim()) {
      onSubmit(token.trim());
      setToken('');
    }
  };

  const placeholder = authHint ? `${authHint.toUpperCase()} token` : 'Enter token...';

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        type="password"
        placeholder={placeholder}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="flex-1 border rounded px-2 py-1 text-sm"
      />
      <button onClick={handle} className="bg-gray-900 text-white text-sm px-3 py-1 rounded">
        Retry
      </button>
    </div>
  );
}

function MetadataAuthView({ metadata }: { metadata: Record<string, unknown> }) {
  const json = JSON.stringify(metadata, null, 2);
  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-1">Auth Metadata</div>
      <pre className="text-xs bg-gray-100 p-2 rounded min-w-0 whitespace-pre-wrap break-words overflow-hidden max-h-64">
        {json}
      </pre>
      <p className="text-xs text-gray-600 mt-1">
        The server is spec-compliant. Follow the indicated auth flow (e.g. OAuth device, PAT, etc.)
        and retry once you have a token.
      </p>
    </div>
  );
}

function LegacyNotice({ authHint }: { authHint?: string }) {
  return (
    <p className="text-xs text-yellow-700 mb-2">
      This server does not implement the latest MCP auth discovery. Provide your{' '}
      {authHint ?? 'access'} token manually.
    </p>
  );
}

function LocalSchemeNotice({ uri }: { uri?: string }) {
  return (
    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
      <p className="font-medium mb-1">Local CLI required</p>
      <p>
        This agent is configured to run via a local command
        {uri ? (
          <>
            : <code className="bg-white border px-1 py-0.5 rounded text-xs break-words">{uri}</code>
          </>
        ) : null}
        . Start the CLI on your machine and make it accessible via an HTTP/WebSocket URL, then
        re-enter its address or provide a Personal Access Token if the CLI exposes one.
      </p>
    </div>
  );
}

export const ToolBlocks: React.FC<{ messages: ChatLogMessage[] }> = ({ messages }) => {
  // Find the last discovery and connection results to render their summaries
  const lastDiscovery = messages.find((m) => m.type === 'discovery_result');
  const lastConnection = messages.find((m) => m.type === 'connection_result');

  // We only render the "summary" blocks, not the whole chat history.
  // The chat history is handled by DiscoveryChat.
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
