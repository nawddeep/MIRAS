import Link from "next/link";
import { PlaceCard } from "@/components/domain";
import { EmptyState } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { filterPlaces, getVisiblePlaces } from "@/lib/services/content";

export default async function Home({ searchParams }: PageProps<"/">) {
  const lang = await getLang();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const all = getVisiblePlaces();
  const categories = [...new Set(all.map((p) => p.category))].sort();
  const places = filterPlaces(all, q, cat);
  const href = (c: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (c) p.set("cat", c);
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="space-y-5">
      <section className="sky-gradient -mx-4 -mt-5 px-4 pt-8 pb-6">
        <h1 className="text-4xl text-ink">{t(lang, "tagline")}</h1>
        <form action="/" method="get" role="search" className="mt-4 flex gap-2">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <label htmlFor="home-q" className="sr-only">
            {t(lang, "searchPlaceholder")}
          </label>
          <input
            id="home-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t(lang, "searchPlaceholder")}
            className="min-h-11 min-w-0 flex-1 rounded-full border border-ink/20 bg-white/90 px-4 text-base outline-none focus:border-lake-deep"
          />
          <button type="submit" className="min-h-11 rounded-full bg-ink px-5 text-paper">
            {t(lang, "searchButton")}
          </button>
        </form>
      </section>

      <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {["", ...categories].map((c) => (
            <li key={c || "all"}>
              <Link
                href={href(c)}
                aria-current={c === cat ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm ${
                  c === cat ? "border-ink bg-ink text-paper" : "border-ink/25"
                }`}
              >
                {c || t(lang, "allCategories")}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {places.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {places.map((p) => (
            <li key={p.id}>
              <PlaceCard place={p} lang={lang} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t(lang, "noResults")}>
          <Link href="/" className="underline">
            {t(lang, "allCategories")}
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
