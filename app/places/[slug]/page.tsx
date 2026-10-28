import { notFound } from "next/navigation";
import { ArtisanCard, IllustrativePhoto, IllustrativeScene, MediaImage, PlaceHeader, StoryBlock } from "@/components/domain";
import { BookmarkIcon, ClockIcon, TicketIcon } from "@/components/icons";
import { Pano360 } from "@/components/Pano360";
import { ResponsibleInfo } from "@/components/ResponsibleInfo";
import { SaveOffline } from "@/components/SaveOffline";
import { IDontKnow, NotVerified, SampleBadge } from "@/components/ui";
import { currentMode } from "@/lib/config";
import { pick, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { getRepos } from "@/lib/repos";
import { getVisibleArtisans } from "@/lib/services/artisans";
import { getVisiblePlaceBySlug, getVisiblePlaces, getVisibleStories } from "@/lib/services/content";

export default async function PlacePage({ params }: PageProps<"/places/[slug]">) {
  const { slug } = await params;
  const lang = await getLang();
  const place = getVisiblePlaceBySlug(slug);
  if (!place) notFound();
  const name = pick(lang, place.name, place.name_hi);
  const stories = getVisibleStories(place.id);
  // No artisan-to-place link in the data model yet, so show a few makers from the city.
  const artisans = getVisibleArtisans().slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="relative -mx-5 -mt-5 sm:mx-0 sm:mt-0">
        {place.preview360 ? (
          <Pano360 src={place.preview360.path} poster={place.photos[0]} illustrative={place.preview360.illustrative} lang={lang} alt={name} />
        ) : place.photos[0] ? (
          <IllustrativePhoto src={place.photos[0]} alt={name} lang={lang} />
        ) : (
          <IllustrativeScene lang={lang} />
        )}
        <a
          href="#save"
          aria-label="Save for later"
          className="absolute top-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-paper/90 text-on-paper shadow"
        >
          <BookmarkIcon />
        </a>
      </div>

      <div id="overview" className="scroll-mt-28">
        <PlaceHeader place={place} lang={lang} />
      </div>

      <nav aria-label="Sections" className="sticky top-[60px] z-20 -mx-5 border-b border-line bg-paper/95 px-5 backdrop-blur">
        <ul className="flex gap-1 overflow-x-auto">
          {[
            ["#overview", t(lang, "overview")],
            ["#stories", t(lang, "stories")],
            ["#photos", t(lang, "photos")],
            ["#visit", t(lang, "visit")],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-muted-paper hover:text-on-paper">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Facts: only content values. Entry fee and hours have no verified field yet, so they say so. */}
      <section aria-label="Facts" className="grid grid-cols-3 gap-2 rounded-card border border-line bg-paper-2 p-3 text-center">
        <div className="space-y-1">
          <ClockIcon className="mx-auto text-lake-deep" />
          <p className="tnum font-semibold">
            {place.typicalVisitMinutes} {t(lang, "minutes")}
          </p>
          <p className="t-small text-muted-paper">{t(lang, "typicalVisit")}</p>
          {place.isSample && <SampleBadge lang={lang} />}
        </div>
        <div className="space-y-1">
          <TicketIcon className="mx-auto text-lake-deep" />
          <NotVerified lang={lang} />
          <p className="t-small text-muted-paper">{t(lang, "entryFee")}</p>
        </div>
        <div className="space-y-1">
          <ClockIcon className="mx-auto text-lake-deep" />
          <NotVerified lang={lang} />
          <p className="t-small text-muted-paper">{t(lang, "openingHours")}</p>
        </div>
      </section>

      <section id="stories" className="scroll-mt-28 space-y-3">
        <h2 className="t-heading">{t(lang, "stories")}</h2>
        {stories.length ? stories.map((s) => <StoryBlock key={s.id} story={s} lang={lang} />) : <IDontKnow lang={lang} />}
      </section>

      <section id="visit" className="scroll-mt-28">
        <h2 className="t-heading mb-2">{t(lang, "visitTips")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          {place.visitTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <ResponsibleInfo place={place} lang={lang} />

      <div id="save" className="scroll-mt-28" />
      <SaveOffline
        place={{
          slug: place.slug,
          name,
          summary: pick(lang, place.summary, place.summary_hi),
          openingHours: place.openingHours,
          visitTips: place.visitTips,
          isSample: place.isSample,
          stories: stories.map((s) => ({
            title: pick(lang, s.title, s.title_hi),
            text: pick(lang, s.text, s.text_hi),
            sourceType: s.sourceType,
            sourceRef: s.sourceRef,
            isSample: s.isSample,
          })),
        }}
        phrases={getRepos()
          .phrases.list()
          .filter((p) => !p.isSample || currentMode() === "demo")}
        placeNames={Object.fromEntries(getVisiblePlaces().map((p) => [p.id, pick(lang, p.name, p.name_hi)]))}
      />

      {artisans.length > 0 && (
        <section className="space-y-3">
          <h2 className="t-heading">{t(lang, "meetArtisans")}</h2>
          <ul className="grid gap-3">
            {artisans.map((a) => (
              <li key={a.id}>
                <ArtisanCard artisan={a} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {place.photos.length > 1 && (
        <section id="photos" className="scroll-mt-28">
          <h2 className="t-heading mb-2">{t(lang, "photos")}</h2>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {place.photos.map((src, i) => (
              <li key={src} className="aspect-[4/3] w-64 shrink-0 snap-start overflow-hidden rounded-xl bg-mist">
                <MediaImage src={src} alt={`${name} ${i + 1}`} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
