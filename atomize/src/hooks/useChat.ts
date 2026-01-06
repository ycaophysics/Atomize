'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConversationEntry } from '@/lib/managers';
import type { ConversationResponse, QuickAction, UserInput } from '@/lib/managers/conversation-manager';
import { ConversationManager } from '@/lib/managers';
import { TaskStore, LocalStorageAdapter } from '@/lib/store';
import type { LLMProvider } from '@/lib/llm';

interface UseChatOptions {
  llmProvider: LLMProvider;
}

interface UseChatReturn {
  messages: ConversationEntry[];
  lastResponse: ConversationResponse | undefined;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  handleQuickAction: (action: QuickAction) => Promise<void>;
  clearChat: () => void;
}

export function useChat({ llmProvider }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ConversationEntry[]>([]);
  const [lastResponse, setLastResponse] = useState<ConversationResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string>();

  const managerRef = useRef<ConversationManager | null>(null);
  const storeRef = useRef<TaskStore | null>(null);

  // Initialize store and manager
  useEffect(() => {
    const initializeStore = async () => {
      const storage = new LocalStorageAdapter();
      const store = new TaskStore(storage);
      await store.initialize();
      storeRef.current = store;
      managerRef.current = new ConversationManager(store, llmProvider);
    };

    initializeStore();
  }, [llmProvider]);

  const sendMessage = useCallback(async (text: string) => {
    if (!managerRef.current) return;

    setIsLoading(true);

    try {
      const input: UserInput = {
        text,
        timestamp: new Date(),
        context: {
          currentTaskId,
          currentView: 'chat',
        },
      };

      const response = await managerRef.current.processInput(input);

      // Update messages from manager history
      setMessages(managerRef.current.getHistory());
      setLastResponse(response);

      // Track current task for context
      if (response.tasks && response.tasks.length > 0) {
        setCurrentTaskId(response.tasks[0].id);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          role: 'assistant',
          content: "Sorry, I had trouble processing that. Could you try again?",
          relatedTaskIds: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [currentTaskId]);

  const handleQuickAction = useCallback(async (action: QuickAction) => {
    if (!managerRef.current) return;

    // Set context for the action
    if (action.taskId) {
      setCurrentTaskId(action.taskId);
    }

    // Map action to command
    const commandMap: Record<string, string> = {
      done: 'done',
      defer: 'defer',
      break_down: 'break it down',
      what_next: "what's next",
    };

    const command = commandMap[action.action] || action.action;
    await sendMessage(command);
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearConversation();
      setMessages([]);
      setLastResponse(undefined);
      setCurrentTaskId(undefined);
    }
  }, []);

  return {
    messages,
    lastResponse,
    isLoading,
    sendMessage,
    handleQuickAction,
    clearChat,
  };
}
