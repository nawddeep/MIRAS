import { notFound } from "next/navigation";
import { IllustrativePhoto, MediaImage, PlaceHeader } from "@/components/domain";
import { Pano360 } from "@/components/Pano360";
import { pick, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { getVisiblePlaceBySlug } from "@/lib/services/content";

export default async function PlacePage({ params }: PageProps<"/places/[slug]">) {
  const { slug } = await params;
  const lang = await getLang();
  const place = getVisiblePlaceBySlug(slug);
  if (!place) notFound();
  const name = pick(lang, place.name, place.name_hi);

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

      <section>
        <h2 className="mb-2 text-2xl">{t(lang, "visitTips")}</h2>
        <ul className="list-disc space-y-1 pl-5">
          {place.visitTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

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
