import { getStore } from "@/lib/storage";
import { nowIso } from "@/lib/time";
import type { Subtask } from "@/lib/types";

type ReplanResult = {
  created: Subtask[];
  reason: string;
};

function buildTinyStep(title: string): string {
  return `Open notes and write a 1-line plan for: ${title}`;
}

export async function applyNotFinished(subtaskId: string): Promise<ReplanResult> {
  const store = await getStore();
  const all = await store.listSubtasks();
  const current = all.find((item) => item.id === subtaskId);
  if (!current) {
    throw new Error("Subtask not found");
  }

  const updated = await store.updateSubtask(current.id, { status: "skipped" });
  const nextOrder = updated.order + 1;
  const sourceVersion = updated.sourceVersion;

  if (updated.estMinutes >= 30) {
    const half = Math.max(10, Math.floor(updated.estMinutes / 2));
    const created = await store.createSubtasks([
      {
        taskId: updated.taskId,
        title: `Part 1: ${updated.title}`,
        estMinutes: half,
        tinyFirstStep: buildTinyStep(updated.title),
        order: nextOrder,
        sourceVersion
      },
      {
        taskId: updated.taskId,
        title: `Part 2: ${updated.title}`,
        estMinutes: half,
        tinyFirstStep: buildTinyStep(updated.title),
        order: nextOrder + 1,
        sourceVersion
      }
    ]);
    await store.createInteraction("replan_split", { subtaskId, created: created.length });
    return { created, reason: "Split into two smaller steps." };
  }

  if (updated.estMinutes >= 20) {
    const created = await store.createSubtasks([
      {
        taskId: updated.taskId,
        title: `10-minute version of ${updated.title}`,
        estMinutes: 10,
        tinyFirstStep: buildTinyStep(updated.title),
        order: nextOrder,
        sourceVersion
      }
    ]);
    await store.createInteraction("replan_shrink", { subtaskId, created: created.length });
    return { created, reason: "Shrunk to a 10-minute version." };
  }

  const created = await store.createSubtasks([
    {
      taskId: updated.taskId,
      title: `Outline approach for ${updated.title}`,
      estMinutes: 8,
      tinyFirstStep: "Open a blank doc and list 3 bullets.",
      order: nextOrder,
      sourceVersion
    }
  ]);
  await store.createInteraction("replan_switch", { subtaskId, created: created.length });
  return { created, reason: "Switched to an outline-first method." };
}

export async function snoozeSubtask(subtaskId: string, snoozedUntil: string) {
  const store = await getStore();
  await store.updateSubtask(subtaskId, { snoozedUntil, updatedAt: nowIso() });
  await store.createInteraction("subtask_snoozed", { subtaskId, snoozedUntil });
}
