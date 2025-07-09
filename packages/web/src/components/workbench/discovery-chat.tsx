'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { useChatEngine, type ChatLogMessage } from '@/hooks/use-chat-engine';
import { DiscoveryToolBlock, ConnectionToolBlock } from '@/components/workbench/tool-blocks';
import { ToolListSummary } from '@/components/workbench/tool-list-summary';
import { Typewriter } from '@/components/ui/typewriter';
import { TitleSection } from '@/components/workbench/title-section';
import { ExamplePicker } from './example-picker';
import { DiscoverySuccessBlock } from './discovery-success-block';

/**
 * Defines the contract for commands sent to the chat engine.
 * Using a discriminated union provides strong type safety for actions.
 */
type ChatEngineCommand =
  | { type: 'SUBMIT_DOMAIN'; payload: string }
  | { type: 'PROVIDE_AUTH'; payload: string };

function Message({
  message,
  dispatch,
}: {
  message: ChatLogMessage;
  dispatch: (command: ChatEngineCommand) => void;
}) {
  const isUser = message.type === 'user';

  const renderContent = () => {
    switch (message.type) {
      case 'user':
        return <div className="text-sm">{message.content}</div>;
      case 'assistant':
        return (
          <Typewriter key={message.id} text={message.content} onComplete={message.onComplete} />
        );
      case 'tool_call':
        if (message.toolId === 'discovery') {
          // Use the new success block for successful discoveries
          if (message.status === 'success' && message.result?.success) {
            return <DiscoverySuccessBlock result={message.result} />;
          }
          return (
            <DiscoveryToolBlock
              status={message.status}
              result={message.result}
              domain={message.domain}
            />
          );
        }
        if (message.toolId === 'connection' && message.discoveryResult) {
          return (
            <ConnectionToolBlock
              status={message.status}
              result={message.result}
              discoveryResult={message.discoveryResult}
              onProvideAuth={(token) => dispatch({ type: 'PROVIDE_AUTH', payload: token })}
            />
          );
        }
        return null;
      case 'summary':
        return <ToolListSummary handshakeResult={message.handshakeResult} />;
      case 'error_message':
        return <Typewriter key={message.id} text={message.content} speed={10} />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div
        className={`${
          isUser
            ? 'max-w-[60%] bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-sm'
            : 'w-full text-gray-800'
        }`}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full pb-4">
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
  const isLoading = state.status === 'running' || state.status === 'waiting_auth';

  const handleSubmit = (domain: string) => {
    dispatch({ type: 'SUBMIT_DOMAIN', payload: domain });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <TitleSection mode="resolver" />

        {state.messages.length === 0 && (
          <div className="text-center text-gray-500 pt-8">
            <p>Enter a domain or select an example below to start.</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto w-full">
          {state.messages.map((message) => (
            <Message key={message.id} message={message} dispatch={dispatch} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-4">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <ExamplePicker variant="buttons" onSelect={handleSubmit} disabled={isLoading} />
          <ChatInput onSubmit={handleSubmit} isLoading={isLoading} autoFocus />
        </div>
      </div>
    </div>
  );
}
