import Link from "next/link";
import { createTaskAction } from "@/lib/actions/tasks";
import { listTasks } from "@/lib/data/tasks";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await listTasks();

  return (
    <section className="space-y-6">
      <form
        action={createTaskAction}
        className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
      >
        <h2 className="text-lg font-semibold">Quick add</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="title"
            placeholder="Task title"
            required
          />
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="importance"
            defaultValue="unknown"
          >
            <option value="important">Important</option>
            <option value="not_important">Not important</option>
            <option value="unknown">Unknown</option>
          </select>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="urgency"
            defaultValue="unknown"
          >
            <option value="urgent">Urgent</option>
            <option value="not_urgent">Not urgent</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="horizon"
            defaultValue="unknown"
          >
            <option value="near_term">Near term</option>
            <option value="long_term">Long term</option>
            <option value="unknown">Unknown</option>
          </select>
          <input
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="est_minutes"
            placeholder="Est minutes (optional)"
            type="number"
            min="1"
          />
        </div>
        <button className="mt-4 rounded-full bg-slate-100 px-4 py-2 text-slate-900">
          Add task
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
        <h2 className="text-lg font-semibold">Task inventory</h2>
        {tasks.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            No tasks yet. Add one to get started.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between">
                <div>
                  <Link href={`/tasks/${task.id}`} className="text-base font-medium">
                    {task.title}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {task.importance.replace("_", " ")} ·{" "}
                    {task.urgency.replace("_", " ")} · {task.horizon.replace("_", " ")}
                  </div>
                </div>
                <div className="text-xs text-slate-500">{task.status}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
