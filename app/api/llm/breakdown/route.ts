import { getStore } from "@/lib/storage";
import { generateBreakdown } from "@/lib/llm/breakdown";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { taskId?: string };
  if (!body.taskId) {
    return Response.json({ error: "taskId is required" }, { status: 400 });
  }

  const store = await getStore();
  const task = await store.getTask(body.taskId);
  if (!task) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }
  const preferences = await store.getPreferences();
  const breakdown = await generateBreakdown({ task, preferences });
  return Response.json(breakdown);
}
