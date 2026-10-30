import { ArtisanCard } from "@/components/domain";
import { ButtonLink, EmptyState } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { getVisibleArtisans } from "@/lib/services/artisans";

export default async function ArtisansPage() {
  const lang = await getLang();
  const artisans = getVisibleArtisans();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">{t(lang, "meetArtisans")}</h1>
      <p className="text-ink-soft">Every real listing here is published only with the maker&rsquo;s recorded consent.</p>
      {artisans.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {artisans.map((a) => (
            <li key={a.id}>
              <ArtisanCard artisan={a} lang={lang} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t(lang, "emptyTitle")}><ButtonLink href="/places" variant="secondary">{t(lang, "navPlaces")}</ButtonLink></EmptyState>
      )}
    </div>
  );
}
