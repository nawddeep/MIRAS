import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { SourceType } from "@/lib/schemas";

// Small shared UI set. No hooks here, so these work in server and client components.

const buttonStyles = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  accent: "bg-saffron text-ink hover:brightness-95",
  secondary: "border border-ink/30 text-ink hover:bg-ink/5",
} as const;
type Variant = keyof typeof buttonStyles;
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${buttonBase} ${buttonStyles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonBase} ${buttonStyles[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-white/60 p-4 ${className}`}>{children}</div>;
}

const labelTones = {
  sample: "border border-dashed border-ink/50 bg-paper text-ink",
  info: "bg-lake/40 text-ink",
  warn: "bg-saffron/30 text-ink",
  rose: "bg-rose/30 text-ink",
  neutral: "bg-ink/10 text-ink",
} as const;

export function Label({ tone = "neutral", children, title }: { tone?: keyof typeof labelTones; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${labelTones[tone]}`}>
      {children}
    </span>
  );
}

export function SampleBadge({ lang }: { lang: Lang }) {
  return (
    <Label tone="sample" title={t(lang, "sampleExplainer")}>
      {t(lang, "sampleContent")}
    </Label>
  );
}

/** Labels for anything not real or not verified: Concept, Illustrative, Demo response, Estimate, Synthetic voice. */
export function NotRealLabel({ lang, kind }: { lang: Lang; kind: "concept" | "illustrative" | "demoResponse" | "estimate" | "syntheticVoice" }) {
  return <Label tone="warn">{t(lang, kind)}</Label>;
}

const sourceTone: Record<SourceType, keyof typeof labelTones> = {
  history: "info",
  oral_tradition: "warn",
  legend: "rose",
};

export function SourceTypeLabel({ lang, type }: { lang: Lang; type: SourceType }) {
  return <Label tone={sourceTone[type]}>{t(lang, `sourceType_${type}`)}</Label>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="mt-2 text-ink-soft">{children}</div>}
    </div>
  );
}

export function ErrorState({ lang, message, action }: { lang: Lang; message?: string; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose bg-rose/10 p-6">
      <p className="font-display text-xl">{t(lang, "errorTitle")}</p>
      <p className="mt-1 text-ink-soft">{message ?? t(lang, "errorBody")}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function SearchBox({ lang, defaultValue = "", autoFocus = false }: { lang: Lang; defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" method="get" role="search" className="flex w-full gap-2">
      <label className="sr-only" htmlFor="q">
        {t(lang, "searchPlaceholder")}
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder={t(lang, "searchPlaceholder")}
        className="min-h-11 min-w-0 flex-1 rounded-full border border-ink/25 bg-white px-4 text-base outline-none focus:border-lake-deep"
      />
      <Button type="submit">{t(lang, "searchButton")}</Button>
    </form>
  );
}

/** The "decline when unsure" state. Always offers search. */
export function IDontKnow({ lang, title, body }: { lang: Lang; title?: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-lake-deep/30 bg-lake/15 p-5" data-testid="i-dont-know">
      <p className="font-display text-2xl">{title ?? t(lang, "dontKnow")}</p>
      <p className="mt-1 mb-4 text-ink-soft">{body ?? t(lang, "dontKnowBody")}</p>
      <SearchBox lang={lang} />
    </div>
  );
}
