import type { Task } from '@/lib/types';
import { TaskStore } from '@/lib/store';

export interface DayProgress {
  date: string; // YYYY-MM-DD
  completedCount: number;
  totalCount: number;
  completedTaskIds: string[];
}

export interface ProgressStats {
  today: DayProgress;
  streak: number;
  totalCompleted: number;
  completionRate: number; // 0-1
}

export class ProgressManager {
  private store: TaskStore;

  constructor(store: TaskStore) {
    this.store = store;
  }

  /**
   * Get progress stats including streak
   */
  getProgressStats(): ProgressStats {
    const today = this.getTodayProgress();
    const streak = this.calculateStreak();
    const allTasks = this.store.getAll();
    const totalCompleted = allTasks.filter((t) => t.status === 'completed').length;
    const completionRate = allTasks.length > 0 ? totalCompleted / allTasks.length : 0;

    return {
      today,
      streak,
      totalCompleted,
      completionRate,
    };
  }

  /**
   * Get today's progress
   */
  getTodayProgress(): DayProgress {
    const today = this.formatDate(new Date());
    const allTasks = this.store.getAll();

    // Get tasks that were scheduled for today or completed today
    const todayTasks = allTasks.filter((task) => {
      // Check if scheduled for today
      if (task.scheduledDate) {
        const scheduledDate = this.formatDate(new Date(task.scheduledDate));
        if (scheduledDate === today) return true;
      }

      // Check if completed today
      if (task.status === 'completed') {
        const completedEntry = task.history.find((h) => h.action === 'completed');
        if (completedEntry) {
          const completedDate = this.formatDate(new Date(completedEntry.timestamp));
          if (completedDate === today) return true;
        }
      }

      return false;
    });

    const completedTasks = todayTasks.filter((t) => t.status === 'completed');

    return {
      date: today,
      completedCount: completedTasks.length,
      totalCount: todayTasks.length,
      completedTaskIds: completedTasks.map((t) => t.id),
    };
  }

  /**
   * Calculate current streak (consecutive days with at least one completion)
   */
  calculateStreak(): number {
    const completionDates = this.getCompletionDates();
    if (completionDates.length === 0) return 0;

    // Sort dates in descending order (most recent first)
    const sortedDates = [...completionDates].sort((a, b) => b.localeCompare(a));

    const today = this.formatDate(new Date());
    const yesterday = this.formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    // Check if streak is active (completed today or yesterday)
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0; // Streak broken
    }

    // Count consecutive days
    let streak = 0;
    let currentDate = sortedDates[0] === today ? today : yesterday;

    for (const date of sortedDates) {
      if (date === currentDate) {
        streak++;
        // Move to previous day
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        currentDate = this.formatDate(prevDate);
      } else if (date < currentDate) {
        // Gap in dates, streak ends
        break;
      }
      // If date > currentDate, skip (duplicate or future date)
    }

    return streak;
  }

  /**
   * Get progress for a specific date
   */
  getProgressForDate(date: Date): DayProgress {
    const dateStr = this.formatDate(date);
    const allTasks = this.store.getAll();

    const dayTasks = allTasks.filter((task) => {
      // Check if scheduled for this date
      if (task.scheduledDate) {
        const scheduledDate = this.formatDate(new Date(task.scheduledDate));
        if (scheduledDate === dateStr) return true;
      }

      // Check if completed on this date
      if (task.status === 'completed') {
        const completedEntry = task.history.find((h) => h.action === 'completed');
        if (completedEntry) {
          const completedDate = this.formatDate(new Date(completedEntry.timestamp));
          if (completedDate === dateStr) return true;
        }
      }

      return false;
    });

    const completedTasks = dayTasks.filter((t) => t.status === 'completed');

    return {
      date: dateStr,
      completedCount: completedTasks.length,
      totalCount: dayTasks.length,
      completedTaskIds: completedTasks.map((t) => t.id),
    };
  }

  /**
   * Get weekly progress summary
   */
  getWeeklyProgress(): DayProgress[] {
    const progress: DayProgress[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      progress.push(this.getProgressForDate(date));
    }

    return progress;
  }

  /**
   * Check if all tasks for today are complete
   */
  isAllDoneToday(): boolean {
    const today = this.getTodayProgress();
    return today.totalCount > 0 && today.completedCount === today.totalCount;
  }

  /**
   * Get unique dates when tasks were completed
   */
  private getCompletionDates(): string[] {
    const allTasks = this.store.getAll();
    const dates = new Set<string>();

    for (const task of allTasks) {
      if (task.status === 'completed') {
        const completedEntry = task.history.find((h) => h.action === 'completed');
        if (completedEntry) {
          dates.add(this.formatDate(new Date(completedEntry.timestamp)));
        }
      }
    }

    return Array.from(dates);
  }

  /**
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
