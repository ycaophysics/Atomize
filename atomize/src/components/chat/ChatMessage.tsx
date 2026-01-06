'use client';

import type { ConversationEntry } from '@/lib/managers';
import type { QuickAction } from '@/lib/managers/conversation-manager';

interface ChatMessageProps {
  entry: ConversationEntry;
  quickActions?: QuickAction[];
  onQuickAction?: (action: QuickAction) => void;
}

export function ChatMessage({ entry, quickActions, onQuickAction }: ChatMessageProps) {
  const isUser = entry.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm">{entry.content}</div>

        {!isUser && quickActions && quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => onQuickAction?.(action)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
