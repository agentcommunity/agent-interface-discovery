// packages/web/src/components/workbench/discovery-chat.tsx
'use client';

import { useState, useLayoutEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Loader2, Send } from 'lucide-react';
import { useChatEngine, type ChatLogMessage } from '@/hooks/use-chat-engine';
import { Typewriter } from '@/components/ui/typewriter';
import { TitleSection } from '@/components/workbench/title-section';
import { CollapsibleResult } from './collapsible-result';
import { ExamplePicker } from './example-picker';
import { DiscoveryToolBlock } from '@/components/workbench/blocks/discovery-block';
import { ConnectionToolBlock } from '@/components/workbench/blocks/connection-block';

const signalCardStatus = (status: 'running' | 'success' | 'error' | 'needs_auth' | 'info') => {
  switch (status) {
    case 'success':
      return 'success';
    case 'running':
      return 'loading';
    case 'needs_auth':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'error';
  }
};

const signalToolStatus = (status: 'running' | 'success' | 'error' | 'needs_auth' | 'info') => {
  switch (status) {
    case 'running':
      return 'running';
    case 'needs_auth':
      return 'needs_auth';
    case 'success':
      return 'success';
    default:
      return 'error';
  }
};

const detailToneClassName = (tone: 'default' | 'success' | 'warning' | 'error' | undefined) => {
  switch (tone) {
    case 'error':
      return 'text-red-700';
    case 'warning':
      return 'text-amber-700';
    case 'success':
      return 'text-emerald-700';
    default:
      return 'text-foreground';
  }
};

function Message({
  message,
  onProvideAuth,
  onPrefillGenerator,
  chainPrev = false,
  chainNext = false,
}: {
  message: ChatLogMessage;
  onProvideAuth?: (token: string) => void;
  onPrefillGenerator?: () => void;
  chainPrev?: boolean;
  chainNext?: boolean;
}) {
  const isUser = message.type === 'user';

  const renderContent = () => {
    switch (message.type) {
      case 'user':
        return <div className="text-sm">{message.content}</div>;
      case 'status_signal': {
        const cardStatus = signalCardStatus(message.status);
        const toolStatus = signalToolStatus(message.status);

        return (
          <CollapsibleResult status={cardStatus} title={message.title}>
            <div className="space-y-3">
              {message.summary && <p className="text-sm text-foreground">{message.summary}</p>}
              {message.errorCode && (
                <p className="text-xs font-mono text-muted-foreground">Code: {message.errorCode}</p>
              )}

              {message.details && message.details.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  {message.details.map((detail, index) => (
                    <div key={`${detail.label}-${index}`} className="flex gap-2">
                      <span className="font-medium text-muted-foreground shrink-0">
                        {detail.label}:
                      </span>
                      <span className={detailToneClassName(detail.tone)}>{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {message.hints && message.hints.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Next checks</p>
                  <ul className="space-y-1">
                    {message.hints.map((hint, index) => (
                      <li key={`${hint}-${index}`} className="text-xs text-muted-foreground">
                        • {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.discoveryResult && message.domain && (
                <DiscoveryToolBlock
                  status={toolStatus}
                  result={message.discoveryResult}
                  domain={message.domain}
                />
              )}

              {message.connectionResult && (
                <ConnectionToolBlock
                  status={toolStatus}
                  result={message.connectionResult.result}
                  discoveryResult={{ ok: true, value: message.connectionResult.discovery }}
                  onProvideAuth={onProvideAuth}
                />
              )}
            </div>
          </CollapsibleResult>
        );
      }
      case 'assistant': {
        if (message.content.includes('generator tool')) {
          const parts = message.content.split('generator tool');
          return (
            <p className="text-sm text-foreground">
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
      case 'error_message':
        return <Typewriter key={message.id} text={message.content} speed={10} />;
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

  if (message.type === 'status_signal') {
    return (
      <div className="relative mb-3 pl-7">
        {chainPrev && <span className="absolute left-3 top-0 h-1/2 w-px bg-border/70" />}
        {chainNext && <span className="absolute left-3 top-1/2 h-1/2 w-px bg-border/70" />}
        <span className="absolute left-[10px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-border" />
        {renderContent()}
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
          placeholder="Enter a domain or URL..."
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
          {state.messages.map((msg, index) => {
            const previous = state.messages[index - 1];
            const next = state.messages[index + 1];
            const isSignal = msg.type === 'status_signal';
            const chainPrev = isSignal && previous?.type === 'status_signal';
            const chainNext = isSignal && next?.type === 'status_signal';

            return (
              <Message
                key={msg.id}
                message={msg}
                chainPrev={chainPrev}
                chainNext={chainNext}
                onProvideAuth={
                  msg.type === 'status_signal' && msg.status === 'needs_auth'
                    ? (token: string) => dispatch({ type: 'PROVIDE_AUTH', payload: token })
                    : undefined
                }
                onPrefillGenerator={handlePrefillGenerator}
              />
            );
          })}
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
