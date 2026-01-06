import type { Task } from '@/lib/types';
import { TaskStore } from '@/lib/store';
import { PriorityEngine } from '@/lib/engines';

export interface Plan {
  date: Date;
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  estimatedMinutes: number;
}

export interface AdaptationTrigger {
  type: 'task_completed' | 'task_deferred' | 'new_task' | 'deadline_changed' | 'time_passed';
  taskId?: string;
  details?: unknown;
}

export interface PlanChange {
  taskId: string;
  changeType: 'rescheduled' | 'reprioritized' | 'removed';
  from?: unknown;
  to?: unknown;
  reason: string;
}

export interface PlanAdaptation {
  changes: PlanChange[];
  explanation: string;
}

export class PlanManager {
  private store: TaskStore;
  private priorityEngine: PriorityEngine;

  constructor(store: TaskStore, priorityEngine?: PriorityEngine) {
    this.store = store;
    this.priorityEngine = priorityEngine || new PriorityEngine();
  }

  /**
   * Get today's plan with progress tracking
   */
  getTodayPlan(): Plan {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTasks = this.store.getAll();

    // Get tasks for today
    const todayTasks = allTasks.filter((task) => {
      const dateToCheck = task.scheduledDate || task.deadline;
      if (!dateToCheck) return false;

      const taskDate = new Date(dateToCheck);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });

    const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = todayTasks.filter(
      (t) => t.status === 'pending' || t.status === 'in_progress'
    );

    // Sort pending tasks by priority
    const sortedPending = this.priorityEngine.prioritizeTasks(pendingTasks);

    // Calculate total estimated time
    const estimatedMinutes = sortedPending.reduce(
      (sum, t) => sum + (t.estimatedMinutes || 30),
      0
    );

    return {
      date: today,
      tasks: sortedPending,
      completedCount,
      totalCount: todayTasks.length,
      estimatedMinutes,
    };
  }

  /**
   * Get weekly plan (7 days including today)
   */
  getWeekPlan(): Plan[] {
    const plans: Plan[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dayTasks = this.getTasksForDate(date);
      const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
      const pendingTasks = dayTasks.filter(
        (t) => t.status === 'pending' || t.status === 'in_progress'
      );

      const sortedPending = this.priorityEngine.prioritizeTasks(pendingTasks);
      const estimatedMinutes = sortedPending.reduce(
        (sum, t) => sum + (t.estimatedMinutes || 30),
        0
      );

      plans.push({
        date,
        tasks: sortedPending,
        completedCount,
        totalCount: dayTasks.length,
        estimatedMinutes,
      });
    }

    return plans;
  }

  /**
   * Reschedule a task to a new date
   */
  async rescheduleTask(taskId: string, newDate: Date): Promise<Task> {
    const task = this.store.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return this.store.update(
      taskId,
      { scheduledDate: newDate },
      true
    );
  }

  /**
   * Defer task to tomorrow
   */
  async deferTask(taskId: string): Promise<Task> {
    return this.store.defer(taskId);
  }

  /**
   * Adapt plan when circumstances change
   */
  async adaptPlan(trigger: AdaptationTrigger): Promise<PlanAdaptation> {
    const changes: PlanChange[] = [];
    const explanations: string[] = [];

    switch (trigger.type) {
      case 'task_completed': {
        // Suggest next task
        const nextTask = this.getNextTask();
        if (nextTask) {
          explanations.push(`Great job! Next up: "${nextTask.title}"`);
        } else {
          explanations.push('All done for today! 🎉');
        }
        break;
      }

      case 'task_deferred': {
        if (trigger.taskId) {
          const task = this.store.get(trigger.taskId);
          if (task) {
            changes.push({
              taskId: trigger.taskId,
              changeType: 'rescheduled',
              from: 'today',
              to: 'tomorrow',
              reason: 'Task deferred by user',
            });
            explanations.push(`"${task.title}" moved to tomorrow. No worries!`);
          }
        }
        break;
      }

      case 'new_task': {
        if (trigger.taskId) {
          const task = this.store.get(trigger.taskId);
          if (task && task.priority === 'high') {
            // High priority task added - may need to reorder
            const todayPlan = this.getTodayPlan();
            if (todayPlan.tasks.length > 0) {
              explanations.push(
                `Added "${task.title}" as high priority. It's now at the top of your list.`
              );
            }
          }
        }
        break;
      }

      case 'deadline_changed': {
        if (trigger.taskId) {
          const task = this.store.get(trigger.taskId);
          if (task) {
            // Recalculate priority
            const newPriority = this.priorityEngine.calculatePriority(task);
            if (task.priority !== newPriority.level) {
              changes.push({
                taskId: trigger.taskId,
                changeType: 'reprioritized',
                from: task.priority,
                to: newPriority.level,
                reason: newPriority.reason,
              });

              await this.store.update(
                trigger.taskId,
                {
                  priority: newPriority.level,
                  priorityReason: newPriority.reason,
                },
                true
              );

              explanations.push(
                `"${task.title}" priority changed to ${newPriority.level}: ${newPriority.reason}`
              );
            }
          }
        }
        break;
      }

      case 'time_passed': {
        // Check for overdue tasks and auto-reschedule
        const overdueTasks = this.getOverdueTasks();
        for (const task of overdueTasks) {
          // Auto-reschedule to today
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          await this.store.update(
            task.id,
            { scheduledDate: today },
            true
          );

          changes.push({
            taskId: task.id,
            changeType: 'rescheduled',
            from: task.scheduledDate?.toISOString(),
            to: today.toISOString(),
            reason: 'Auto-rescheduled from past date',
          });
        }

        if (overdueTasks.length > 0) {
          explanations.push(
            `Moved ${overdueTasks.length} task(s) from past dates to today.`
          );
        }
        break;
      }
    }

    return {
      changes,
      explanation: explanations.join(' ') || 'Plan updated.',
    };
  }

  /**
   * Get the next recommended task
   */
  getNextTask(): Task | null {
    const todayPlan = this.getTodayPlan();
    return this.priorityEngine.getNextTask(todayPlan.tasks);
  }

  /**
   * Get overdue tasks (scheduled for past dates)
   */
  private getOverdueTasks(): Task[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTasks = this.store.getAll({
      status: ['pending', 'in_progress'],
    });

    return allTasks.filter((task) => {
      if (!task.scheduledDate) return false;
      const scheduledDate = new Date(task.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);
      return scheduledDate < today;
    });
  }

  /**
   * Get tasks for a specific date
   */
  private getTasksForDate(date: Date): Task[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const allTasks = this.store.getAll();

    return allTasks.filter((task) => {
      const dateToCheck = task.scheduledDate || task.deadline;
      if (!dateToCheck) return false;

      const taskDate = new Date(dateToCheck);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === targetDate.getTime();
    });
  }
}
