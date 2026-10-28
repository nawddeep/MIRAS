"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_PLAN, loadPlan, savePlan, type SavedPlan } from "@/lib/client/plan-store";
import { planDay, SPEED_KMH, type PlannerPlace, type PlanResult } from "@/lib/planner";
import { WEEKDAYS } from "@/lib/schemas";
import { Button, Label } from "./ui";

const input = "min-h-11 rounded-xl border border-ink/25 bg-white px-3";

export function PlanBuilder({ places }: { places: (PlannerPlace & { slug: string })[] }) {
  const [plan, setPlan] = useState<SavedPlan>(DEFAULT_PLAN);
  const [weekday, setWeekday] = useState<(typeof WEEKDAYS)[number]>("sun");
  const [result, setResult] = useState<PlanResult | null>(null);

  // Read the device copy after mount (localStorage is not available during server render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from device storage
    setPlan(loadPlan());
    setWeekday(WEEKDAYS[new Date().getDay()]);
  }, []);

  const update = (next: SavedPlan) => {
    setPlan(next);
    savePlan(next);
    setResult(null);
  };
  const toggle = (id: string) =>
    update({ ...plan, placeIds: plan.placeIds.includes(id) ? plan.placeIds.filter((x) => x !== id) : [...plan.placeIds, id] });

  const chosen = places.filter((p) => plan.placeIds.includes(p.id));
  const bySlug = new Map(places.map((p) => [p.id, p.slug]));

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="mb-1 font-medium">Places to visit</legend>
        {places.map((p) => (
          <label key={p.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-white/60 px-3">
            <input type="checkbox" checked={plan.placeIds.includes(p.id)} onChange={() => toggle(p.id)} />
            <span className="flex-1">{p.name}</span>
            <span className="text-sm text-ink-soft">{p.typicalVisitMinutes} min</span>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="block text-sm font-medium">Start time</span>
          <input type="time" value={plan.startTime} onChange={(e) => update({ ...plan, startTime: e.target.value || "09:00" })} className={`${input} w-full`} />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Day length</span>
          <select value={plan.dayHours} onChange={(e) => update({ ...plan, dayHours: Number(e.target.value) })} className={`${input} w-full`}>
            {[2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Getting around</span>
          <select value={plan.mode} onChange={(e) => update({ ...plan, mode: e.target.value as SavedPlan["mode"] })} className={`${input} w-full`}>
            <option value="walk">Walking</option>
            <option value="drive">Driving</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Day</span>
          <select value={weekday} onChange={(e) => setWeekday(e.target.value as typeof weekday)} className={`${input} w-full`}>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {d[0].toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button
        type="button"
        variant="accent"
        disabled={!chosen.length}
        onClick={() => setResult(planDay({ places: chosen, startTime: plan.startTime, dayMinutes: plan.dayHours * 60, mode: plan.mode, weekday }))}
      >
        Make my plan
      </Button>
      <p className="text-xs text-ink-soft">Your plan is saved on this device only.</p>

      {result && !result.ok && (
        <div role="alert" className="space-y-2 rounded-2xl border border-rose bg-rose/10 p-4" data-testid="plan-problems">
          <p className="font-medium">MIRAS cannot plan this yet. It will not guess:</p>
          <ul className="list-disc pl-5">
            {result.problems.map((p) => (
              <li key={p.placeId + p.problem}>
                {p.name}: {p.problem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result?.ok && (
        <section className="space-y-3" data-testid="plan-result">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl">Your day</h2>
            <Label tone="warn">Estimate</Label>
          </div>
          <p className="text-sm text-ink-soft">
            Travel times are straight-line distance at {SPEED_KMH[plan.mode]} km/h ({plan.mode === "walk" ? "walking" : "driving"}). Real routes
            take longer.
          </p>
          <ol className="space-y-2">
            {result.stops.map((s, i) => (
              <li key={s.placeId} className="rounded-xl border border-line bg-white/60 p-3">
                {i > 0 && <p className="text-xs text-ink-soft">About {s.travelMinutes} min travel (estimate)</p>}
                <p className="font-medium">
                  {s.arrive}–{s.leave} ·{" "}
                  <Link href={`/places/${bySlug.get(s.placeId)}`} className="underline">
                    {s.name}
                  </Link>
                </p>
              </li>
            ))}
          </ol>
          {result.skipped.length > 0 && (
            <ul className="list-disc pl-5 text-sm">
              {result.skipped.map((s) => (
                <li key={s.placeId}>
                  Left out: {s.name}. {s.reason}.
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
