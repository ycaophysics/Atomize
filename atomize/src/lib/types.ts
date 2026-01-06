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
  parentId?: string;
  deadline?: Date;
  priority?: PriorityLevel;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  deadline?: Date;
  priority?: PriorityLevel;
  scheduledDate?: Date;
  estimatedMinutes?: number;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: PriorityLevel[];
  dateRange?: { start: Date; end: Date };
  parentId?: string;
}
