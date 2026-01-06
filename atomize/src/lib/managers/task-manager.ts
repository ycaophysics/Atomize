import type { Task, TaskInput, TaskUpdate, TaskFilter } from '@/lib/types';
import { TaskStore } from '@/lib/store';
import { PriorityEngine } from '@/lib/engines';

const MAX_TODAY_TASKS = 7;

export class TaskManager {
  private store: TaskStore;
  private priorityEngine: PriorityEngine;

  constructor(store: TaskStore, priorityEngine?: PriorityEngine) {
    this.store = store;
    this.priorityEngine = priorityEngine || new PriorityEngine();
  }

  /**
   * Create a new task (always appends)
   */
  async createTask(input: TaskInput): Promise<Task> {
    // Calculate priority if not provided
    const priorityResult = this.priorityEngine.calculatePriority({
      priority: input.priority || 'medium',
      deadline: input.deadline,
      createdAt: new Date(),
      childIds: [],
    });

    const taskInput: TaskInput = {
      ...input,
      priority: input.priority || priorityResult.level,
    };

    const task = await this.store.create(taskInput);

    // Update priority reason if we calculated it
    if (!input.priority) {
      await this.store.update(
        task.id,
        { priorityReason: priorityResult.reason },
        true
      );
    }

    return this.store.get(task.id)!;
  }

  /**
   * Get task by ID
   */
  getTask(id: string): Task | null {
    return this.store.get(id);
  }

  /**
   * Get all tasks with optional filters
   */
  getTasks(filter?: TaskFilter): Task[] {
    return this.store.getAll(filter);
  }

  /**
   * Update task (requires explicit user request)
   */
  async updateTask(id: string, updates: TaskUpdate, explicit: boolean): Promise<Task> {
    const task = await this.store.update(id, updates, explicit);

    // Recalculate priority if deadline changed
    if (updates.deadline !== undefined) {
      const priorityResult = this.priorityEngine.calculatePriority(task);
      if (task.priority !== priorityResult.level) {
        await this.store.update(
          id,
          {
            priority: priorityResult.level,
            priorityReason: priorityResult.reason,
          },
          true
        );
      }
    }

    return this.store.get(id)!;
  }

  /**
   * Mark task as complete (preserves data)
   */
  async completeTask(id: string): Promise<Task> {
    return this.store.complete(id);
  }

  /**
   * Delete task (requires explicit user request)
   */
  async deleteTask(id: string, explicit: boolean): Promise<void> {
    return this.store.delete(id, explicit);
  }

  /**
   * Get tasks scheduled for today (max 7, ordered by priority)
   */
  getTodayTasks(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allTasks = this.store.getAll({
      status: ['pending', 'in_progress'],
    });

    // Filter to today's tasks
    const todayTasks = allTasks.filter((task) => {
      if (!task.scheduledDate) {
        // Include tasks with deadline today but no scheduled date
        if (task.deadline) {
          const deadlineDate = new Date(task.deadline);
          deadlineDate.setHours(0, 0, 0, 0);
          return deadlineDate.getTime() === today.getTime();
        }
        return false;
      }

      const scheduledDate = new Date(task.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate.getTime() === today.getTime();
    });

    // Sort by priority and deadline
    const sorted = this.priorityEngine.prioritizeTasks(todayTasks);

    // Return max 7 tasks
    return sorted.slice(0, MAX_TODAY_TASKS);
  }

  /**
   * Get upcoming tasks (next 7 days, not including today)
   */
  getUpcomingTasks(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const allTasks = this.store.getAll({
      status: ['pending', 'in_progress'],
    });

    // Filter to upcoming tasks (tomorrow to 7 days from now)
    const upcomingTasks = allTasks.filter((task) => {
      const dateToCheck = task.scheduledDate || task.deadline;
      if (!dateToCheck) return false;

      const taskDate = new Date(dateToCheck);
      taskDate.setHours(0, 0, 0, 0);

      return taskDate >= tomorrow && taskDate < weekFromNow;
    });

    // Sort by priority and deadline
    return this.priorityEngine.prioritizeTasks(upcomingTasks);
  }

  /**
   * Get later tasks (beyond 7 days)
   */
  getLaterTasks(): Task[] {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    weekFromNow.setHours(0, 0, 0, 0);

    const allTasks = this.store.getAll({
      status: ['pending', 'in_progress'],
    });

    // Filter to later tasks
    const laterTasks = allTasks.filter((task) => {
      const dateToCheck = task.scheduledDate || task.deadline;
      if (!dateToCheck) return true; // Tasks with no date go to "later"

      const taskDate = new Date(dateToCheck);
      taskDate.setHours(0, 0, 0, 0);

      return taskDate >= weekFromNow;
    });

    // Sort by priority and deadline
    return this.priorityEngine.prioritizeTasks(laterTasks);
  }

  /**
   * Get the next recommended task
   */
  getNextTask(): Task | null {
    const todayTasks = this.getTodayTasks();
    return this.priorityEngine.getNextTask(todayTasks);
  }

  /**
   * Get child tasks of a parent
   */
  getChildTasks(parentId: string): Task[] {
    return this.store.getAll({ parentId });
  }

  /**
   * Get task count by status
   */
  getTaskCounts(): { pending: number; completed: number; total: number } {
    const all = this.store.getAll();
    const pending = all.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
    const completed = all.filter((t) => t.status === 'completed').length;

    return {
      pending,
      completed,
      total: all.length,
    };
  }
}
