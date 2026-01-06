import type { Task, PriorityLevel } from '@/lib/types';

export interface PriorityResult {
  level: PriorityLevel;
  reason: string;
  score: number; // 0-100 for fine-grained ordering
  factors: PriorityFactor[];
}

export interface PriorityFactor {
  name: string;
  weight: number;
  value: number;
  explanation: string;
}

// Partial task type for priority calculation
export type PriorityInput = Pick<Task, 'priority' | 'createdAt' | 'childIds'> & {
  deadline?: Date;
  parentId?: string;
};

const HOURS_IN_DAY = 24;
const HOURS_IN_WEEK = 7 * HOURS_IN_DAY;

export class PriorityEngine {
  /**
   * Calculate priority for a single task based on deadline and other factors
   */
  calculatePriority(task: Task | PriorityInput): PriorityResult {
    const factors: PriorityFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Deadline urgency (weight: 50)
    const deadlineFactor = this.calculateDeadlineFactor(task);
    factors.push(deadlineFactor);
    totalScore += deadlineFactor.value * deadlineFactor.weight;
    totalWeight += deadlineFactor.weight;

    // Factor 2: Existing priority (weight: 30) - user may have set it
    const existingPriorityFactor = this.calculateExistingPriorityFactor(task);
    factors.push(existingPriorityFactor);
    totalScore += existingPriorityFactor.value * existingPriorityFactor.weight;
    totalWeight += existingPriorityFactor.weight;

    // Factor 3: Task age (weight: 10) - older tasks get slight boost
    const ageFactor = this.calculateAgeFactor(task);
    factors.push(ageFactor);
    totalScore += ageFactor.value * ageFactor.weight;
    totalWeight += ageFactor.weight;

    // Factor 4: Has children (weight: 10) - parent tasks may be more important
    const hierarchyFactor = this.calculateHierarchyFactor(task);
    factors.push(hierarchyFactor);
    totalScore += hierarchyFactor.value * hierarchyFactor.weight;
    totalWeight += hierarchyFactor.weight;

    const score = Math.round(totalScore / totalWeight);
    const level = this.scoreToLevel(score);
    const reason = this.generateReason(level, factors);

    return { level, reason, score, factors };
  }

  /**
   * Sort tasks by priority (high > medium > low) then by deadline (earlier first)
   */
  prioritizeTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // First sort by priority level
      const priorityOrder: Record<PriorityLevel, number> = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by deadline (earlier first, no deadline last)
      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      // Finally by creation date (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Get the next recommended task from a list
   */
  getNextTask(tasks: Task[]): Task | null {
    const pendingTasks = tasks.filter(
      (t) => t.status === 'pending' || t.status === 'in_progress'
    );

    if (pendingTasks.length === 0) return null;

    const sorted = this.prioritizeTasks(pendingTasks);
    return sorted[0];
  }

  /**
   * Recalculate priority for a task (e.g., after deadline change)
   */
  recalculatePriority(task: Task): { priority: PriorityLevel; priorityReason: string } {
    const result = this.calculatePriority(task);
    return {
      priority: result.level,
      priorityReason: result.reason,
    };
  }

  private calculateDeadlineFactor(task: Task | PriorityInput): PriorityFactor {
    const weight = 50;

    if (!task.deadline) {
      return {
        name: 'deadline',
        weight,
        value: 30, // Low score for no deadline
        explanation: 'No deadline set',
      };
    }

    const now = new Date();
    const hoursUntilDeadline = (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 0) {
      return {
        name: 'deadline',
        weight,
        value: 100,
        explanation: 'Overdue',
      };
    }

    if (hoursUntilDeadline <= HOURS_IN_DAY) {
      return {
        name: 'deadline',
        weight,
        value: 100,
        explanation: 'Due within 24 hours',
      };
    }

    if (hoursUntilDeadline <= HOURS_IN_WEEK) {
      // Scale from 70-90 based on how close to deadline
      const daysUntil = hoursUntilDeadline / HOURS_IN_DAY;
      const value = Math.round(90 - (daysUntil - 1) * 3);
      return {
        name: 'deadline',
        weight,
        value,
        explanation: `Due in ${Math.ceil(daysUntil)} days`,
      };
    }

    // More than a week away
    const daysUntil = hoursUntilDeadline / HOURS_IN_DAY;
    const value = Math.max(20, Math.round(60 - daysUntil));
    return {
      name: 'deadline',
      weight,
      value,
      explanation: `Due in ${Math.ceil(daysUntil)} days`,
    };
  }

  private calculateExistingPriorityFactor(task: Task | PriorityInput): PriorityFactor {
    const weight = 30;
    const priorityValues: Record<PriorityLevel, number> = {
      high: 100,
      medium: 50,
      low: 20,
    };

    return {
      name: 'existing_priority',
      weight,
      value: priorityValues[task.priority],
      explanation: `Current priority: ${task.priority}`,
    };
  }

  private calculateAgeFactor(task: Task | PriorityInput): PriorityFactor {
    const weight = 10;
    const now = new Date();
    const ageInDays = (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Older tasks get a slight boost (max 20 points for tasks > 7 days old)
    const value = Math.min(100, Math.round(30 + ageInDays * 10));

    return {
      name: 'age',
      weight,
      value,
      explanation: `Created ${Math.floor(ageInDays)} days ago`,
    };
  }

  private calculateHierarchyFactor(task: Task | PriorityInput): PriorityFactor {
    const weight = 10;

    if (task.childIds.length > 0) {
      return {
        name: 'hierarchy',
        weight,
        value: 70,
        explanation: 'Has subtasks',
      };
    }

    if (task.parentId) {
      return {
        name: 'hierarchy',
        weight,
        value: 50,
        explanation: 'Is a subtask',
      };
    }

    return {
      name: 'hierarchy',
      weight,
      value: 40,
      explanation: 'Standalone task',
    };
  }

  private scoreToLevel(score: number): PriorityLevel {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private generateReason(level: PriorityLevel, factors: PriorityFactor[]): string {
    // Find the most influential factor
    const deadlineFactor = factors.find((f) => f.name === 'deadline');

    if (deadlineFactor) {
      if (deadlineFactor.explanation === 'Overdue') {
        return 'High: Overdue';
      }
      if (deadlineFactor.explanation === 'Due within 24 hours') {
        return 'High: Due within 24 hours';
      }
      if (deadlineFactor.explanation.startsWith('Due in')) {
        const match = deadlineFactor.explanation.match(/Due in (\d+) days/);
        if (match) {
          const days = parseInt(match[1]);
          if (days <= 7) {
            return `${level.charAt(0).toUpperCase() + level.slice(1)}: ${deadlineFactor.explanation}`;
          }
        }
      }
    }

    // Default reasons
    switch (level) {
      case 'high':
        return 'High: Urgent task';
      case 'medium':
        return 'Medium: Standard priority';
      case 'low':
        return 'Low: No immediate deadline';
    }
  }
}

/**
 * Apply a manual priority override to a task
 * Returns the update object to be applied via TaskStore.update()
 */
export function createPriorityOverride(
  newPriority: PriorityLevel
): { priority: PriorityLevel; priorityReason: string } {
  return {
    priority: newPriority,
    priorityReason: `User override: ${newPriority}`,
  };
}

// Singleton instance
let priorityEngineInstance: PriorityEngine | null = null;

export function getPriorityEngine(): PriorityEngine {
  if (!priorityEngineInstance) {
    priorityEngineInstance = new PriorityEngine();
  }
  return priorityEngineInstance;
}
