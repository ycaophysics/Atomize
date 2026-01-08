import type { SubtaskWithTask } from "@/lib/types";

function scoreLabel(value: string, weights: Record<string, number>, fallback: number) {
  return weights[value] ?? fallback;
}

export function scoreSubtask(item: SubtaskWithTask): number {
  const importance = scoreLabel(item.taskImportance, {
    important: 4,
    not_important: 1,
    unknown: 2
  }, 2);
  const urgency = scoreLabel(item.taskUrgency, { urgent: 4, not_urgent: 1, unknown: 2 }, 2);
  const horizon = scoreLabel(item.taskHorizon, { near_term: 2, long_term: 0, unknown: 1 }, 1);
  const startedBoost = item.status === "started" ? 1 : 0;
  const sizeBoost = item.estMinutes <= 10 ? 1 : item.estMinutes <= 25 ? 0.5 : 0;

  return importance + urgency + horizon + startedBoost + sizeBoost;
}
