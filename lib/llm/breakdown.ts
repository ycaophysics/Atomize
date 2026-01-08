import { config } from "@/lib/config";
import { generateWithGemini } from "@/lib/llm/gemini";
import { buildBreakdownPrompt } from "@/lib/llm/prompts";
import { BreakdownSchema } from "@/lib/llm/schemas";
import { fallbackBreakdown } from "@/lib/llm/fallback";
import type { Preferences, Task } from "@/lib/types";

type BreakdownPayload = {
  task: Task;
  preferences: Preferences;
};

export async function generateBreakdown(payload: BreakdownPayload) {
  const prompt = buildBreakdownPrompt(payload.task, payload.preferences);
  const model = payload.preferences.model || config.geminiModel;
  try {
    const text = await generateWithGemini(prompt, model);
    const parsed = parseJson(text);
    const validated = BreakdownSchema.parse(parsed);
    return { model, subtasks: validated.subtasks };
  } catch (error) {
    const fallback = fallbackBreakdown(payload.task);
    return { model: "fallback", subtasks: fallback.subtasks };
  }
}

function parseJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end >= 0) {
    const slice = text.slice(start, end + 1);
    return JSON.parse(slice);
  }
  return JSON.parse(text);
}
