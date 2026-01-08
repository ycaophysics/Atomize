import { getPreferences } from "@/lib/data/preferences";
import { updatePreferencesAction } from "@/lib/actions/preferences";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const prefs = await getPreferences();

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-lg font-semibold">Preferences</h2>
      <form action={updatePreferencesAction} className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Breakdown depth
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="breakdownDepth"
            defaultValue={prefs.breakdownDepth}
          >
            <option value="light">Light</option>
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Step size
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="stepSize"
            defaultValue={prefs.stepSize}
          >
            <option value="short">5-10 min</option>
            <option value="default">10-25 min</option>
            <option value="long">25-45 min</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Style preset
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="stylePreset"
            defaultValue={prefs.stylePreset}
          >
            <option value="executive">Executive</option>
            <option value="adhd">ADHD</option>
            <option value="balanced">Balanced</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Nudge style
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            name="nudgeStyle"
            defaultValue={prefs.nudgeStyle}
          >
            <option value="neutral">Neutral</option>
            <option value="encouraging">Encouraging</option>
            <option value="direct">Direct</option>
          </select>
        </label>
        <button className="rounded-full bg-slate-100 px-4 py-2 text-slate-900">
          Save preferences
        </button>
      </form>
      <div className="mt-6 text-sm text-slate-400">
        Gemini model defaults to {prefs.model}. Update in <code>.env.local</code>.
      </div>
    </section>
  );
}
