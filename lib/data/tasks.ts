import { getStore } from "@/lib/storage";
import type { SubtaskWithTask } from "@/lib/types";

export async function listTasks() {
  const store = await getStore();
  const tasks = await store.listTasks();
  return tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getTaskById(taskId: string) {
  const store = await getStore();
  return store.getTask(taskId);
}

export async function listSubtasksByTask(taskId: string) {
  const store = await getStore();
  return store.listSubtasks(taskId);
}

export async function listActiveSubtasksWithTask(): Promise<SubtaskWithTask[]> {
  const store = await getStore();
  const [tasks, subtasks] = await Promise.all([store.listTasks(), store.listSubtasks()]);
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  return subtasks
    .filter((subtask) => subtask.status !== "finished" && subtask.status !== "skipped")
    .map((subtask) => {
      const task = taskMap.get(subtask.taskId);
      if (!task) {
        return null;
      }
      return {
        ...subtask,
        taskTitle: task.title,
        taskImportance: task.importance,
        taskUrgency: task.urgency,
        taskHorizon: task.horizon
      };
    })
    .filter((value): value is SubtaskWithTask => Boolean(value));
}
