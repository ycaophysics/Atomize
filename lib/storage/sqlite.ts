/* eslint-disable @typescript-eslint/no-var-requires */
import { config } from "@/lib/config";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/time";
import type { Interaction, Preferences, Subtask, Task } from "@/lib/types";
import type { Store, SubtaskInput, TaskInput } from "@/lib/storage/store";

type DatabaseType = {
  prepare: (sql: string) => {
    run: (...params: unknown[]) => { changes: number };
    get: (...params: unknown[]) => Record<string, unknown> | undefined;
    all: (...params: unknown[]) => Record<string, unknown>[];
  };
  pragma: (value: string) => void;
  close: () => void;
};

function loadDatabase(): DatabaseType {
  let Database;
  try {
    Database = require("better-sqlite3");
  } catch (error) {
    throw new Error("better-sqlite3 is not installed");
  }
  return new Database(config.sqlitePath) as DatabaseType;
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    importance: row.importance as Task["importance"],
    urgency: row.urgency as Task["urgency"],
    horizon: row.horizon as Task["horizon"],
    status: row.status as Task["status"],
    deadlineAt: row.deadlineAt as string | null,
    recurrence: row.recurrence as string | null,
    domain: row.domain as string | null,
    energy: row.energy as string | null,
    locationReq: row.locationReq as string | null,
    estMinutes: row.estMinutes as number | null,
    hardness: row.hardness as number | null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  };
}

function rowToSubtask(row: Record<string, unknown>): Subtask {
  return {
    id: String(row.id),
    taskId: String(row.taskId),
    title: String(row.title),
    estMinutes: Number(row.estMinutes),
    tinyFirstStep: String(row.tinyFirstStep),
    dependencyId: row.dependencyId as string | null,
    order: Number(row.orderIndex),
    status: row.status as Subtask["status"],
    sourceVersion: Number(row.sourceVersion),
    snoozedUntil: row.snoozedUntil as string | null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  };
}

function rowToPreferences(row: Record<string, unknown>): Preferences {
  return {
    id: String(row.id),
    breakdownDepth: row.breakdownDepth as Preferences["breakdownDepth"],
    stepSize: row.stepSize as Preferences["stepSize"],
    stylePreset: row.stylePreset as Preferences["stylePreset"],
    nudgeStyle: row.nudgeStyle as Preferences["nudgeStyle"],
    model: String(row.model),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt)
  };
}

