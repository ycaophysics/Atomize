"use server";

import { redirect } from "next/navigation";
import { getStore } from "@/lib/storage";
import { generateBreakdown } from "@/lib/llm/breakdown";
import type { Horizon, Importance, Urgency } from "@/lib/types";

function parseLabel<T extends string>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  return value as T;
}

export async function createTaskAction(formData: FormData) {
  const store = await getStore();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    throw new Error("Title is required");
  }
  const importance = parseLabel<Importance>(formData.get("importance"), "unknown");
  const urgency = parseLabel<Urgency>(formData.get("urgency"), "unknown");
  const horizon = parseLabel<Horizon>(formData.get("horizon"), "unknown");
  const estMinutesRaw = formData.get("est_minutes");
  const estMinutes =
    typeof estMinutesRaw === "string" && estMinutesRaw ? Number(estMinutesRaw) : null;

  const task = await store.createTask({
    title,
    importance,
    urgency,
    horizon,
    estMinutes: estMinutes && !Number.isNaN(estMinutes) ? estMinutes : null
  });

  redirect(`/tasks/${task.id}`);
}

export async function updateTaskLabelsAction(formData: FormData) {
  const store = await getStore();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) {
    throw new Error("Task id is required");
  }
  const importance = parseLabel<Importance>(formData.get("importance"), "unknown");
  const urgency = parseLabel<Urgency>(formData.get("urgency"), "unknown");
  const horizon = parseLabel<Horizon>(formData.get("horizon"), "unknown");
  await store.updateTask(taskId, { importance, urgency, horizon });
  redirect(`/tasks/${taskId}`);
}

export async function generateBreakdownAction(formData: FormData) {
  const store = await getStore();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) {
    throw new Error("Task id is required");
  }
  const task = await store.getTask(taskId);
  if (!task) {
    throw new Error("Task not found");
  }
  const preferences = await store.getPreferences();
  const existing = await store.listSubtasks(taskId);
  const nextVersion =
    existing.length === 0 ? 1 : Math.max(...existing.map((s) => s.sourceVersion)) + 1;

  const breakdown = await generateBreakdown({
    task,
    preferences
  });

  const subtasks = breakdown.subtasks.map((subtask, index) => ({
    taskId: task.id,
    title: subtask.title,
    estMinutes: subtask.estMinutes,
    tinyFirstStep: subtask.tinyFirstStep,
    dependencyId: subtask.dependencyId ?? null,
    order: index,
    sourceVersion: nextVersion
  }));

  await store.createSubtasks(subtasks);
  await store.createInteraction("breakdown_generated", {
    taskId: task.id,
    model: breakdown.model,
    count: subtasks.length
  });

  redirect(`/tasks/${taskId}`);
}
