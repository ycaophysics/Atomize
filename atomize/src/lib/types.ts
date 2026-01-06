// Core Task Types

export type PriorityLevel = 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'deferred' | 'archived';

export type HistoryAction = 'created' | 'updated' | 'completed' | 'deferred' | 'rescheduled';

export interface TaskHistoryEntry {
  timestamp: Date;
  action: HistoryAction;
  details: string;
  previousValue?: unknown;
  newValue?: unknown;
}

export interface TaskContext {
  originalGoal?: string;
  parentContext?: string;
  notes: string[];
  relatedTaskIds: string[];
}

export interface Task {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Content
  title: string;
  description?: string;
  rawInput: string;

  // Hierarchy
  parentId?: string;
  childIds: string[];

  // Scheduling
  deadline?: Date;
  scheduledDate?: Date;
  estimatedMinutes?: number;

  // Classification
  priority: PriorityLevel;
  priorityReason: string;
  status: TaskStatus;

  // Context preservation
  context: TaskContext;

  // History (append-only)
  history: TaskHistoryEntry[];
}

// Input/Update Types

export interface TaskInput {
  rawInput: string;
  title?: string;
  description?: string;
  parentId?: string;
  deadline?: Date;
  scheduledDate?: Date;
  estimatedMinutes?: number;
  priority?: PriorityLevel;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  deadline?: Date;
  priority?: PriorityLevel;
  priorityReason?: string;
  scheduledDate?: Date;
  estimatedMinutes?: number;
  status?: TaskStatus;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: PriorityLevel[];
  dateRange?: { start: Date; end: Date };
  parentId?: string;
  scheduledDate?: Date;
}

// Serialization types for JSON export/import
export interface SerializedTask {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description?: string;
  rawInput: string;
  parentId?: string;
  childIds: string[];
  deadline?: string;
  scheduledDate?: string;
  estimatedMinutes?: number;
  priority: PriorityLevel;
  priorityReason: string;
  status: TaskStatus;
  context: TaskContext;
  history: SerializedTaskHistoryEntry[];
}

export interface SerializedTaskHistoryEntry {
  timestamp: string;
  action: HistoryAction;
  details: string;
  previousValue?: unknown;
  newValue?: unknown;
}

// Utility functions for serialization
export function serializeTask(task: Task): SerializedTask {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    deadline: task.deadline?.toISOString(),
    scheduledDate: task.scheduledDate?.toISOString(),
    history: task.history.map((h) => ({
      ...h,
      timestamp: h.timestamp.toISOString(),
    })),
  };
}

export function deserializeTask(data: SerializedTask): Task {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    deadline: data.deadline ? new Date(data.deadline) : undefined,
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
    history: data.history.map((h) => ({
      ...h,
      timestamp: new Date(h.timestamp),
    })),
  };
}

// Validation helpers
export function isValidPriority(value: unknown): value is PriorityLevel {
  return value === 'high' || value === 'medium' || value === 'low';
}

export function isValidTaskStatus(value: unknown): value is TaskStatus {
  return (
    value === 'pending' ||
    value === 'in_progress' ||
    value === 'completed' ||
    value === 'deferred' ||
    value === 'archived'
  );
}
