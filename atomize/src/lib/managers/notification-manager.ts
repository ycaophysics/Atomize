export type NotificationFrequency = 'off' | 'minimal' | 'normal' | 'frequent';

export interface Notification {
  id: string;
  taskId: string;
  type: 'reminder' | 'check_in' | 'celebration';
  message: string;
  scheduledTime: Date;
  status: 'pending' | 'sent' | 'snoozed' | 'dismissed';
  snoozeCount: number;
}

export interface NotificationPreferences {
  frequency: NotificationFrequency;
  quietHours?: { start: string; end: string };
  celebrationsEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  frequency: 'normal',
  celebrationsEnabled: true,
};

const STORAGE_KEY = 'atomize_notifications';
const PREFS_KEY = 'atomize_notification_prefs';

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Schedule a reminder for a task
   */
  scheduleReminder(taskId: string, time: Date, message: string): string {
    const id = crypto.randomUUID();
    const notification: Notification = {
      id,
      taskId,
      type: 'reminder',
      message,
      scheduledTime: time,
      status: 'pending',
      snoozeCount: 0,
    };

    this.notifications.set(id, notification);
    this.scheduleNotificationTimer(notification);
    this.saveToStorage();

    return id;
  }

  /**
   * Get all pending notifications
   */
  getPendingNotifications(): Notification[] {
    return Array.from(this.notifications.values()).filter(
      (n) => n.status === 'pending' || n.status === 'snoozed'
    );
  }

  /**
   * Get notifications for a specific task
   */
  getNotificationsForTask(taskId: string): Notification[] {
    return Array.from(this.notifications.values()).filter((n) => n.taskId === taskId);
  }

  /**
   * Snooze a notification
   */
  snoozeNotification(notificationId: string, minutes: number): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Clear existing timer
    const existingTimer = this.timers.get(notificationId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Update notification
    notification.status = 'snoozed';
    notification.snoozeCount++;
    notification.scheduledTime = new Date(Date.now() + minutes * 60 * 1000);

    // Reschedule
    this.scheduleNotificationTimer(notification);
    this.saveToStorage();
  }

  /**
   * Dismiss a notification
   */
  dismissNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Clear timer
    const timer = this.timers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(notificationId);
    }

    notification.status = 'dismissed';
    this.saveToStorage();
  }

  /**
   * Cancel all notifications for a task
   */
  cancelNotificationsForTask(taskId: string): void {
    const taskNotifications = this.getNotificationsForTask(taskId);
    for (const notification of taskNotifications) {
      this.dismissNotification(notification.id);
    }
  }

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Set notification preferences
   */
  setPreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    this.savePreferences();
  }

  /**
   * Check if a notification should be sent based on preferences
   */
  shouldSendNotification(): boolean {
    if (this.preferences.frequency === 'off') {
      return false;
    }

    // Check quiet hours
    if (this.preferences.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = this.preferences.quietHours;

      if (start <= end) {
        // Normal range (e.g., 22:00 to 07:00 doesn't wrap)
        if (currentTime >= start && currentTime <= end) {
          return false;
        }
      } else {
        // Wrapping range (e.g., 22:00 to 07:00)
        if (currentTime >= start || currentTime <= end) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get snooze count for a notification (for offering to break down task)
   */
  getSnoozeCount(notificationId: string): number {
    return this.notifications.get(notificationId)?.snoozeCount || 0;
  }

  /**
   * Check if task has been repeatedly snoozed (3+ times)
   */
  isRepeatedlySnoozed(taskId: string): boolean {
    const taskNotifications = this.getNotificationsForTask(taskId);
    return taskNotifications.some((n) => n.snoozeCount >= 3);
  }

  private scheduleNotificationTimer(notification: Notification): void {
    const delay = notification.scheduledTime.getTime() - Date.now();

    if (delay <= 0) {
      // Already past, mark as sent
      notification.status = 'sent';
      return;
    }

    const timer = setTimeout(() => {
      if (this.shouldSendNotification()) {
        notification.status = 'sent';
        this.triggerNotification(notification);
      }
      this.timers.delete(notification.id);
      this.saveToStorage();
    }, delay);

    this.timers.set(notification.id, timer);
  }

  private triggerNotification(notification: Notification): void {
    // In a real app, this would use the Web Notifications API
    // For now, we'll just log it
    console.log('Notification triggered:', notification.message);

    // Request permission and show notification if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Atomize', {
          body: notification.message,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Atomize', {
              body: notification.message,
              icon: '/favicon.ico',
            });
          }
        });
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const notifications = JSON.parse(data) as Notification[];
        for (const n of notifications) {
          n.scheduledTime = new Date(n.scheduledTime);
          this.notifications.set(n.id, n);

          // Reschedule pending notifications
          if (n.status === 'pending' || n.status === 'snoozed') {
            this.scheduleNotificationTimer(n);
          }
        }
      }

      const prefsData = localStorage.getItem(PREFS_KEY);
      if (prefsData) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(prefsData) };
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const notifications = Array.from(this.notifications.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }
}
