export type ToolStatus = 'running' | 'success' | 'error' | 'needs_auth';

export interface ErrorWithMetadata {
  message?: string;
  metadata?: {
    lookupTime?: number;
  };
}

export interface AuthError {
  message?: string;
  compliantAuth?: boolean;
  metadata?: Record<string, unknown>;
}

export function getStepStatusClassName(step: { hasError?: boolean; completed?: boolean }) {
  if (step.hasError) return 'bg-red-500';
  if (step.completed) return 'bg-green-500';
  return 'bg-gray-300';
}

export function StepTimeline({
  steps,
}: {
  steps: Array<{ text: string; completed?: boolean; hasError?: boolean }>;
}) {
  return (
    <div className="mt-3 space-y-2.5 pl-2 border-l-2 border-gray-200 ml-3">
      {steps.map((step, index) => (
        <div key={index} className="pl-5 -ml-1.5 relative">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px ${getStepStatusClassName(step)}`}
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

export type { ChatLogMessage } from '@/hooks/use-chat-engine';
