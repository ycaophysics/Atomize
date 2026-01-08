import fs from "fs/promises";
import path from "path";
import { config } from "@/lib/config";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/time";
import type { Interaction, Preferences, Subtask, Task } from "@/lib/types";
import type { Store, SubtaskInput, TaskInput } from "@/lib/storage/store";

type JsonDb = {
  version: number;
  tasks: Task[];
  subtasks: Subtask[];
  preferences: Preferences;
  interactions: Interaction[];
};

const defaultPreferences: Preferences = {
  id: "default",
  breakdownDepth: "standard",
  stepSize: "default",
  stylePreset: "balanced",
  nudgeStyle: "neutral",
  model: config.geminiModel,
  createdAt: nowIso(),
  updatedAt: nowIso()
};

async function readDb(): Promise<JsonDb> {
  const filePath = path.resolve(config.dataFile);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as JsonDb;
  } catch (error) {
    const empty: JsonDb = {
      version: 1,
      tasks: [],
      subtasks: [],
      preferences: defaultPreferences,
      interactions: []
    };
    await writeDb(empty);
    return empty;
  }
}

async function writeDb(db: JsonDb): Promise<void> {
  const filePath = path.resolve(config.dataFile);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(db, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
}

export function createJsonStore(): Store {
  return {
    async init() {
      await readDb();
    },
    async listTasks() {
      const db = await readDb();
      return db.tasks;
    },
    async getTask(id) {
      const db = await readDb();
      return db.tasks.find((task) => task.id === id) ?? null;
    },
    async createTask(input: TaskInput) {
      const db = await readDb();
      const now = nowIso();
      const task: Task = {
        id: newId(),
        title: input.title,
        importance: input.importance,
        urgency: input.urgency,
        horizon: input.horizon,
        status: input.status ?? "active",
        deadlineAt: input.deadlineAt ?? null,
        recurrence: input.recurrence ?? null,
        domain: input.domain ?? null,
        energy: input.energy ?? null,
        locationReq: input.locationReq ?? null,
        estMinutes: input.estMinutes ?? null,
        hardness: input.hardness ?? null,
        createdAt: now,
        updatedAt: now
      };
      db.tasks.push(task);
      await writeDb(db);
      return task;
    },
    async updateTask(id, patch) {
      const db = await readDb();
      const index = db.tasks.findIndex((task) => task.id === id);
      if (index < 0) {
        throw new Error("Task not found");
      }
      const updated = { ...db.tasks[index], ...patch, updatedAt: nowIso() };
      db.tasks[index] = updated;
      await writeDb(db);
      return updated;
    },
    async listSubtasks(taskId) {
      const db = await readDb();
      const list = taskId ? db.subtasks.filter((s) => s.taskId === taskId) : db.subtasks;
      return list.sort((a, b) => a.order - b.order);
    },
    async createSubtasks(inputs: SubtaskInput[]) {
      const db = await readDb();
      const now = nowIso();
      const next = inputs.map((input, index) => ({
        id: newId(),
        taskId: input.taskId,
        title: input.title,
        estMinutes: input.estMinutes,
        tinyFirstStep: input.tinyFirstStep,
        dependencyId: input.dependencyId ?? null,
        order: input.order ?? index,
        status: input.status ?? "pending",
        sourceVersion: input.sourceVersion ?? 1,
        snoozedUntil: input.snoozedUntil ?? null,
        createdAt: now,
        updatedAt: now
      }));
      db.subtasks.push(...next);
      await writeDb(db);
      return next;
    },
    async updateSubtask(id, patch) {
      const db = await readDb();
      const index = db.subtasks.findIndex((subtask) => subtask.id === id);
      if (index < 0) {
        throw new Error("Subtask not found");
      }
      const updated = { ...db.subtasks[index], ...patch, updatedAt: nowIso() };
      db.subtasks[index] = updated;
      await writeDb(db);
      return updated;
    },
    async getPreferences() {
      const db = await readDb();
      return db.preferences;
    },
    async updatePreferences(patch) {
      const db = await readDb();
      const updated = { ...db.preferences, ...patch, updatedAt: nowIso() };
      db.preferences = updated;
      await writeDb(db);
      return updated;
    },
    async createInteraction(eventType, payload) {
      const db = await readDb();
      const interaction: Interaction = {
        id: newId(),
        eventType,
        payload,
        createdAt: nowIso()
      };
      db.interactions.push(interaction);
      await writeDb(db);
      return interaction;
    }
  };
}
