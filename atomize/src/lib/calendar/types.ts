/**
 * Calendar Integration Types
 * Requirement 19.1: Calendar event interface
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  recurrence?: RecurrenceRule;
  source: 'google' | 'outlook' | 'apple' | 'local';
  sourceId?: string; // ID from the external calendar
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: Date;
  count?: number;
  byDay?: string[]; // e.g., ['MO', 'WE', 'FR']
}

export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
  isFree: boolean;
}

export interface WorkingHours {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  days: number[]; // 0-6, Sunday = 0
}

export interface CalendarPreferences {
  workingHours: WorkingHours;
  bufferMinutes: number; // Buffer between events
  minSlotMinutes: number; // Minimum slot size to consider
  blockedTimes: BlockedTime[];
}

export interface BlockedTime {
  id: string;
  title: string;
  start: Date;
  end: Date;
  recurring?: RecurrenceRule;
}

export interface ScheduleConflict {
  taskId: string;
  eventId: string;
  taskTitle: string;
  eventTitle: string;
  conflictStart: Date;
  conflictEnd: Date;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  type: 'reschedule' | 'split' | 'defer' | 'ignore';
  newStart?: Date;
  newEnd?: Date;
  explanation: string;
}

export interface CalendarSyncResult {
  success: boolean;
  eventsAdded: number;
  eventsUpdated: number;
  eventsRemoved: number;
  conflicts: ScheduleConflict[];
  error?: string;
}
