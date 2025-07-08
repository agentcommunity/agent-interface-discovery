'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Copy, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

function CodeSnippet({ title, code }: { title: string; code: string }) {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void copyToClipboard()}
          className="h-6 px-2 text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </Button>
      </div>
      <pre className="text-xs font-mono text-gray-700 bg-gray-100 p-2 rounded border overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}

type ToolStatus = 'pending' | 'running' | 'success' | 'error' | 'needs_auth';

// Helper functions to replace nested ternaries
function getStatusIcon(status: ToolStatus) {
  switch (status) {
    case 'running':
      return Loader2;
    case 'success':
      return CheckCircle;
    default:
      // The default case correctly handles 'error', 'needs_auth', and 'pending'.
      return XCircle;
  }
}

function getStatusColor(status: ToolStatus) {
  switch (status) {
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'needs_auth':
      return 'text-yellow-600';
    default:
      // The default case correctly handles 'running' and 'pending'.
      return 'text-gray-400';
  }
}

export function ToolCallBlock({
  title,
  Icon,
  status,
  statusText,
  codeSnippets,
  children,
  defaultExpanded = false,
}: {
  title: string;
  Icon: React.ElementType;
  status: ToolStatus;
  statusText: string;
  codeSnippets?: { title: string; code: string }[];
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const StatusIcon = getStatusIcon(status);
  const color = getStatusColor(status);

  return (
    <div className="my-2 text-sm">
      <div
        className={`
            p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'w-full' : 'max-w-md'}
        `}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left gap-2"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-800">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{statusText}</span>
            <StatusIcon className={`w-4 h-4 ${color} ${status === 'running' && 'animate-spin'}`} />
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </button>

        <div
          className={`
                transition-all duration-300 ease-in-out overflow-hidden
                ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}
            `}
        >
          <div className="pt-2">
            {children}
            {codeSnippets &&
              codeSnippets.map((snippet, index) => (
                <CodeSnippet key={index} title={snippet.title} code={snippet.code} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
