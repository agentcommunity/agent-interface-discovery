import React from 'react';
import { Search, Plug } from 'lucide-react';
import { ToolCallBlock } from './tool-call-block';
import { type DiscoveryResult } from '@/hooks/use-discovery';
import { type HandshakeResult } from '@/hooks/use-connection';

type ToolStatus = 'running' | 'success' | 'error' | 'needs_auth';

interface DiscoveryToolBlockProps {
  status: ToolStatus;
  result: DiscoveryResult | null;
  domain: string;
}

interface ConnectionToolBlockProps {
  status: ToolStatus;
  result: HandshakeResult | null;
  discoveryResult?: DiscoveryResult | null;
  onProvideAuth?: (token: string) => void;
}

export function DiscoveryToolBlock({ status, result, domain }: DiscoveryToolBlockProps) {
  const getCodeSnippets = () => {
    const snippets = [
      {
        title: 'DNS Lookup Command',
        code: `dig TXT _agent.${domain}`,
      },
    ];

    // Add result snippets based on status and result
    if (status === 'success' || status === 'error') {
      if (result?.metadata?.txtRecord) {
        snippets.push({
          title: 'Found TXT Record',
          code: result.metadata.txtRecord,
        });
      }

      if (result?.data) {
        const data = result.data;
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
      } else if (result?.error) {
        snippets.push({
          title: 'Error Details',
          code: `Error: ${result.error}\nLookup time: ${result.metadata?.lookupTime}ms`,
        });
      }
    }

    return snippets;
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Querying DNS...';
      case 'success':
        return result?.data?.desc ? `Found: ${result.data.desc}` : 'Agent discovered';
      case 'error':
        return result?.error || 'Discovery failed';
      default:
        return status;
    }
  };

  return (
    <ToolCallBlock
      title="Agent Discovery"
      Icon={Search}
      status={status}
      statusText={getStatusText()}
      codeSnippets={getCodeSnippets()}
    >
      {result && <DiscoveryDetailsView result={result} />}
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
    const uri = discoveryResult?.data?.uri || 'unknown-uri';
    const snippets = [
      {
        title: 'Connection Request',
        code: `// MCP Handshake Request
fetch('/api/handshake', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    uri: "${uri}"
  })
})`,
      },
    ];

    // Add response snippets based on status and result
    if (status === 'success' || status === 'error' || status === 'needs_auth') {
      if (result?.data) {
        const data = result.data;
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
      } else if (result?.error) {
        snippets.push({
          title: status === 'needs_auth' ? 'Authentication Required' : 'Connection Error',
          code: `Error: ${result.error}`,
        });
      }
    }

    return snippets;
  };

  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Establishing connection...';
      case 'success': {
        const capCount = result?.data?.capabilities.length || 0;
        return `Connected (${capCount} capabilities)`;
      }
      case 'error':
        return result?.error || 'Connection failed';
      case 'needs_auth':
        return 'Authentication required';
      default:
        return status;
    }
  };

  const defaultExpand = status === 'needs_auth' || status === 'error';

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
        (result?.compliantAuth && result?.metadata ? (
          <MetadataAuthView metadata={result.metadata} />
        ) : (
          <>
            <LegacyNotice authHint={discoveryResult?.data?.auth} />
            {onProvideAuth && (
              <AuthPrompt onSubmit={onProvideAuth} authHint={discoveryResult?.data?.auth} />
            )}
          </>
        ))}
    </ToolCallBlock>
  );
}

// Helper to determine the status color for the timeline view
function getStepStatusClassName(step: { hasError?: boolean; completed?: boolean }) {
  if (step.hasError) {
    return 'bg-red-500';
  }
  if (step.completed) {
    return 'bg-green-500';
  }
  return 'bg-gray-300';
}

// Detail views for showing step-by-step progress
function DiscoveryDetailsView({ result }: { result: DiscoveryResult }) {
  const steps = [
    {
      text: `Querying DNS for _agent.${result.metadata?.dnsQuery}...`,
      completed: true,
    },
    {
      text: result.success ? 'Found TXT Record' : 'No TXT Record found',
      completed: true,
      hasError: !result.success,
    },
    {
      text: result.success ? 'Parsing agent record...' : 'Discovery failed',
      completed: result.success,
      hasError: !result.success,
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
  const steps = [
    {
      text: 'Initializing handshake...',
      completed: true,
    },
    {
      text: result.success ? 'Handshake complete' : 'Handshake failed',
      completed: true,
      hasError: !result.success,
    },
    {
      text: result.success
        ? `Agent offers ${result.data?.capabilities.length || 0} capabilities`
        : 'No capabilities available',
      completed: result.success,
      hasError: !result.success,
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

// The `object` type is a safer alternative to `any` and correctly represents
// any non-primitive value, which is exactly what JSON.stringify accepts.
function MetadataAuthView({ metadata }: { metadata: object }) {
  const json = JSON.stringify(metadata, null, 2);
  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-1">Auth Metadata</div>
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-64">{json}</pre>
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
