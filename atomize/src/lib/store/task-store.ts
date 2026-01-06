import type {
  Task,
  TaskInput,
  TaskUpdate,
  TaskFilter,
  TaskHistoryEntry,
  SerializedTask,
} from '@/lib/types';
import { serializeTask, deserializeTask } from '@/lib/types';

export interface StorageAdapter {
  load(): Promise<SerializedTask[]>;
  save(tasks: SerializedTask[]): Promise<void>;
}

export class TaskStore {
  private tasks: Map<string, Task> = new Map();
  private storage: StorageAdapter | null = null;

  constructor(storage?: StorageAdapter) {
    this.storage = storage || null;
  }

  async initialize(): Promise<void> {
    if (this.storage) {
      const serialized = await this.storage.load();
      for (const data of serialized) {
        const task = deserializeTask(data);
        this.tasks.set(task.id, task);
      }
    }
  }

  private async persist(): Promise<void> {
    if (this.storage) {
      const serialized = Array.from(this.tasks.values()).map(serializeTask);
      await this.storage.save(serialized);
    }
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // Create a new task (always appends)
  async create(input: TaskInput): Promise<Task> {
    const now = new Date();
    const id = this.generateId();

    const task: Task = {
      id,
      createdAt: now,
      updatedAt: now,
      title: input.title || input.rawInput.slice(0, 100),
      description: input.description,
      rawInput: input.rawInput,
      parentId: input.parentId,
      childIds: [],
      deadline: input.deadline,
      scheduledDate: input.scheduledDate,
      estimatedMinutes: input.estimatedMinutes,
      priority: input.priority || 'medium',
      priorityReason: input.priority ? 'User specified' : 'Default priority',
      status: 'pending',
      context: {
        notes: [],
        relatedTaskIds: [],
      },
      history: [
        {
          timestamp: now,
          action: 'created',
          details: 'Task created',
        },
      ],
    };

    // If this task has a parent, update parent's childIds
    if (input.parentId) {
      const parent = this.tasks.get(input.parentId);
      if (parent) {
        const updatedParent: Task = {
          ...parent,
          childIds: [...parent.childIds, id],
          updatedAt: now,
          history: [
            ...parent.history,
            {
              timestamp: now,
              action: 'updated',
              details: `Added child task: ${id}`,
              previousValue: parent.childIds,
              newValue: [...parent.childIds, id],
            },
          ],
        };
        this.tasks.set(parent.id, updatedParent);

        // Set parent context on child
        task.context.parentContext = parent.title;
        task.context.originalGoal = parent.rawInput;
      }
    }

    this.tasks.set(id, task);
    await this.persist();
    return task;
  }

  // Get a task by ID
  get(id: string): Task | null {
    return this.tasks.get(id) || null;
  }

  // Get all tasks with optional filtering
  getAll(filter?: TaskFilter): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        tasks = tasks.filter((t) => filter.status!.includes(t.status));
      }

      if (filter.priority && filter.priority.length > 0) {
        tasks = tasks.filter((t) => filter.priority!.includes(t.priority));
      }

      if (filter.dateRange) {
        tasks = tasks.filter((t) => {
          if (!t.scheduledDate) return false;
          return t.scheduledDate >= filter.dateRange!.start && t.scheduledDate <= filter.dateRange!.end;
        });
      }

      if (filter.parentId !== undefined) {
        tasks = tasks.filter((t) => t.parentId === filter.parentId);
      }

      if (filter.scheduledDate) {
        const targetDate = new Date(filter.scheduledDate);
        targetDate.setHours(0, 0, 0, 0);
        tasks = tasks.filter((t) => {
          if (!t.scheduledDate) return false;
          const taskDate = new Date(t.scheduledDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === targetDate.getTime();
        });
      }
    }

    return tasks;
  }

  // Update a task (requires explicit flag)
  async update(id: string, updates: TaskUpdate, explicit: boolean): Promise<Task> {
    if (!explicit) {
      throw new Error('Task modifications require explicit user request');
    }

    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const now = new Date();
    const historyEntries: TaskHistoryEntry[] = [];

    // Record each change in history
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && task[key as keyof Task] !== value) {
        historyEntries.push({
          timestamp: now,
          action: 'updated',
          details: `${key} changed`,
          previousValue: task[key as keyof Task],
          newValue: value,
        });
      }
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      updatedAt: now,
      history: [...task.history, ...historyEntries],
    };

    this.tasks.set(id, updatedTask);
    await this.persist();
    return updatedTask;
  }

  // Mark task as complete (preserves data)
  async complete(id: string): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const now = new Date();
    const historyEntry: TaskHistoryEntry = {
      timestamp: now,
      action: 'completed',
      details: 'Task marked as complete',
      previousValue: task.status,
      newValue: 'completed',
    };

    const updatedTask: Task = {
      ...task,
      status: 'completed',
      updatedAt: now,
      history: [...task.history, historyEntry],
    };

    this.tasks.set(id, updatedTask);
    await this.persist();
    return updatedTask;
  }

  // Defer task (reschedule to later)
  async defer(id: string, newDate?: Date): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const scheduledDate = newDate || tomorrow;

    const historyEntry: TaskHistoryEntry = {
      timestamp: now,
      action: 'deferred',
      details: `Task deferred to ${scheduledDate.toISOString()}`,
      previousValue: task.scheduledDate?.toISOString(),
      newValue: scheduledDate.toISOString(),
    };

    const updatedTask: Task = {
      ...task,
      status: 'deferred',
      scheduledDate,
      updatedAt: now,
      history: [...task.history, historyEntry],
    };

    this.tasks.set(id, updatedTask);
    await this.persist();
    return updatedTask;
  }

  // Delete task (requires explicit flag)
  async delete(id: string, explicit: boolean): Promise<void> {
    if (!explicit) {
      throw new Error('Task deletion requires explicit user request');
    }

    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    // Remove from parent's childIds if applicable
    if (task.parentId) {
      const parent = this.tasks.get(task.parentId);
      if (parent) {
        const now = new Date();
        const updatedParent: Task = {
          ...parent,
          childIds: parent.childIds.filter((cid) => cid !== id),
          updatedAt: now,
          history: [
            ...parent.history,
            {
              timestamp: now,
              action: 'updated',
              details: `Removed child task: ${id}`,
              previousValue: parent.childIds,
              newValue: parent.childIds.filter((cid) => cid !== id),
            },
          ],
        };
        this.tasks.set(parent.id, updatedParent);
      }
    }

    this.tasks.delete(id);
    await this.persist();
  }

  // Export all tasks to JSON
  exportJSON(): string {
    const tasks = Array.from(this.tasks.values()).map(serializeTask);
    return JSON.stringify(tasks, null, 2);
  }

  // Import tasks from JSON (appends, doesn't replace)
  async importJSON(json: string): Promise<Task[]> {
    const data = JSON.parse(json) as SerializedTask[];
    const imported: Task[] = [];

    for (const serialized of data) {
      const task = deserializeTask(serialized);
      // Generate new ID to avoid conflicts
      const newId = this.generateId();
      const now = new Date();

      const importedTask: Task = {
        ...task,
        id: newId,
        updatedAt: now,
        history: [
          ...task.history,
          {
            timestamp: now,
            action: 'created',
            details: `Imported from external source (original ID: ${task.id})`,
          },
        ],
      };

      this.tasks.set(newId, importedTask);
      imported.push(importedTask);
    }

    await this.persist();
    return imported;
  }

  // Get task count
  count(): number {
    return this.tasks.size;
  }

  // Clear all tasks (for testing)
  clear(): void {
    this.tasks.clear();
  }
}
