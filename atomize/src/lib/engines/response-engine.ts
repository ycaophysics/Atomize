import type { Task, PriorityLevel } from '@/lib/types';

export interface DayStats {
  completedToday: number;
  totalToday: number;
  streak: number;
}

export interface Achievement {
  type: 'task_complete' | 'day_complete' | 'streak' | 'milestone';
  details: {
    taskTitle?: string;
    count?: number;
    streakDays?: number;
  };
}

export interface Decision {
  type: 'priority' | 'schedule' | 'atomization';
  input: unknown;
  output: unknown;
}

// Varied celebration messages
const TASK_COMPLETE_MESSAGES = [
  'Nice work! ✨',
  'Done! 🎯',
  'Crushed it! 💪',
  'One down! ✅',
  'Great job! 🌟',
  'Boom! Task complete! 🚀',
  'You got this! ✨',
  'Progress! 📈',
  'Knocked it out! 🎉',
  'Well done! 👏',
];

const DAY_COMPLETE_MESSAGES = [
  "You did it! All tasks done for today! 🎉",
  "Amazing! You've completed everything! 🏆",
  "What a day! All done! 🌟",
  "Incredible work today! You're on fire! 🔥",
  "All tasks complete! Time to relax! 😌",
  "100% done! You're a productivity machine! 💪",
];

const STREAK_MESSAGES: Record<number, string> = {
  3: "3 days in a row! You're building momentum! 🔥",
  5: "5 day streak! You're on a roll! 🎯",
  7: "A whole week! Incredible consistency! 🏆",
  14: "Two weeks strong! You're unstoppable! 💪",
  30: "30 days! You've built a real habit! 🌟",
};

const CHECK_IN_MESSAGES = [
  "Ready to tackle the next one?",
  "What would you like to work on?",
  "Shall we get started?",
  "Pick up where you left off?",
  "Time to make some progress?",
];

const GENTLE_REMINDER_MESSAGES = [
  "Hey! Just checking in. Ready to continue?",
  "Taking a break? No rush, just here when you need me.",
  "Whenever you're ready, I'm here to help.",
  "Need a hand getting started?",
];

export class ResponseEngine {
  private messageIndex = 0;

  /**
   * Generate response for task creation
   */
  generateTaskCreatedResponse(task: Task): string {
    const priorityEmoji = this.getPriorityEmoji(task.priority);
    let response = `Got it! I've added "${task.title}" ${priorityEmoji}\n`;

    if (task.deadline) {
      response += `\n⏰ Due: ${this.formatDate(task.deadline)}`;
    }

    if (task.estimatedMinutes) {
      response += `\n⏱️ Estimated: ${task.estimatedMinutes} minutes`;
    }

    if (task.priorityReason) {
      response += `\n${priorityEmoji} ${task.priorityReason}`;
    }

    return response;
  }

  /**
   * Generate response for task completion
   */
  generateCompletionResponse(task: Task, stats: DayStats): string {
    const celebration = this.getRandomMessage(TASK_COMPLETE_MESSAGES);
    let response = `${celebration} "${task.title}" is done!\n`;

    // Progress update
    response += `\n📊 ${stats.completedToday} of ${stats.totalToday} tasks done today`;

    // Streak mention
    if (stats.streak > 1) {
      response += `\n🔥 ${stats.streak} day streak!`;
    }

    // All done celebration
    if (stats.completedToday === stats.totalToday && stats.totalToday > 0) {
      response += `\n\n${this.getRandomMessage(DAY_COMPLETE_MESSAGES)}`;
    }

    return response;
  }

  /**
   * Generate check-in message
   */
  generateCheckIn(task: Task): string {
    const checkIn = this.getRandomMessage(CHECK_IN_MESSAGES);
    return `${checkIn}\n\nNext up: "${task.title}"`;
  }

  /**
   * Generate gentle reminder
   */
  generateGentleReminder(task?: Task): string {
    const reminder = this.getRandomMessage(GENTLE_REMINDER_MESSAGES);
    if (task) {
      return `${reminder}\n\nYou were working on: "${task.title}"`;
    }
    return reminder;
  }

  /**
   * Generate celebration message
   */
  generateCelebration(achievement: Achievement): string {
    switch (achievement.type) {
      case 'task_complete':
        return this.getRandomMessage(TASK_COMPLETE_MESSAGES);

      case 'day_complete':
        return this.getRandomMessage(DAY_COMPLETE_MESSAGES);

      case 'streak': {
        const days = achievement.details.streakDays || 0;
        // Check for milestone streaks
        for (const [milestone, message] of Object.entries(STREAK_MESSAGES)) {
          if (days === parseInt(milestone)) {
            return message;
          }
        }
        return `${days} day streak! Keep it going! 🔥`;
      }

      case 'milestone': {
        const count = achievement.details.count || 0;
        if (count === 10) return "10 tasks completed! You're making great progress! 🎯";
        if (count === 50) return "50 tasks done! You're a productivity pro! 🏆";
        if (count === 100) return "100 tasks! Incredible achievement! 🌟";
        return `${count} tasks completed! Amazing! 🎉`;
      }

      default:
        return 'Great job! 🎉';
    }
  }

  /**
   * Generate explanation for a decision
   */
  generateExplanation(decision: Decision): string {
    switch (decision.type) {
      case 'priority': {
        const output = decision.output as { level: PriorityLevel; reason: string };
        return `I set this as ${output.level} priority because: ${output.reason}`;
      }

      case 'schedule': {
        const output = decision.output as { date: Date; reason: string };
        return `I scheduled this for ${this.formatDate(output.date)} because: ${output.reason}`;
      }

      case 'atomization': {
        const output = decision.output as { taskCount: number };
        return `I broke this down into ${output.taskCount} smaller tasks to make it more manageable.`;
      }

      default:
        return 'This was based on your task details and deadlines.';
    }
  }

  /**
   * Generate "why" explanation for a suggestion
   */
  generateWhyExplanation(task: Task): string {
    const reasons: string[] = [];

    if (task.deadline) {
      const daysUntil = Math.ceil(
        (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 1) {
        reasons.push("it's due very soon");
      } else if (daysUntil <= 7) {
        reasons.push(`it's due in ${daysUntil} days`);
      }
    }

    if (task.priority === 'high') {
      reasons.push("it's marked as high priority");
    }

    if (task.parentId) {
      reasons.push("it's part of a larger task you're working on");
    }

    if (reasons.length === 0) {
      return `I suggested "${task.title}" because it's next in your queue.`;
    }

    return `I suggested "${task.title}" because ${reasons.join(' and ')}.`;
  }

  /**
   * Generate supportive message for broken streak
   */
  generateStreakBrokenMessage(previousStreak: number): string {
    if (previousStreak >= 7) {
      return `Your ${previousStreak}-day streak ended, but that's okay! Every day is a fresh start. Ready to begin a new one? 💪`;
    }
    return "Starting fresh today! Let's build some momentum. 🌱";
  }

  /**
   * Generate message for deferred task
   */
  generateDeferMessage(task: Task): string {
    return `No problem! I've moved "${task.title}" to tomorrow. Plans change, and that's totally fine. 👍`;
  }

  private getRandomMessage(messages: string[]): string {
    // Use a rotating index to ensure variety
    const message = messages[this.messageIndex % messages.length];
    this.messageIndex++;
    return message;
  }

  private getPriorityEmoji(priority: PriorityLevel): string {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
    }
  }

  private formatDate(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
