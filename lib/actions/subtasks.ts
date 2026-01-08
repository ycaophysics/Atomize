"use server";

import { redirect } from "next/navigation";
import { getStore } from "@/lib/storage";
import { applyNotFinished, snoozeSubtask } from "@/lib/replan";
import { addMinutesIso } from "@/lib/time";
import { config } from "@/lib/config";

export async function markSubtaskStartedAction(formData: FormData) {
  const store = await getStore();
  const subtaskId = String(formData.get("subtaskId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  if (!subtaskId) {
    throw new Error("Subtask id is required");
  }
  await store.updateSubtask(subtaskId, { status: "started" });
  redirect(redirectTo || "/");
}

export async function markSubtaskFinishedAction(formData: FormData) {
  const store = await getStore();
  const subtaskId = String(formData.get("subtaskId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  if (!subtaskId) {
    throw new Error("Subtask id is required");
  }
  await store.updateSubtask(subtaskId, { status: "finished" });
  redirect(redirectTo || "/");
}

export async function markSubtaskNotFinishedAction(formData: FormData) {
  const subtaskId = String(formData.get("subtaskId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  if (!subtaskId) {
    throw new Error("Subtask id is required");
  }
  await applyNotFinished(subtaskId);
  redirect(redirectTo || "/");
}

export async function snoozeSubtaskAction(formData: FormData) {
  const subtaskId = String(formData.get("subtaskId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  if (!subtaskId) {
    throw new Error("Subtask id is required");
  }
  const snoozedUntil = addMinutesIso(config.defaultSnoozeMinutes);
  await snoozeSubtask(subtaskId, snoozedUntil);
  redirect(redirectTo || "/");
}
