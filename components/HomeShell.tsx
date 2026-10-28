"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { parseHourParam, sceneFor, timeOfDay, type TimeMode } from "@/lib/time-of-day";
import { HeroScene } from "./scene";
import { IllustrativeBadge } from "./ui";

type Copy = Record<TimeMode, { greetingHi: string; greetingEn: string; headline: string; headlineHi: string }>;

/**
 * Home screen shell with the time-of-day theme. The server renders "dawn"; after mount the visitor's
 * local hour (or ?hour=HH in demo mode) picks the mode, exposed as data-time for the CSS variables.
 */
export function HomeShell({ copy, demoMode, lang, top, children }: { copy: Copy; demoMode: boolean; lang: Lang; top: ReactNode; children: ReactNode }) {
  const [mode, setMode] = useState<TimeMode>("dawn");

  useEffect(() => {
    const forced = demoMode ? parseHourParam(new URLSearchParams(window.location.search).get("hour")) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the visitor's local time is only known after mount
    setMode(timeOfDay(forced ?? new Date().getHours()));
  }, [demoMode]);

  const c = copy[mode];
  const scene = sceneFor(mode);
  const dark = mode === "night";
  return (
    <div data-time={mode} data-testid="home-shell" className={`-mx-5 -mt-5 min-h-[70svh] bg-home-bg text-home-text ${dark ? "on-dark" : ""}`}>
      <div className="relative">
        <div key={scene} className="hero-fade anim-fade">
          <HeroScene scene={scene} className="h-[340px] w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--topbar-tint)] via-transparent to-[var(--home-bg)]" />
        <div className="absolute inset-x-0 top-0 px-5 pt-[calc(12px+env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p lang="hi" className="font-display text-lg">
                {c.greetingHi}
              </p>
              <p className="t-small">{c.greetingEn}</p>
            </div>
            {top}
          </div>
        </div>
        <div className="anim-arrival absolute inset-x-0 bottom-6 px-5">
          <h1 className="t-hero">{lang === "hi" ? c.headlineHi : c.headline}</h1>
          <p lang={lang === "hi" ? undefined : "hi"} className="font-display text-lg">
            {lang === "hi" ? c.headline : c.headlineHi}
          </p>
          <div className="mt-2">
            <IllustrativeBadge lang={lang} />
          </div>
        </div>
      </div>
      <div className="space-y-6 px-5 pb-6">{children}</div>
    </div>
  );
}
