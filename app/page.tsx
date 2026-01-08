import {
  markSubtaskFinishedAction,
  markSubtaskNotFinishedAction,
  markSubtaskStartedAction,
  snoozeSubtaskAction
} from "@/lib/actions/subtasks";
import { getNowCard } from "@/lib/nowcard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const now = await getNowCard();

  if (!now) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">No active subtasks yet</h2>
        <p className="mt-2 text-sm text-slate-400">
          Add a task and generate a breakdown to get your Now Card.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold">Now</h2>
        <p className="mt-1 text-sm text-slate-400">{now.reason}</p>
        <div className="mt-4 space-y-2">
          <div className="text-sm uppercase text-slate-500">Primary</div>
          <div className="text-xl font-semibold">{now.primary.title}</div>
          <div className="text-sm text-slate-400">
            {now.primary.taskTitle} · {now.primary.estMinutes} min
          </div>
          <div className="text-sm text-slate-300">
            Tiny first step: {now.primary.tinyFirstStep}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <form action={markSubtaskStartedAction}>
            <input type="hidden" name="subtaskId" value={now.primary.id} />
            <button className="rounded-full bg-slate-100 px-4 py-2 text-slate-900">
              Start
            </button>
          </form>
          <form action={markSubtaskFinishedAction}>
            <input type="hidden" name="subtaskId" value={now.primary.id} />
            <button className="rounded-full border border-slate-600 px-4 py-2">
              Finished
            </button>
          </form>
          <form action={markSubtaskNotFinishedAction}>
            <input type="hidden" name="subtaskId" value={now.primary.id} />
            <button className="rounded-full border border-slate-600 px-4 py-2">
              Not finished
            </button>
          </form>
          <form action={snoozeSubtaskAction}>
            <input type="hidden" name="subtaskId" value={now.primary.id} />
            <button className="rounded-full border border-slate-600 px-4 py-2">
              Snooze 30m
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
          <h3 className="text-sm uppercase text-slate-500">Easier win</h3>
          {now.easy ? (
            <div className="mt-2">
              <div className="text-lg font-semibold">{now.easy.title}</div>
              <div className="text-sm text-slate-400">
                {now.easy.taskTitle} · {now.easy.estMinutes} min
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No alternate available.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
          <h3 className="text-sm uppercase text-slate-500">Strategic</h3>
          {now.strategic ? (
            <div className="mt-2">
              <div className="text-lg font-semibold">{now.strategic.title}</div>
              <div className="text-sm text-slate-400">
                {now.strategic.taskTitle} · {now.strategic.estMinutes} min
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No alternate available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
