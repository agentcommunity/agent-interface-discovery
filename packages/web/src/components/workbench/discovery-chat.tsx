// packages/web/src/components/workbench/discovery-chat.tsx
'use client';

import { useState, useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { useChatEngine, type ChatLogMessage } from '@/hooks/use-chat-engine';
import { ToolListSummary } from '@/components/workbench/tool-list-summary';
import { Typewriter } from '@/components/ui/typewriter';
import { TitleSection } from '@/components/workbench/title-section';
import { ExamplePicker } from './example-picker';
import { DiscoverySuccessBlock } from './discovery-success-block';
import { ConnectionToolBlock } from '@/components/workbench/tool-blocks';
import type { HandshakeResult } from '@/hooks/use-connection';
import type { DiscoveryResult } from '@/hooks/use-discovery';

function Message({ message }: { message: ChatLogMessage }) {
  const isUser = message.type === 'user';

  const renderContent = () => {
    switch (message.type) {
      case 'user':
        return <div className="text-sm">{message.content}</div>;
      case 'assistant':
        return (
          <Typewriter key={message.id} text={message.content} onComplete={message.onComplete} />
        );
      case 'discovery_result':
        return <DiscoverySuccessBlock result={message.result} />;
      case 'connection_result':
        return (
          <ConnectionToolBlock
            status={message.status}
            result={message.result}
            discoveryResult={{ ok: true, value: message.discovery } as DiscoveryResult}
            onProvideAuth={() => {}}
          />
        );
      case 'summary':
        // Cast via unknown first to satisfy @typescript-eslint/no-unsafe-assignment
        // without using an `any` escape hatch.
        return (
          <ToolListSummary
            handshakeResult={message.handshakeResult as unknown as HandshakeResult}
          />
        );
      case 'error_message':
        return <Typewriter key={message.id} text={message.content} speed={10} />;
      case 'tool_event':
        return null; // hide instrumentation messages
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div
        className={
          isUser
            ? 'max-w-[60%] bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-sm'
            : 'w-full text-gray-800'
        }
      >
        {renderContent()}
      </div>
    </div>
  );
}

function ChatInput({
  onSubmit,
  isLoading,
  autoFocus,
}: {
  onSubmit: (value: string) => void;
  isLoading: boolean;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="flex items-center gap-2 p-2 bg-white rounded-full border border-gray-200 shadow-sm">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter a domain name..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          autoFocus={autoFocus}
          className="flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!value.trim() || isLoading}
          className="w-8 h-8 p-0 rounded-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </form>
  );
}

export function DiscoveryChat() {
  const { state, dispatch } = useChatEngine();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = state.status === 'discovering' || state.status === 'connecting';

  const handleSubmit = (domain: string) => {
    dispatch({ type: 'SUBMIT_DOMAIN', payload: domain });
  };

  // Use layout effect to handle scroll after DOM updates and content expansion
  useLayoutEffect(() => {
    const scrollToEnd = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    };

    // Allow time for content expansion animations and layout changes
    const timer = setTimeout(scrollToEnd, 150);
    return () => clearTimeout(timer);
  }, [state.messages]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 && (
          <>
            <TitleSection mode="resolver" />
            <div className="text-center text-gray-500 pt-8">
              <p>Enter a domain or select an example below to start.</p>
            </div>
          </>
        )}

        <div className="max-w-3xl mx-auto w-full">
          {state.messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-4 pb-4">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <ExamplePicker variant="buttons" onSelect={handleSubmit} disabled={isLoading} />
          <ChatInput onSubmit={handleSubmit} isLoading={isLoading} autoFocus />
        </div>
      </div>
    </div>
  );
}
