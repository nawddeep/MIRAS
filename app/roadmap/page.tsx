import type { Metadata } from "next";
import Link from "next/link";
import { Card, Label } from "@/components/ui";
import { ROADMAP, roadmapCounts, STATUS_LABEL, type RoadmapStatus } from "@/lib/roadmap";

export const metadata: Metadata = { title: "What is built, and what comes next" };

const TONE: Record<RoadmapStatus, "info" | "warn" | "neutral"> = { built: "info", concept: "warn", not_planned: "neutral" };
const ORDER: RoadmapStatus[] = ["built", "concept", "not_planned"];

/** A read-only pitch page. It adds no feature: no buttons, no forms, no data. English only. */
export default function RoadmapPage() {
  const counts = roadmapCounts();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl">What is built, and what comes next</h1>
        <p className="text-ink-soft">
          MIRAS is built around one rule: every story shows where it comes from. This page shows what exists today and what we will only build once it
          can be done safely.
        </p>
      </header>

      <dl data-testid="roadmap-summary" className="grid grid-cols-3 gap-2 text-center">
        {ORDER.map((s) => (
          <div key={s} className="rounded-card border border-line bg-paper-2 p-3 text-on-paper">
            <dt className="text-xs font-semibold">{STATUS_LABEL[s]}</dt>
            <dd className="tnum mt-1 text-2xl" data-status={s}>
              {counts[s]}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="space-y-3">
        {ROADMAP.map((item) => (
          <li key={item.id} data-testid="roadmap-card">
            <Card className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="t-heading min-w-0 text-xl">{item.name}</h2>
                <span data-testid="roadmap-status">
                  <Label tone={TONE[item.status]}>{STATUS_LABEL[item.status]}</Label>
                </span>
              </div>
              <p>{item.what}</p>
              <div>
                <h3 className="text-sm font-semibold">Today in MIRAS</h3>
                <p className="mt-0.5">{item.today}</p>
                {item.evidence.length > 0 && (
                  <p className="mt-1 text-xs text-muted-paper">
                    Where:{" "}
                    {item.evidence.map((e, i) => (
                      <span key={e.route}>
                        {i > 0 && ", "}
                        <code>{e.route}</code>
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold">Before we build it</h3>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                  {item.before.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="space-y-1">
        <h2 className="text-xl">Why we did not build all of this for the final</h2>
        <p>Each of these needs real people to verify, consent or be protected. We would rather show less that is true.</p>
      </Card>

      <p>
        <Link href="/" className="inline-flex min-h-11 items-center text-sm underline">
          Back to Home
        </Link>
      </p>
    </div>
  );
}
