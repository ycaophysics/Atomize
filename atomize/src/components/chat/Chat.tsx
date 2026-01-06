'use client';

import { useRef, useEffect } from 'react';
import type { ConversationEntry } from '@/lib/managers';
import type { QuickAction, ConversationResponse } from '@/lib/managers/conversation-manager';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatProps {
  messages: ConversationEntry[];
  lastResponse?: ConversationResponse;
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
  onQuickAction: (action: QuickAction) => void;
}

export function Chat({
  messages,
  lastResponse,
  isLoading,
  onSendMessage,
  onQuickAction,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-xl font-semibold mb-2">Welcome to Atomize!</h2>
            <p className="text-center max-w-md">
              Tell me what you need to do, and I&apos;ll help you break it down into
              manageable tasks.
            </p>
          </div>
        ) : (
          <>
            {messages.map((entry, index) => {
              const isLastAssistant =
                entry.role === 'assistant' && index === messages.length - 1;
              return (
                <ChatMessage
                  key={entry.id}
                  entry={entry}
                  quickActions={isLastAssistant ? lastResponse?.suggestedActions : undefined}
                  onQuickAction={onQuickAction}
                />
              );
            })}
          </>
        )}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
