import type { Task } from '@/lib/types';
import type { LLMProvider, LLMMessage } from '@/lib/llm';

export interface MicroTaskSuggestion {
  title: string;
  description?: string;
  estimatedMinutes: number;
  dependsOn: string[]; // Indices of tasks this depends on
  isParallelizable: boolean;
}

export interface Dependency {
  fromIndex: number;
  toIndex: number;
  type: 'blocks' | 'informs';
}

export interface AtomizationResult {
  microTasks: MicroTaskSuggestion[];
  dependencies: Dependency[];
  parallelGroups: number[][]; // Groups of task indices that can run in parallel
  mvpSuggestion?: string;
}

// Common action verbs for task titles
const ACTION_VERBS = [
  'Write', 'Draft', 'Create', 'Design', 'Build', 'Implement', 'Develop',
  'Review', 'Edit', 'Update', 'Fix', 'Debug', 'Test', 'Verify', 'Check',
  'Research', 'Analyze', 'Investigate', 'Explore', 'Study', 'Learn',
  'Send', 'Email', 'Call', 'Contact', 'Schedule', 'Meet', 'Discuss',
  'Prepare', 'Plan', 'Organize', 'Set up', 'Configure', 'Install',
  'Document', 'Record', 'Note', 'List', 'Outline', 'Summarize',
  'Complete', 'Finish', 'Submit', 'Deliver', 'Present', 'Share',
  'Gather', 'Collect', 'Find', 'Locate', 'Identify', 'Select',
  'Define', 'Specify', 'Clarify', 'Confirm', 'Validate', 'Approve',
];

