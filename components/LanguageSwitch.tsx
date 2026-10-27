"use client";

import { useTransition } from "react";
import { setLang } from "@/lib/actions/lang";
import type { Lang } from "@/lib/i18n";

export function LanguageSwitch({ lang }: { lang: Lang }) {
  const [, startTransition] = useTransition();
  const set = (next: Lang) => startTransition(() => setLang(next));
  return (
    <div role="group" aria-label="Language" className="flex rounded-full border border-ink/25 p-0.5 text-sm">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          aria-pressed={lang === l}
          className={`min-h-9 rounded-full px-3 ${lang === l ? "bg-ink text-paper" : "text-ink"}`}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
