// packages/web/src/components/workbench/discovery-chat.tsx
'use client';

import { useState, useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Loader2, Send } from 'lucide-react';
import { useChatEngine, type ChatLogMessage } from '@/hooks/use-chat-engine';
import { ToolListSummary } from '@/components/workbench/tool-list-summary';
import { Typewriter } from '@/components/ui/typewriter';
import { TitleSection } from '@/components/workbench/title-section';
import { ExamplePicker } from './example-picker';
import { DiscoverySuccessBlock } from './discovery-success-block';
import { DiscoveryToolBlock } from '@/components/workbench/tool-blocks';
import { ConnectionToolBlock } from '@/components/workbench/tool-blocks';
import type { HandshakeResult } from '@/hooks/use-connection';
import type { DiscoveryResult } from '@/hooks/use-discovery';

function Message({
  message,
  onProvideAuth,
  onPrefillGenerator,
}: {
  message: ChatLogMessage;
  onProvideAuth?: (token: string) => void;
  onPrefillGenerator?: () => void;
}) {
  const isUser = message.type === 'user';

  const renderContent = () => {
    switch (message.type) {
      case 'user':
        return <div className="text-sm">{message.content}</div>;
      case 'assistant': {
        if (message.content.includes('generator tool')) {
          const parts = message.content.split('generator tool');
          return (
            <p className="text-foreground">
              {parts[0]}
              <a
                href="#generator"
                onClick={onPrefillGenerator}
                className="underline hover:text-muted-foreground"
              >
                generator tool
              </a>
              {parts[1] ?? ''}
            </p>
          );
        }
        return (
          <Typewriter key={message.id} text={message.content} onComplete={message.onComplete} />
        );
      }
      case 'discovery_result':
        return message.result.ok ? (
          <DiscoverySuccessBlock result={message.result} />
        ) : (
          <DiscoveryToolBlock status="error" result={message.result} domain={message.domain} />
        );
      case 'connection_result':
        return (
          <ConnectionToolBlock
            status={message.status}
            result={message.result}
            discoveryResult={{ ok: true, value: message.discovery } as DiscoveryResult}
            onProvideAuth={onProvideAuth}
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

  const isTextMessage = message.type === 'assistant' || message.type === 'error_message';

  // User messages: right-aligned bubble
  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="max-w-[70%] bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 shadow-soft">
          {renderContent()}
        </div>
      </div>
    );
  }

  // Assistant text messages: left-aligned with avatar
  if (isTextMessage) {
    return (
      <div className="flex gap-3 mb-5">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 text-foreground">{renderContent()}</div>
      </div>
    );
  }

  // Rich content (tool results, discovery cards) — full width
  return <div className="mb-5">{renderContent()}</div>;
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
      <div className="flex items-center gap-2 p-2 bg-card rounded-full border border-border shadow-soft">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter a domain name..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          autoFocus={autoFocus}
          className="flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!value.trim() || isLoading}
          className="w-8 h-8 p-0 rounded-full"
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

  const handlePrefillGenerator = () => {
    try {
      if (state.domain) {
        sessionStorage.setItem('aid-generator-prefill', state.domain);
      }
    } catch {
      /* no-op */
    }
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
    <div className="h-full bg-background flex flex-col">
      <div data-scroll-region className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 && (
          <>
            <TitleSection mode="resolver" />
            <div className="text-center text-muted-foreground pt-8">
              <p>Enter a domain or select an example below to start.</p>
            </div>
          </>
        )}

        <div className="max-w-3xl mx-auto w-full">
          {state.messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              onProvideAuth={
                msg.type === 'connection_result'
                  ? (token: string) => dispatch({ type: 'PROVIDE_AUTH', payload: token })
                  : undefined
              }
              onPrefillGenerator={handlePrefillGenerator}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border/40 bg-background pt-3 pb-4 max-h-[60%] overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          <ExamplePicker
            variant="buttons"
            onSelect={(ex) => handleSubmit(ex.domain || ex.content)}
            disabled={isLoading}
          />
          <ChatInput onSubmit={handleSubmit} isLoading={isLoading} autoFocus />
        </div>
      </div>
    </div>
  );
}
