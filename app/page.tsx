import Link from "next/link";
import type { ReactNode } from "react";
import { StoryCard } from "@/components/domain";
import { HomeShell } from "@/components/HomeShell";
import { ArrowIcon, ClockIcon, MakersIcon, PlacesIcon, SearchIcon, StoriesIcon } from "@/components/icons";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { RippleDivider } from "@/components/scene";
import { Splash } from "@/components/Splash";
import { EmptyState, SampleBadge } from "@/components/ui";
import { getConfig } from "@/lib/config";
import { pick, t, type DictKey } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { getVisiblePlaces, getVisibleStories } from "@/lib/services/content";
import type { TimeMode } from "@/lib/time-of-day";

const MODES: TimeMode[] = ["dawn", "day", "golden", "night"];

export default async function Home() {
  const lang = await getLang();
  const withStories = getVisiblePlaces().map((p) => ({ place: p, stories: getVisibleStories(p.id) }));
  const featured = withStories.find((x) => x.stories.length);

  const copy = Object.fromEntries(
    MODES.map((m) => [
      m,
      {
        greetingHi: t("hi", `greeting_${m}` as DictKey),
        greetingEn: t("en", `greeting_${m}` as DictKey),
        headline: t("en", `hero_${m}` as DictKey),
        headlineHi: t("hi", `hero_${m}` as DictKey),
      },
    ]),
  ) as Record<TimeMode, { greetingHi: string; greetingEn: string; headline: string; headlineHi: string }>;

  // No Food circle: there is no food data. Workshops are listed on each maker's page.
  const categories: { href: string; label: string; icon: ReactNode }[] = [
    { href: "/places", label: t(lang, "navPlaces"), icon: <PlacesIcon /> },
    { href: "/artisans", label: t(lang, "navMakers"), icon: <MakersIcon /> },
    { href: "/artisans", label: t(lang, "catWorkshops"), icon: <ClockIcon /> },
    { href: "/stories", label: t(lang, "navStories"), icon: <StoriesIcon /> },
  ];

  return (
    <>
      <Splash tagline={t("en", "tagline")} taglineHi={t("hi", "tagline")} />
      <HomeShell copy={copy} demoMode={getConfig().demoMode} lang={lang} top={<LanguageSwitch lang={lang} />}>
        <form action="/search" method="get" role="search" className="-mt-2">
          <label htmlFor="home-q" className="sr-only">
            {t(lang, "searchPlaceholder")}
          </label>
          <div className="relative">
            <SearchIcon size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-paper" />
            <input
              id="home-q"
              name="q"
              type="search"
              placeholder={t(lang, "searchPlaceholder")}
              className="min-h-[52px] w-full rounded-full border border-line bg-paper-2 pr-4 pl-11 text-base text-on-paper shadow-sm outline-none focus:border-lake-deep"
            />
          </div>
        </form>

        <nav aria-label="Categories">
          <ul className="grid grid-cols-4 gap-2">
            {categories.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex flex-col items-center gap-1.5 text-center text-sm">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-line bg-paper-2 text-lake-deep">{c.icon}</span>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="space-y-3" aria-labelledby="featured">
          <h2 id="featured" className="t-section">
            {t(lang, "featuredStory")}
          </h2>
          {featured ? (
            <StoryCard story={featured.stories[0]} lang={lang} placeName={pick(lang, featured.place.name, featured.place.name_hi)} />
          ) : (
            <EmptyState title={t(lang, "emptyTitle")} />
          )}
        </section>

        <RippleDivider className="text-home-muted" />

        <section className="space-y-3" aria-labelledby="hear">
          <h2 id="hear" className="t-section">
            {t(lang, "hearAStory")}
          </h2>
          <ul className="space-y-2">
            {withStories.map(({ place, stories }) => (
              <li key={place.id}>
                <Link
                  href={`/places/${place.slug}#stories`}
                  className="flex min-h-16 items-center gap-3 rounded-card border border-line bg-paper-2 px-4 py-3 text-on-paper"
                >
                  <span className="min-w-0 flex-1">
                    <span className="t-heading block">{pick(lang, place.name, place.name_hi)}</span>
                    <span className="t-small tnum text-muted-paper">
                      {stories.length} {t(lang, "storyCount")}
                    </span>
                  </span>
                  {place.isSample && <SampleBadge lang={lang} />}
                  <ArrowIcon className="shrink-0 text-saffron-text" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </HomeShell>
    </>
  );
}
