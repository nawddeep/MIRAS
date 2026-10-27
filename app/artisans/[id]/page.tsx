import { notFound } from "next/navigation";
import { MediaImage } from "@/components/domain";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Card, SampleBadge } from "@/components/ui";
import { pick, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { getVisibleArtisan, getVisibleWorkshops } from "@/lib/services/artisans";

export default async function ArtisanPage({ params }: PageProps<"/artisans/[id]">) {
  const { id } = await params;
  const lang = await getLang();
  const artisan = getVisibleArtisan(id);
  if (!artisan) notFound();
  const workshops = getVisibleWorkshops(artisan.id);
  const fmt = new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium" });

  return (
    <div className="space-y-6">
      {artisan.photos[0] && (
        <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-mist sm:aspect-[16/9]">
          <MediaImage src={artisan.photos[0]} alt={artisan.name} />
        </div>
      )}
      <header className="space-y-2">
        {artisan.isSample && <SampleBadge lang={lang} />}
        <h1 className="text-4xl">{artisan.name}</h1>
        <p className="text-lg text-ink-soft">{artisan.craft}</p>
        {artisan.headline && <p className="font-display text-xl">{artisan.headline}</p>}
        <p className="leading-relaxed whitespace-pre-line">{pick(lang, artisan.description, artisan.description_hi)}</p>
      </header>

      <Card>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink-soft">{t(lang, "languages")}</dt>
            <dd>{artisan.languages.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink-soft">{t(lang, "location")}</dt>
            <dd>{artisan.locationText}</dd>
          </div>
          {artisan.materials.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="font-semibold text-ink-soft">Materials</dt>
              <dd>{artisan.materials.join(", ")}</dd>
            </div>
          )}
        </dl>
      </Card>

      {workshops.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">{t(lang, "workshops")}</h2>
          {workshops.map((w) => (
            <Card key={w.id}>
              <div className="flex flex-wrap items-center gap-2">{w.isSample && <SampleBadge lang={lang} />}</div>
              <h3 className="mt-1 text-xl">{w.title}</h3>
              <p className="mt-1">{w.description}</p>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-sm">
                <dt className="text-ink-soft">{t(lang, "duration")}</dt>
                <dd>
                  {w.durationMinutes} {t(lang, "minutes")}
                </dd>
                <dt className="text-ink-soft">{t(lang, "cost")}</dt>
                <dd>{w.cost}</dd>
                <dt className="text-ink-soft">{t(lang, "language")}</dt>
                <dd>{w.language}</dd>
                <dt className="text-ink-soft">{t(lang, "howToBook")}</dt>
                <dd className="min-w-0 break-words">{w.howToBook}</dd>
              </dl>
              <p className="mt-2 text-xs text-ink-soft">
                {t(lang, "updated")}: {fmt.format(new Date(w.updatedAt))}
              </p>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3" id="enquire">
        <h2 className="text-2xl">{t(lang, "enquire")}</h2>
        {artisan.isSample && <p className="text-sm text-ink-soft">This is a sample listing. Enquiries are stored for the demo only.</p>}
        <EnquiryForm artisanId={artisan.id} lang={lang} />
      </section>
    </div>
  );
}
