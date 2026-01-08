import type { Task } from "@/lib/types";
import type { BreakdownResult } from "@/lib/llm/schemas";

export function fallbackBreakdown(task: Task): BreakdownResult {
  return {
    subtasks: [
      {
        title: `Clarify scope for ${task.title}`,
        estMinutes: 8,
        tinyFirstStep: "Write a 1-line definition of done.",
        dependencyId: null
      },
      {
        title: `Gather inputs for ${task.title}`,
        estMinutes: 12,
        tinyFirstStep: "List the top 3 inputs you need.",
        dependencyId: null
      },
      {
        title: `Do the next small chunk of ${task.title}`,
        estMinutes: 20,
        tinyFirstStep: "Start a 5-minute timer and begin.",
        dependencyId: null
      }
    ]
  };
}
