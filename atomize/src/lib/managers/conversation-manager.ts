import type { Task, TaskInput } from '@/lib/types';
import type { LLMProvider } from '@/lib/llm';
import { TaskStore } from '@/lib/store';
import {
  AtomizationEngine,
  ClarificationEngine,
  ResponseEngine,
  PriorityEngine,
} from '@/lib/engines';
import { parseNaturalDate, extractDeadlineFromText } from '@/lib/utils';
import { TaskManager } from './task-manager';
import { ProgressManager } from './progress-manager';

export interface UserInput {
  text: string;
  timestamp: Date;
  context?: {
    currentTaskId?: string;
    currentView?: 'chat' | 'plan' | 'task';
  };
}

export interface QuickAction {
  label: string;
  action: string;
  taskId?: string;
}

export interface ConversationResponse {
  type: 'message' | 'task_created' | 'task_updated' | 'clarification' | 'confirmation';
  message: string;
  tasks?: Task[];
  clarificationQuestions?: string[];
  suggestedActions?: QuickAction[];
}

export interface ConversationEntry {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  relatedTaskIds: string[];
}

// Command patterns
const COMMAND_PATTERNS = {
  markDone: /^(mark\s+)?done|complete(d)?|finish(ed)?$/i,
  defer: /^defer|move\s+to\s+tomorrow|postpone|later$/i,
  breakDown: /^break\s*(it\s*)?(down|more)|atomize|split$/i,
  delete: /^delete|remove|cancel$/i,
  help: /^help|\?$/i,
  whatNext: /^what('s)?\s*(next|now)|next\s*task$/i,
  status: /^status|progress|how\s*(am\s*i\s*doing|many)$/i,
};

export class ConversationManager {
  private store: TaskStore;
  private taskManager: TaskManager;
  private progressManager: ProgressManager;
  private atomizationEngine: AtomizationEngine;
  private clarificationEngine: ClarificationEngine;
  private responseEngine: ResponseEngine;
  private priorityEngine: PriorityEngine;
  private history: ConversationEntry[] = [];
  private pendingClarification: {
    originalInput: string;
    questions: string[];
    currentQuestionIndex: number;
    answers: string[];
  } | null = null;

  constructor(
    store: TaskStore,
    llmProvider: LLMProvider
  ) {
    this.store = store;
    this.priorityEngine = new PriorityEngine();
    this.taskManager = new TaskManager(store, this.priorityEngine);
    this.progressManager = new ProgressManager(store);
    this.atomizationEngine = new AtomizationEngine(llmProvider);
    this.clarificationEngine = new ClarificationEngine(llmProvider);
    this.responseEngine = new ResponseEngine();
  }

  /**
   * Process user input and return appropriate response
   */
  async processInput(input: UserInput): Promise<ConversationResponse> {
    const text = input.text.trim();

    // Add to history
    this.addToHistory('user', text, []);

    // Handle pending clarification
    if (this.pendingClarification) {
      return this.handleClarificationResponse(text);
    }

    // Check for commands
    const commandResponse = await this.handleCommand(text, input.context);
    if (commandResponse) {
      return commandResponse;
    }

    // Process as new task input
    return this.processNewTaskInput(text);
  }

  /**
   * Get conversation history
   */
  getHistory(limit?: number): ConversationEntry[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.history = [];
    this.pendingClarification = null;
  }

  private async handleCommand(
    text: string,
    context?: UserInput['context']
  ): Promise<ConversationResponse | null> {
    // Mark done
    if (COMMAND_PATTERNS.markDone.test(text)) {
      if (context?.currentTaskId) {
        const task = await this.taskManager.completeTask(context.currentTaskId);
        const stats = this.progressManager.getProgressStats();
        // Convert DayProgress to DayStats format
        const dayStats = {
          completedToday: stats.today.completedCount,
          totalToday: stats.today.totalCount,
          streak: stats.streak,
        };
        const message = this.responseEngine.generateCompletionResponse(task, dayStats);
        this.addToHistory('assistant', message, [task.id]);
        return {
          type: 'task_updated',
          message,
          tasks: [task],
          suggestedActions: this.getQuickActions(),
        };
      }
      return {
        type: 'message',
        message: "Which task would you like to mark as done?",
        suggestedActions: this.getQuickActions(),
      };
    }

    // Defer
    if (COMMAND_PATTERNS.defer.test(text)) {
      if (context?.currentTaskId) {
        const task = await this.store.defer(context.currentTaskId);
        const message = this.responseEngine.generateDeferMessage(task);
        this.addToHistory('assistant', message, [task.id]);
        return {
          type: 'task_updated',
          message,
          tasks: [task],
          suggestedActions: this.getQuickActions(),
        };
      }
      return {
        type: 'message',
        message: "Which task would you like to defer?",
        suggestedActions: this.getQuickActions(),
      };
    }

    // Break down
    if (COMMAND_PATTERNS.breakDown.test(text)) {
      if (context?.currentTaskId) {
        const task = this.store.get(context.currentTaskId);
        if (task) {
          const result = await this.atomizationEngine.atomize(task);
          const createdTasks: Task[] = [];

          for (const mt of result.microTasks) {
            const newTask = await this.taskManager.createTask({
              rawInput: mt.title,
              title: mt.title,
              description: mt.description,
              parentId: task.id,
              deadline: task.deadline,
              estimatedMinutes: mt.estimatedMinutes,
            });
            createdTasks.push(newTask);
          }

          const message = `I've broken "${task.title}" into ${createdTasks.length} smaller tasks:\n\n${createdTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`;
          this.addToHistory('assistant', message, createdTasks.map((t) => t.id));

          return {
            type: 'task_created',
            message,
            tasks: createdTasks,
            suggestedActions: this.getQuickActions(),
          };
        }
      }
      return {
        type: 'message',
        message: "Which task would you like me to break down?",
        suggestedActions: this.getQuickActions(),
      };
    }

    // What's next
    if (COMMAND_PATTERNS.whatNext.test(text)) {
      const nextTask = this.taskManager.getNextTask();
      if (nextTask) {
        const message = this.responseEngine.generateCheckIn(nextTask);
        this.addToHistory('assistant', message, [nextTask.id]);
        return {
          type: 'message',
          message,
          tasks: [nextTask],
          suggestedActions: this.getQuickActions(nextTask.id),
        };
      }
      return {
        type: 'message',
        message: "You're all caught up! No pending tasks right now. 🎉",
        suggestedActions: this.getQuickActions(),
      };
    }

    // Status
    if (COMMAND_PATTERNS.status.test(text)) {
      const stats = this.progressManager.getProgressStats();
      let message = `📊 Today's Progress: ${stats.today.completedCount} of ${stats.today.totalCount} tasks done\n`;
      if (stats.streak > 0) {
        message += `🔥 Current streak: ${stats.streak} days\n`;
      }
      message += `✅ Total completed: ${stats.totalCompleted} tasks`;
      this.addToHistory('assistant', message, []);
      return {
        type: 'message',
        message,
        suggestedActions: this.getQuickActions(),
      };
    }

    // Help
    if (COMMAND_PATTERNS.help.test(text)) {
      const message = `Here's what I can help with:

📝 **Add tasks**: Just tell me what you need to do
🔨 **Break down**: Say "break it down" to split a task
✅ **Complete**: Say "done" to mark a task complete
📅 **Defer**: Say "defer" to move to tomorrow
📊 **Status**: Say "status" to see your progress
❓ **Next**: Say "what's next" for a recommendation

Just type naturally - I'll figure out what you need!`;
      this.addToHistory('assistant', message, []);
      return {
        type: 'message',
        message,
        suggestedActions: this.getQuickActions(),
      };
    }

    return null;
  }

  private async processNewTaskInput(text: string): Promise<ConversationResponse> {
    // Check if clarification is needed
    const analysis = await this.clarificationEngine.needsClarification(text);

    if (analysis.needsClarification && analysis.confidence < 0.7) {
      const questions = await this.clarificationEngine.generateQuestions(text);

      if (questions.length > 0) {
        this.pendingClarification = {
          originalInput: text,
          questions,
          currentQuestionIndex: 0,
          answers: [],
        };

        const message = `I'd like to understand this better:\n\n${questions[0]}`;
        this.addToHistory('assistant', message, []);

        return {
          type: 'clarification',
          message,
          clarificationQuestions: questions,
          suggestedActions: [],
        };
      }
    }

    // Create task directly
    return this.createTaskFromInput(text);
  }

  private async handleClarificationResponse(answer: string): Promise<ConversationResponse> {
    if (!this.pendingClarification) {
      return this.processNewTaskInput(answer);
    }

    const { originalInput, questions, currentQuestionIndex, answers } = this.pendingClarification;
    answers.push(answer);

    // Process the clarification
    const clarified = await this.clarificationEngine.processClarification(
      originalInput,
      questions[currentQuestionIndex],
      answer
    );

    // If confidence is high enough or we've asked all questions, create the task
    if (clarified.confidence >= 0.7 || currentQuestionIndex >= questions.length - 1) {
      this.pendingClarification = null;

      const taskInput: TaskInput = {
        rawInput: originalInput,
        title: clarified.title,
        description: clarified.description,
        deadline: clarified.deadline,
        priority: clarified.priority,
        estimatedMinutes: clarified.estimatedMinutes,
      };

      const task = await this.taskManager.createTask(taskInput);
      const message = this.responseEngine.generateTaskCreatedResponse(task);
      this.addToHistory('assistant', message, [task.id]);

      return {
        type: 'task_created',
        message,
        tasks: [task],
        suggestedActions: this.getQuickActions(task.id),
      };
    }

    // Ask next question
    this.pendingClarification.currentQuestionIndex++;
    const nextQuestion = questions[this.pendingClarification.currentQuestionIndex];
    this.addToHistory('assistant', nextQuestion, []);

    return {
      type: 'clarification',
      message: nextQuestion,
      clarificationQuestions: questions.slice(this.pendingClarification.currentQuestionIndex),
      suggestedActions: [],
    };
  }

  private async createTaskFromInput(text: string): Promise<ConversationResponse> {
    // Extract deadline if present
    const deadlineResult = extractDeadlineFromText(text);
    let deadline: Date | undefined;

    if (deadlineResult) {
      deadline = deadlineResult.date;
    }

    // First create the parent task
    const taskInput: TaskInput = {
      rawInput: text,
      deadline,
    };

    const parentTask = await this.taskManager.createTask(taskInput);

    // AUTO-ATOMIZE: Always break down tasks using LLM
    try {
      const result = await this.atomizationEngine.atomize(parentTask);
      
      // If we got meaningful micro-tasks (more than 1, or different from original)
      if (result.microTasks.length > 1 || 
          (result.microTasks.length === 1 && result.microTasks[0].title !== parentTask.title)) {
        
        const createdTasks: Task[] = [];
        
        for (const mt of result.microTasks) {
          const newTask = await this.taskManager.createTask({
            rawInput: mt.title,
            title: mt.title,
            description: mt.description,
            parentId: parentTask.id,
            deadline: parentTask.deadline,
            estimatedMinutes: mt.estimatedMinutes,
          });
          createdTasks.push(newTask);
        }

        // Build response with atomized tasks
        let message = `Got it! I've broken down "${parentTask.title}" into ${createdTasks.length} actionable steps:\n\n`;
        message += createdTasks.map((t, i) => `${i + 1}. ${t.title} (${t.estimatedMinutes || 30} min)`).join('\n');
        
        if (result.mvpSuggestion) {
          message += `\n\n💡 MVP: ${result.mvpSuggestion}`;
        }

        this.addToHistory('assistant', message, [parentTask.id, ...createdTasks.map(t => t.id)]);

        return {
          type: 'task_created',
          message,
          tasks: [parentTask, ...createdTasks],
          suggestedActions: this.getQuickActions(createdTasks[0]?.id),
        };
      }
    } catch (error) {
      console.error('Auto-atomization failed:', error);
      // Fall through to simple task creation
    }

    // Fallback: just return the single task
    const message = this.responseEngine.generateTaskCreatedResponse(parentTask);
    this.addToHistory('assistant', message, [parentTask.id]);

    return {
      type: 'task_created',
      message,
      tasks: [parentTask],
      suggestedActions: this.getQuickActions(parentTask.id),
    };
  }

  private getQuickActions(taskId?: string): QuickAction[] {
    const actions: QuickAction[] = [];

    if (taskId) {
      actions.push(
        { label: '✅ Done', action: 'done', taskId },
        { label: '📅 Defer', action: 'defer', taskId },
        { label: '🔨 Break Down', action: 'break_down', taskId }
      );
    }

    actions.push({ label: '❓ What\'s Next', action: 'what_next' });

    return actions;
  }

  private addToHistory(role: 'user' | 'assistant', content: string, relatedTaskIds: string[]): void {
    this.history.push({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      role,
      content,
      relatedTaskIds,
    });
  }
}
