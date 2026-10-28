import { notFound } from "next/navigation";
import { ArtisanCard, IllustrativePhoto, MediaImage, PlaceHeader, StoryBlock } from "@/components/domain";
import { Pano360 } from "@/components/Pano360";
import { ResponsibleInfo } from "@/components/ResponsibleInfo";
import { SaveOffline } from "@/components/SaveOffline";
import { IDontKnow } from "@/components/ui";
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
      {place.preview360 ? (
        <Pano360 src={place.preview360.path} poster={place.photos[0]} illustrative={place.preview360.illustrative} lang={lang} alt={name} />
      ) : (
        place.photos[0] && <IllustrativePhoto src={place.photos[0]} alt={name} lang={lang} />
      )}

      <PlaceHeader place={place} lang={lang} />

      <section className="grid gap-3 rounded-2xl border border-line bg-white/60 p-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-ink-soft">{t(lang, "openingHours")}</h2>
          <p>{place.openingHours}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink-soft">{t(lang, "typicalVisit")}</h2>
          <p>
            {place.typicalVisitMinutes} {t(lang, "minutes")}
          </p>
        </div>
      </section>

      <section id="stories" className="space-y-3">
        <h2 className="text-2xl">{t(lang, "stories")}</h2>
        {stories.length ? stories.map((s) => <StoryBlock key={s.id} story={s} lang={lang} />) : <IDontKnow lang={lang} />}
      </section>

      <section>
        <h2 className="mb-2 text-2xl">{t(lang, "visitTips")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          {place.visitTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <ResponsibleInfo place={place} lang={lang} />

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
          <h2 className="text-2xl">{t(lang, "meetArtisans")}</h2>
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
        <section>
          <h2 className="mb-2 text-2xl">{t(lang, "photos")}</h2>
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
