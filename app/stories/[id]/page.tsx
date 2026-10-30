import type { Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isVerifiedSource, TwoLineName } from "@/components/domain";
import { HeroScene } from "@/components/scene";
import { StoryReader } from "@/components/StoryReader";
import { IllustrativeBadge, NotVerified, SampleBadge, SourceTypeLabel, VerifiedSourceBadge } from "@/components/ui";
import { pick, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { getVisiblePlaces, getVisibleStories } from "@/lib/services/content";

export const viewport: Viewport = { themeColor: "#F5EEE0" };

export default async function StoryPage({ params }: PageProps<"/stories/[id]">) {
  const { id } = await params;
  const lang = await getLang();
  // Read only through getVisibleStories: a hidden or unknown story is a 404.
  const found = getVisiblePlaces()
    .flatMap((place) => getVisibleStories(place.id).map((story) => ({ story, place })))
    .find((x) => x.story.id === id);
  if (!found) notFound();
  const { story, place } = found;
  const fmt = new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium" });

  return (
    <article className="story-screen anim-open space-y-5" data-testid="story" data-story-id={story.id}>
      <figure className="relative -mx-5 -mt-5 overflow-hidden">
        <HeroScene scene="golden" className="aspect-[16/9] w-full" />
        <figcaption className="absolute top-3 left-3">
          <IllustrativeBadge lang={lang} />
        </figcaption>
      </figure>

      <div className="flex flex-wrap gap-2">
        <SourceTypeLabel lang={lang} type={story.sourceType} />
        {isVerifiedSource(story) ? <VerifiedSourceBadge lang={lang} /> : story.isSample && <SampleBadge lang={lang} />}
      </div>

      <TwoLineName lang={lang} en={story.title} hi={story.title_hi} as="h1" className="t-title" />

      <dl className="space-y-1 text-sm text-muted-paper">
        <div>
          <dt className="sr-only">{t(lang, "navPlaces")}</dt>
          <dd>
            <Link href={`/places/${place.slug}`} className="inline-flex min-h-11 items-center font-semibold text-lake-deep underline">
              {pick(lang, place.name, place.name_hi)}
            </Link>
          </dd>
        </div>
        {story.sourceRef && (
          <div className="flex gap-1">
            <dt className="font-semibold">{t(lang, "source")}:</dt>
            <dd className="min-w-0 break-words">{story.sourceRef}</dd>
          </div>
        )}
        <div className="tnum">
          <dt className="sr-only">{t(lang, "verifiedBy")}</dt>
          <dd>
            {story.verifiedBy?.trim() && story.verifiedAt ? (
              `${t(lang, "verifiedBy")} ${story.verifiedBy} · ${fmt.format(new Date(story.verifiedAt))}`
            ) : (
              <NotVerified lang={lang} />
            )}
          </dd>
        </div>
      </dl>

      <StoryReader story={story} lang={lang} />
    </article>
  );
}
