import { ButtonLink, Card, EmptyState, SampleBadge } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { formatIST, getVisibleEvents } from "@/lib/services/events";

export default async function EventsPage() {
  const lang = await getLang();
  const events = getVisibleEvents();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Events</h1>
      <p className="text-ink-soft">Only events their organisers have confirmed. Times are Indian Standard Time. Booking happens outside MIRAS.</p>
      {events.length ? (
        <ul className="space-y-3" data-testid="events">
          {events.map((e) => (
            <li key={e.id}>
              <Card>
                {e.isSample && <SampleBadge lang={lang} />}
                <h2 className="mt-1 text-2xl">{e.title}</h2>
                <p className="font-medium">{formatIST(e.startsAt)}</p>
                <dl className="mt-2 grid grid-cols-2 gap-1 text-sm">
                  <dt className="text-ink-soft">Organiser</dt>
                  <dd>{e.organiser}</dd>
                  <dt className="text-ink-soft">{t(lang, "duration")}</dt>
                  <dd>
                    {e.durationMinutes} {t(lang, "minutes")}
                  </dd>
                  <dt className="text-ink-soft">{t(lang, "language")}</dt>
                  <dd>{e.language}</dd>
                  <dt className="text-ink-soft">{t(lang, "cost")}</dt>
                  <dd>{e.cost}</dd>
                  <dt className="text-ink-soft">{t(lang, "howToBook")}</dt>
                  <dd className="min-w-0 break-words">{e.howToBook}</dd>
                </dl>
                <p className="mt-2 text-xs text-ink-soft">
                  {t(lang, "updated")}: {formatIST(e.updatedAt)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t(lang, "emptyTitle")}><ButtonLink href="/places" variant="secondary">{t(lang, "navPlaces")}</ButtonLink></EmptyState>
      )}
    </div>
  );
}
