'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chat } from '@/components/chat';
import { PlanView } from '@/components/plan';
import { TaskDetail } from '@/components/task';
import { ConversationManager, TaskManager, PlanManager, ProgressManager } from '@/lib/managers';
import type { ConversationEntry } from '@/lib/managers';
import type { ConversationResponse, QuickAction, UserInput } from '@/lib/managers/conversation-manager';
import type { Plan } from '@/lib/managers/plan-manager';
import { TaskStore, LocalStorageAdapter } from '@/lib/store';
import { PriorityEngine } from '@/lib/engines';
import { GeminiProvider } from '@/lib/llm';
import type { LLMProvider } from '@/lib/llm';
import type { Task, TaskUpdate } from '@/lib/types';

// Create LLM provider based on environment
function createLLMProvider(): LLMProvider {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
  
  if (apiKey) {
    return new GeminiProvider({ apiKey, model });
  }
  
  // Fallback mock provider for development without API key
  console.warn('No GEMINI_API_KEY found, using mock provider');
  return {
    name: 'mock',
    async generate() {
      return {
        content: 'Task noted!',
        finishReason: 'stop' as const,
      };
    },
    async generateJSON<T>(): Promise<T> {
      return {
        needsClarification: false,
        confidence: 0.9,
      } as T;
    },
  };
}

type View = 'chat' | 'plan';

export default function Home() {
  const [view, setView] = useState<View>('chat');
  const [messages, setMessages] = useState<ConversationEntry[]>([]);
  const [lastResponse, setLastResponse] = useState<ConversationResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string>();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [todayPlan, setTodayPlan] = useState<Plan>({
    date: new Date(),
    tasks: [],
    completedCount: 0,
    totalCount: 0,
    estimatedMinutes: 0,
  });
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [laterTasks, setLaterTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Managers
  const [store, setStore] = useState<TaskStore | null>(null);
  const [conversationManager, setConversationManager] = useState<ConversationManager | null>(null);
  const [taskManager, setTaskManager] = useState<TaskManager | null>(null);
  const [planManager, setPlanManager] = useState<PlanManager | null>(null);
  const [progressManager, setProgressManager] = useState<ProgressManager | null>(null);

  // Initialize managers
  useEffect(() => {
    const init = async () => {
      const storage = new LocalStorageAdapter();
      const taskStore = new TaskStore(storage);
      await taskStore.initialize();

      const priorityEngine = new PriorityEngine();
      const tm = new TaskManager(taskStore, priorityEngine);
      const pm = new PlanManager(taskStore, priorityEngine);
      const prm = new ProgressManager(taskStore);
      const cm = new ConversationManager(taskStore, createLLMProvider());

      setStore(taskStore);
      setTaskManager(tm);
      setPlanManager(pm);
      setProgressManager(prm);
      setConversationManager(cm);
      setIsInitialized(true);
    };

    init();
  }, []);

  // Refresh plan data
  const refreshPlanData = useCallback(() => {
    if (!planManager || !taskManager || !progressManager) return;

    setTodayPlan(planManager.getTodayPlan());
    setUpcomingTasks(taskManager.getUpcomingTasks());
    setLaterTasks(taskManager.getLaterTasks());
    setStreak(progressManager.calculateStreak());
  }, [planManager, taskManager, progressManager]);

  // Initial data load
  useEffect(() => {
    if (isInitialized) {
      refreshPlanData();
    }
  }, [isInitialized, refreshPlanData]);

  const sendMessage = async (text: string) => {
    if (!conversationManager) return;

    setIsLoading(true);

    try {
      const input: UserInput = {
        text,
        timestamp: new Date(),
        context: {
          currentTaskId,
          currentView: view,
        },
      };

      const response = await conversationManager.processInput(input);
      setMessages(conversationManager.getHistory());
      setLastResponse(response);

      if (response.tasks && response.tasks.length > 0) {
        setCurrentTaskId(response.tasks[0].id);
      }

      refreshPlanData();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (action.taskId) {
      setCurrentTaskId(action.taskId);
    }

    const commandMap: Record<string, string> = {
      done: 'done',
      defer: 'defer',
      break_down: 'break it down',
      what_next: "what's next",
    };

    await sendMessage(commandMap[action.action] || action.action);
  };

  const handleComplete = async (taskId: string) => {
    if (!store) return;
    await store.complete(taskId);
    refreshPlanData();
    setSelectedTask(null);
  };

  const handleDefer = async (taskId: string) => {
    if (!store) return;
    await store.defer(taskId);
    refreshPlanData();
    setSelectedTask(null);
  };

  const handleTaskUpdate = async (taskId: string, updates: TaskUpdate) => {
    if (!store) return;
    await store.update(taskId, updates, true);
    refreshPlanData();
    const updated = store.get(taskId);
    if (updated) setSelectedTask(updated);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">⚛️ Atomize</h1>
        <nav className="flex gap-2">
          <button
            onClick={() => setView('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'chat'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setView('plan')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'plan'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Plan
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === 'chat' ? (
          <Chat
            messages={messages}
            lastResponse={lastResponse}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onQuickAction={handleQuickAction}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <PlanView
              todayPlan={todayPlan}
              upcomingTasks={upcomingTasks}
              laterTasks={laterTasks}
              streak={streak}
              onComplete={handleComplete}
              onDefer={handleDefer}
              onTaskClick={handleTaskClick}
            />
          </div>
        )}
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          childTasks={store?.getAll({ parentId: selectedTask.id }) || []}
          onUpdate={handleTaskUpdate}
          onComplete={handleComplete}
          onDefer={handleDefer}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
