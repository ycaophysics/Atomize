export type Importance = "important" | "not_important" | "unknown";
export type Urgency = "urgent" | "not_urgent" | "unknown";
export type Horizon = "near_term" | "long_term" | "unknown";

export type TaskStatus = "active" | "completed" | "archived";
export type SubtaskStatus = "pending" | "started" | "finished" | "skipped";

export type Task = {
  id: string;
  title: string;
  importance: Importance;
  urgency: Urgency;
  horizon: Horizon;
  status: TaskStatus;
  deadlineAt?: string | null;
  recurrence?: string | null;
  domain?: string | null;
  energy?: string | null;
  locationReq?: string | null;
  estMinutes?: number | null;
  hardness?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  estMinutes: number;
  tinyFirstStep: string;
  dependencyId?: string | null;
  order: number;
  status: SubtaskStatus;
  sourceVersion: number;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Preferences = {
  id: string;
  breakdownDepth: "light" | "standard" | "detailed";
  stepSize: "short" | "default" | "long";
  stylePreset: "executive" | "adhd" | "balanced";
  nudgeStyle: "neutral" | "encouraging" | "direct";
  model: string;
  createdAt: string;
  updatedAt: string;
};

export type Interaction = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type SubtaskWithTask = Subtask & {
  taskTitle: string;
  taskImportance: Importance;
  taskUrgency: Urgency;
  taskHorizon: Horizon;
};
