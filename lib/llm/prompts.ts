import type { Preferences, Task } from "@/lib/types";

export function buildBreakdownPrompt(task: Task, preferences: Preferences): string {
  return [
    "You are breaking a task into subtasks.",
    "Return JSON only with this schema:",
    '{ "subtasks": [ { "title": "...", "estMinutes": 10, "tinyFirstStep": "...", "dependencyId": null } ] }',
    "Guidelines:",
    "- Steps are concrete, action oriented, and sequential.",
    "- Each step has a tiny first step that is 2 minutes or less.",
    "- Use the preferred step size and breakdown depth.",
    "- Keep the result short and practical.",
    "",
    `Task: ${task.title}`,
    `Importance: ${task.importance}`,
    `Urgency: ${task.urgency}`,
    `Horizon: ${task.horizon}`,
    `Breakdown depth: ${preferences.breakdownDepth}`,
    `Step size preference: ${preferences.stepSize}`,
    `Style preset: ${preferences.stylePreset}`
  ].join("\n");
}
