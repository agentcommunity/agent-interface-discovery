import React from 'react';
import { type HandshakeResult } from '@/hooks/use-connection';
import { Check, FunctionSquare, Plug } from 'lucide-react';
import { isOk } from '@/lib/types/result';

export function ToolListSummary({ handshakeResult }: { handshakeResult: HandshakeResult }) {
  if (!isOk(handshakeResult)) {
    return <p className="text-sm text-muted-foreground italic mt-2">Connection not established.</p>;
  }
  const { capabilities } = handshakeResult.value;

  if (capabilities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic mt-2">
        Connection established, but no tools were offered.
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-1">
      {capabilities.map((capability) => {
        const Icon = capability.type === 'tool' ? FunctionSquare : Plug;
        return (
          <li key={capability.id} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-green-500" />
            <Icon className="w-4 h-4" />
            <span className="font-mono text-xs">{capability.id}</span>
          </li>
        );
      })}
    </ul>
  );
}
