import type {
  Interaction,
  Preferences,
  Subtask,
  SubtaskStatus,
  Task,
  TaskStatus
} from "@/lib/types";

export type TaskInput = Omit<Task, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: TaskStatus;
};

export type SubtaskInput = Omit<
  Subtask,
  "id" | "createdAt" | "updatedAt" | "status" | "sourceVersion"
> & {
  status?: SubtaskStatus;
  sourceVersion?: number;
};

export type Store = {
  init: () => Promise<void>;
  listTasks: () => Promise<Task[]>;
  getTask: (id: string) => Promise<Task | null>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<Task>;
  listSubtasks: (taskId?: string) => Promise<Subtask[]>;
  createSubtasks: (inputs: SubtaskInput[]) => Promise<Subtask[]>;
  updateSubtask: (id: string, patch: Partial<Subtask>) => Promise<Subtask>;
  getPreferences: () => Promise<Preferences>;
  updatePreferences: (patch: Partial<Preferences>) => Promise<Preferences>;
  createInteraction: (eventType: string, payload: Record<string, unknown>) => Promise<Interaction>;
};
