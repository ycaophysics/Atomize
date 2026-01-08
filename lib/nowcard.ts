import { listActiveSubtasksWithTask } from "@/lib/data/tasks";
import { isAfterNow } from "@/lib/time";
import { scoreSubtask } from "@/lib/scoring";
import type { SubtaskWithTask } from "@/lib/types";

export type NowCard = {
  primary: SubtaskWithTask;
  easy?: SubtaskWithTask;
  strategic?: SubtaskWithTask;
  reason: string;
};

function buildReason(item: SubtaskWithTask): string {
  const bits = [];
  if (item.taskImportance === "important") bits.push("important");
  if (item.taskUrgency === "urgent") bits.push("urgent");
  if (item.taskHorizon === "near_term") bits.push("near term");
  if (bits.length === 0) bits.push("balanced priority");
  return `Selected because it is ${bits.join(" + ")}.`;
}

function pickEasy(candidates: SubtaskWithTask[], primaryId: string) {
  return candidates
    .filter((item) => item.id !== primaryId)
    .sort((a, b) => a.estMinutes - b.estMinutes)[0];
}

function pickStrategic(candidates: SubtaskWithTask[], primaryId: string) {
  const strategic = candidates.filter(
    (item) =>
      item.id !== primaryId &&
      item.taskImportance === "important" &&
      item.taskUrgency !== "urgent"
  );
  if (strategic.length > 0) {
    return strategic.sort((a, b) => scoreSubtask(b) - scoreSubtask(a))[0];
  }
  return candidates.filter((item) => item.id !== primaryId)[0];
}

export async function getNowCard(): Promise<NowCard | null> {
  const subtasks = await listActiveSubtasksWithTask();
  const available = subtasks.filter((item) => !isAfterNow(item.snoozedUntil));
  if (available.length === 0) {
    return null;
  }
  const scored = [...available].sort((a, b) => scoreSubtask(b) - scoreSubtask(a));
  const primary = scored[0];
  return {
    primary,
    easy: pickEasy(scored, primary.id),
    strategic: pickStrategic(scored, primary.id),
    reason: buildReason(primary)
  };
}