export function createSqliteStore(): Store {
  const db = loadDatabase();

  const tasksAll = db.prepare("SELECT * FROM tasks");
  const tasksGet = db.prepare("SELECT * FROM tasks WHERE id = ?");
  const tasksInsert = db.prepare(`
    INSERT INTO tasks (
      id, title, importance, urgency, horizon, status, deadlineAt, recurrence,
      domain, energy, locationReq, estMinutes, hardness, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tasksUpdate = db.prepare(`
    UPDATE tasks SET
      title = ?, importance = ?, urgency = ?, horizon = ?, status = ?,
      deadlineAt = ?, recurrence = ?, domain = ?, energy = ?, locationReq = ?,
      estMinutes = ?, hardness = ?, updatedAt = ?
    WHERE id = ?
  `);

  const subtasksAll = db.prepare("SELECT * FROM subtasks");
  const subtasksByTask = db.prepare("SELECT * FROM subtasks WHERE taskId = ? ORDER BY orderIndex ASC");
  const subtasksInsert = db.prepare(`
    INSERT INTO subtasks (
      id, taskId, title, estMinutes, tinyFirstStep, dependencyId, orderIndex,
      status, sourceVersion, snoozedUntil, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const subtasksUpdate = db.prepare(`
    UPDATE subtasks SET
      title = ?, estMinutes = ?, tinyFirstStep = ?, dependencyId = ?, orderIndex = ?,
      status = ?, sourceVersion = ?, snoozedUntil = ?, updatedAt = ?
    WHERE id = ?
  `);

  const prefsGet = db.prepare("SELECT * FROM preferences WHERE id = 'default'");
  const prefsInsert = db.prepare(`
    INSERT INTO preferences (
      id, breakdownDepth, stepSize, stylePreset, nudgeStyle, model, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const prefsUpdate = db.prepare(`
    UPDATE preferences SET
      breakdownDepth = ?, stepSize = ?, stylePreset = ?, nudgeStyle = ?, model = ?, updatedAt = ?
    WHERE id = 'default'
  `);

  const interactionsInsert = db.prepare(`
    INSERT INTO interactions (id, eventType, payload, createdAt) VALUES (?, ?, ?, ?)
  `);

  return {
    async init() {
      db.pragma("journal_mode = WAL");
      db.prepare(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          importance TEXT NOT NULL,
          urgency TEXT NOT NULL,
          horizon TEXT NOT NULL,
          status TEXT NOT NULL,
          deadlineAt TEXT,
          recurrence TEXT,
          domain TEXT,
          energy TEXT,
          locationReq TEXT,
          estMinutes INTEGER,
          hardness INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `).run();
      db.prepare(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id TEXT PRIMARY KEY,
          taskId TEXT NOT NULL,
          title TEXT NOT NULL,
          estMinutes INTEGER NOT NULL,
          tinyFirstStep TEXT NOT NULL,
          dependencyId TEXT,
          orderIndex INTEGER NOT NULL,
          status TEXT NOT NULL,
          sourceVersion INTEGER NOT NULL,
          snoozedUntil TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `).run();
      db.prepare(`
        CREATE TABLE IF NOT EXISTS preferences (
          id TEXT PRIMARY KEY,
          breakdownDepth TEXT NOT NULL,
          stepSize TEXT NOT NULL,
          stylePreset TEXT NOT NULL,
          nudgeStyle TEXT NOT NULL,
          model TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `).run();
      db.prepare(`
        CREATE TABLE IF NOT EXISTS interactions (
          id TEXT PRIMARY KEY,
          eventType TEXT NOT NULL,
          payload TEXT NOT NULL,
          createdAt TEXT NOT NULL
        )
      `).run();

      const existingPrefs = prefsGet.get();
      if (!existingPrefs) {
        const now = nowIso();
        prefsInsert.run(
          "default",
          "standard",
          "default",
          "balanced",
          "neutral",
          config.geminiModel,
          now,
          now
        );
      }
    },
    async listTasks() {
      return tasksAll.all().map(rowToTask);
    },
    async getTask(id) {
      const row = tasksGet.get(id);
      return row ? rowToTask(row) : null;
    },
    async createTask(input: TaskInput) {
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
      tasksInsert.run(
        task.id,
        task.title,
        task.importance,
        task.urgency,
        task.horizon,
        task.status,
        task.deadlineAt,
        task.recurrence,
        task.domain,
        task.energy,
        task.locationReq,
        task.estMinutes,
        task.hardness,
        task.createdAt,
        task.updatedAt
      );
      return task;
    },
    async updateTask(id, patch) {
      const existing = await this.getTask(id);
      if (!existing) {
        throw new Error("Task not found");
      }
      const updated: Task = { ...existing, ...patch, updatedAt: nowIso() };
      tasksUpdate.run(
        updated.title,
        updated.importance,
        updated.urgency,
        updated.horizon,
        updated.status,
        updated.deadlineAt,
        updated.recurrence,
        updated.domain,
        updated.energy,
        updated.locationReq,
        updated.estMinutes,
        updated.hardness,
        updated.updatedAt,
        updated.id
      );
      return updated;
    },
    async listSubtasks(taskId) {
      const rows = taskId ? subtasksByTask.all(taskId) : subtasksAll.all();
      return rows.map(rowToSubtask);
    },
    async createSubtasks(inputs: SubtaskInput[]) {
      const now = nowIso();
      const created = inputs.map((input, index) => ({
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
      for (const subtask of created) {
        subtasksInsert.run(
          subtask.id,
          subtask.taskId,
          subtask.title,
          subtask.estMinutes,
          subtask.tinyFirstStep,
          subtask.dependencyId,
          subtask.order,
          subtask.status,
          subtask.sourceVersion,
          subtask.snoozedUntil,
          subtask.createdAt,
          subtask.updatedAt
        );
      }
      return created;
    },
    async updateSubtask(id, patch) {
      const all = await this.listSubtasks();
      const existing = all.find((subtask) => subtask.id === id);
      if (!existing) {
        throw new Error("Subtask not found");
      }
      const updated = { ...existing, ...patch, updatedAt: nowIso() };
      subtasksUpdate.run(
        updated.title,
        updated.estMinutes,
        updated.tinyFirstStep,
        updated.dependencyId,
        updated.order,
        updated.status,
        updated.sourceVersion,
        updated.snoozedUntil,
        updated.updatedAt,
        updated.id
      );
      return updated;
    },
    async getPreferences() {
      const row = prefsGet.get();
      if (!row) {
        throw new Error("Preferences missing");
      }
      return rowToPreferences(row);
    },
    async updatePreferences(patch) {
      const current = await this.getPreferences();
      const updated: Preferences = { ...current, ...patch, updatedAt: nowIso() };
      prefsUpdate.run(
        updated.breakdownDepth,
        updated.stepSize,
        updated.stylePreset,
        updated.nudgeStyle,
        updated.model,
        updated.updatedAt
      );
      return updated;
    },
    async createInteraction(eventType, payload) {
      const interaction: Interaction = {
        id: newId(),
        eventType,
        payload,
        createdAt: nowIso()
      };
      interactionsInsert.run(
        interaction.id,
        interaction.eventType,
        JSON.stringify(interaction.payload),
        interaction.createdAt
      );
      return interaction;
    }
  };
}