export class AtomizationEngine {
  private llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  /**
   * Break down a task into micro-tasks using LLM
   */
  async atomize(task: Task): Promise<AtomizationResult> {
    // If task is already small enough, return it as-is
    if (task.estimatedMinutes && task.estimatedMinutes <= 60) {
      return this.createSingleTaskResult(task);
    }

    const prompt = this.buildAtomizationPrompt(task);
    const messages: LLMMessage[] = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt },
    ];

    try {
      const result = await this.llmProvider.generateJSON<AtomizationLLMResponse>(
        messages,
        this.getResponseSchema(),
        { temperature: 0.3 }
      );

      return this.processLLMResponse(result, task);
    } catch (error) {
      console.error('Atomization failed, returning single task:', error);
      return this.createSingleTaskResult(task);
    }
  }

  /**
   * Suggest minimum viable progress for a task with deadline
   */
  async suggestMVP(task: Task): Promise<string> {
    if (!task.deadline) {
      return '';
    }

    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a productivity assistant. Given a task with a deadline, suggest the minimum viable progress (MVP) - the smallest deliverable that represents meaningful progress. Be concise and specific.`,
      },
      {
        role: 'user',
        content: `Task: ${task.title}\nDescription: ${task.description || 'None'}\nDeadline: ${task.deadline.toISOString()}\n\nWhat is the minimum viable progress for this task? Respond with just the MVP suggestion, no explanation.`,
      },
    ];

    try {
      const response = await this.llmProvider.generate(messages, { temperature: 0.5 });
      return response.content.trim();
    } catch (error) {
      console.error('MVP suggestion failed:', error);
      return `Complete the first step of "${task.title}"`;
    }
  }

  /**
   * Estimate time for a task using LLM
   */
  async estimateTime(task: Task): Promise<number> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: `You are a productivity assistant. Estimate how long a task will take in minutes. Consider complexity, typical time for similar tasks, and any context provided. Respond with just a number (minutes).`,
      },
      {
        role: 'user',
        content: `Task: ${task.title}\nDescription: ${task.description || 'None'}\n\nEstimate in minutes:`,
      },
    ];

    try {
      const response = await this.llmProvider.generate(messages, { temperature: 0.3 });
      const minutes = parseInt(response.content.trim(), 10);
      return isNaN(minutes) ? 30 : Math.max(5, Math.min(480, minutes));
    } catch (error) {
      console.error('Time estimation failed:', error);
      return 30; // Default to 30 minutes
    }
  }

  /**
   * Ensure a title starts with an action verb
   */
  ensureActionVerb(title: string): string {
    const firstWord = title.split(' ')[0];
    const isVerb = ACTION_VERBS.some(
      (verb) => firstWord.toLowerCase() === verb.toLowerCase()
    );

    if (isVerb) {
      return title;
    }

    // Try to infer an appropriate verb
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('email') || lowerTitle.includes('message')) {
      return `Send ${title}`;
    }
    if (lowerTitle.includes('meeting') || lowerTitle.includes('call')) {
      return `Schedule ${title}`;
    }
    if (lowerTitle.includes('report') || lowerTitle.includes('document')) {
      return `Write ${title}`;
    }
    if (lowerTitle.includes('bug') || lowerTitle.includes('issue')) {
      return `Fix ${title}`;
    }
    if (lowerTitle.includes('test')) {
      return `Run ${title}`;
    }

    // Default to "Complete"
    return `Complete ${title}`;
  }

  /**
   * Clamp time estimate to valid range (15-60 minutes for micro-tasks)
   */
  clampTimeEstimate(minutes: number): number {
    return Math.max(15, Math.min(60, minutes));
  }

  private getSystemPrompt(): string {
    return `You are a task decomposition assistant. Your job is to break down large tasks into smaller, actionable micro-tasks.

Rules:
1. Each micro-task should take 15-60 minutes
2. Each micro-task title MUST start with an action verb (e.g., "Write", "Review", "Send", "Create")
3. Identify dependencies between tasks (which tasks must be done before others)
4. Mark tasks that can be done in parallel
5. Be specific and concrete - avoid vague tasks
6. Aim for 3-7 micro-tasks for most tasks

Respond with valid JSON only.`;
  }

  private buildAtomizationPrompt(task: Task): string {
    let prompt = `Break down this task into micro-tasks:\n\nTask: ${task.title}`;

    if (task.description) {
      prompt += `\nDescription: ${task.description}`;
    }

    if (task.deadline) {
      prompt += `\nDeadline: ${task.deadline.toISOString()}`;
    }

    if (task.estimatedMinutes) {
      prompt += `\nEstimated total time: ${task.estimatedMinutes} minutes`;
    }

    if (task.context.originalGoal) {
      prompt += `\nOriginal goal: ${task.context.originalGoal}`;
    }

    return prompt;
  }

  private getResponseSchema(): object {
    return {
      type: 'object',
      properties: {
        microTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              estimatedMinutes: { type: 'number' },
              dependsOn: { type: 'array', items: { type: 'number' } },
            },
            required: ['title', 'estimatedMinutes'],
          },
        },
        mvpSuggestion: { type: 'string' },
      },
      required: ['microTasks'],
    };
  }

  private processLLMResponse(
    response: AtomizationLLMResponse,
    originalTask: Task
  ): AtomizationResult {
    const microTasks: MicroTaskSuggestion[] = response.microTasks.map((mt, index) => ({
      title: this.ensureActionVerb(mt.title),
      description: mt.description,
      estimatedMinutes: this.clampTimeEstimate(mt.estimatedMinutes || 30),
      dependsOn: (mt.dependsOn || []).map(String),
      isParallelizable: !mt.dependsOn || mt.dependsOn.length === 0,
    }));

    // Build dependencies
    const dependencies: Dependency[] = [];
    microTasks.forEach((mt, toIndex) => {
      mt.dependsOn.forEach((fromIndexStr) => {
        const fromIndex = parseInt(fromIndexStr, 10);
        if (!isNaN(fromIndex) && fromIndex < microTasks.length) {
          dependencies.push({
            fromIndex,
            toIndex,
            type: 'blocks',
          });
        }
      });
    });

    // Build parallel groups
    const parallelGroups = this.buildParallelGroups(microTasks);

    // Generate MVP if task has deadline and LLM didn't provide one
    let mvpSuggestion = response.mvpSuggestion;
    if (!mvpSuggestion && originalTask.deadline && microTasks.length > 0) {
      mvpSuggestion = `Complete "${microTasks[0].title}"`;
    }

    return {
      microTasks,
      dependencies,
      parallelGroups,
      mvpSuggestion,
    };
  }

  private buildParallelGroups(microTasks: MicroTaskSuggestion[]): number[][] {
    const groups: number[][] = [];
    const currentGroup: number[] = [];

    microTasks.forEach((mt, index) => {
      if (mt.isParallelizable) {
        currentGroup.push(index);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
          currentGroup.length = 0;
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Topological sort to order tasks by dependencies
   * Returns indices in execution order
   */
  topologicalSort(microTasks: MicroTaskSuggestion[]): number[] {
    const n = microTasks.length;
    const inDegree = new Array(n).fill(0);
    const adjList: number[][] = Array.from({ length: n }, () => []);

    // Build adjacency list and calculate in-degrees
    microTasks.forEach((mt, toIndex) => {
      mt.dependsOn.forEach((fromIndexStr) => {
        const fromIndex = parseInt(fromIndexStr, 10);
        if (!isNaN(fromIndex) && fromIndex < n && fromIndex !== toIndex) {
          adjList[fromIndex].push(toIndex);
          inDegree[toIndex]++;
        }
      });
    });

    // Kahn's algorithm
    const queue: number[] = [];
    const result: number[] = [];

    // Start with nodes that have no dependencies
    for (let i = 0; i < n; i++) {
      if (inDegree[i] === 0) {
        queue.push(i);
      }
    }

    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);

      for (const neighbor of adjList[node]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If we couldn't process all nodes, there's a cycle
    // Return original order in that case
    if (result.length !== n) {
      console.warn('Dependency cycle detected, using original order');
      return Array.from({ length: n }, (_, i) => i);
    }

    return result;
  }

  /**
   * Order micro-tasks by dependencies (topological sort)
   */
  orderByDependencies(microTasks: MicroTaskSuggestion[]): MicroTaskSuggestion[] {
    const order = this.topologicalSort(microTasks);
    return order.map((i) => microTasks[i]);
  }

  private createSingleTaskResult(task: Task): AtomizationResult {
    return {
      microTasks: [
        {
          title: this.ensureActionVerb(task.title),
          description: task.description,
          estimatedMinutes: task.estimatedMinutes
            ? this.clampTimeEstimate(task.estimatedMinutes)
            : 30,
          dependsOn: [],
          isParallelizable: true,
        },
      ],
      dependencies: [],
      parallelGroups: [[0]],
      mvpSuggestion: task.deadline ? `Complete "${task.title}"` : undefined,
    };
  }
}

interface AtomizationLLMResponse {
  microTasks: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
    dependsOn?: number[];
  }[];
  mvpSuggestion?: string;
}

/**
 * Convert atomization result to TaskInput objects for creating child tasks
 */
export function atomizationResultToTaskInputs(
  result: AtomizationResult,
  parentTask: Task
): import('@/lib/types').TaskInput[] {
  return result.microTasks.map((mt) => ({
    rawInput: mt.title,
    title: mt.title,
    description: mt.description,
    parentId: parentTask.id,
    deadline: parentTask.deadline,
    estimatedMinutes: mt.estimatedMinutes,
  }));
}
