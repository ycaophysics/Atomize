import { notFound } from "next/navigation";
import {
  generateBreakdownAction,
  updateTaskLabelsAction
} from "@/lib/actions/tasks";
import { listSubtasksByTask, getTaskById } from "@/lib/data/tasks";
import { markSubtaskFinishedAction, markSubtaskStartedAction } from "@/lib/actions/subtasks";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function TaskDetailPage({ params }: PageProps) {
  const task = await getTaskById(params.id);
  if (!task) {
    notFound();
  }
  const subtasks = await listSubtasksByTask(task.id);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <div className="mt-2 text-sm text-slate-400">
          {task.importance.replace("_", " ")} · {task.urgency.replace("_", " ")} ·{" "}
          {task.horizon.replace("_", " ")}
        </div>
        <form action={updateTaskLabelsAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <input type="hidden" name="taskId" value={task.id} />
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="importance"
            defaultValue={task.importance}
          >
            <option value="important">Important</option>
            <option value="not_important">Not important</option>
            <option value="unknown">Unknown</option>
          </select>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="urgency"
            defaultValue={task.urgency}
          >
            <option value="urgent">Urgent</option>
            <option value="not_urgent">Not urgent</option>
            <option value="unknown">Unknown</option>
          </select>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="horizon"
            defaultValue={task.horizon}
          >
            <option value="near_term">Near term</option>
            <option value="long_term">Long term</option>
            <option value="unknown">Unknown</option>
          </select>
          <button className="rounded-full bg-slate-100 px-4 py-2 text-slate-900">
            Update labels
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Subtasks</h3>
          <form action={generateBreakdownAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <button className="rounded-full border border-slate-600 px-4 py-2 text-sm">
              Generate breakdown
            </button>
          </form>
        </div>
        {subtasks.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No subtasks yet. Generate a breakdown to continue.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-medium">{subtask.title}</div>
                    <div className="text-xs text-slate-400">
                      {subtask.estMinutes} min · {subtask.status}
                    </div>
                    <div className="text-xs text-slate-500">
                      Tiny step: {subtask.tinyFirstStep}
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <form action={markSubtaskStartedAction}>
                      <input type="hidden" name="subtaskId" value={subtask.id} />
                      <input type="hidden" name="redirectTo" value={`/tasks/${task.id}`} />
                      <button className="rounded-full border border-slate-700 px-3 py-1">
                        Start
                      </button>
                    </form>
                    <form action={markSubtaskFinishedAction}>
                      <input type="hidden" name="subtaskId" value={subtask.id} />
                      <input type="hidden" name="redirectTo" value={`/tasks/${task.id}`} />
                      <button className="rounded-full border border-slate-700 px-3 py-1">
                        Finish
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
