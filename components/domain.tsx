import Link from "next/link";
import type { ReactNode } from "react";
import { pick, t, type Lang } from "@/lib/i18n";
import type { Artisan, Place, StoryEntry } from "@/lib/schemas";
import { Label, NotRealLabel, SampleBadge, SourceTypeLabel } from "./ui";

/** Plain <img> on purpose: media is local SVG/JPEG and next/image adds nothing for the demo. */
export function MediaImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`block h-full w-full object-cover ${className}`} />;
}

export function PlaceHeader({ place, lang }: { place: Place; lang: Lang }) {
  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label tone="info">{place.category}</Label>
        {place.isSample && <SampleBadge lang={lang} />}
      </div>
      <h1 className="text-4xl">{pick(lang, place.name, place.name_hi)}</h1>
      <p className="text-lg text-ink-soft">{pick(lang, place.summary, place.summary_hi)}</p>
    </header>
  );
}

export function PlaceCard({ place, lang }: { place: Place; lang: Lang }) {
  return (
    <Link href={`/places/${place.slug}`} className="group block overflow-hidden rounded-2xl border border-line bg-white/60">
      <div className="relative aspect-[16/9] bg-mist">
        {place.photos[0] && <MediaImage src={place.photos[0]} alt="" />}
        <div className="absolute top-2 left-2 flex gap-1">
          {place.isSample && <SampleBadge lang={lang} />}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{place.category}</p>
        <h2 className="mt-1 text-2xl group-hover:underline">{pick(lang, place.name, place.name_hi)}</h2>
        <p className="mt-1 line-clamp-2 text-ink-soft">{pick(lang, place.summary, place.summary_hi)}</p>
      </div>
    </Link>
  );
}

/**
 * One story with its source type label. Only ever rendered with stories from getVisibleStories.
 * `extra` is where client controls (narration, simple version) plug in.
 */
export function StoryBlock({ story, lang, extra }: { story: StoryEntry; lang: Lang; extra?: ReactNode }) {
  return (
    <article className="rounded-2xl border border-line bg-white/60 p-4" data-testid="story" data-story-id={story.id}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <SourceTypeLabel lang={lang} type={story.sourceType} />
        {story.isSample && <SampleBadge lang={lang} />}
      </div>
      <h3 className="text-2xl">{pick(lang, story.title, story.title_hi)}</h3>
      {extra ?? <p className="mt-2 leading-relaxed whitespace-pre-line">{pick(lang, story.text, story.text_hi)}</p>}
      <dl className="mt-3 space-y-0.5 text-sm text-ink-soft">
        {story.sourceRef && (
          <div className="flex gap-1">
            <dt className="font-semibold">{t(lang, "source")}:</dt>
            <dd className="min-w-0 break-words">{story.sourceRef}</dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt className="font-semibold">{t(lang, "verifiedBy")}:</dt>
          <dd>{story.verifiedBy ?? t(lang, "unverified")}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ArtisanCard({ artisan, lang }: { artisan: Artisan; lang: Lang }) {
  return (
    <Link href={`/artisans/${artisan.id}`} className="flex gap-3 rounded-2xl border border-line bg-white/60 p-3 hover:bg-white">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-mist">
        {artisan.photos[0] && <MediaImage src={artisan.photos[0]} alt="" />}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1">{artisan.isSample && <SampleBadge lang={lang} />}</div>
        <h3 className="mt-1 text-xl">{artisan.name}</h3>
        <p className="text-sm text-ink-soft">
          {artisan.craft} · {artisan.locationText}
        </p>
      </div>
    </Link>
  );
}

export function IllustrativePhoto({ src, alt, lang }: { src: string; alt: string; lang: Lang }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl bg-mist">
      <div className="aspect-[16/9]">
        <MediaImage src={src} alt={alt} />
      </div>
      <figcaption className="absolute top-2 left-2">
        <NotRealLabel lang={lang} kind="illustrative" />
      </figcaption>
    </figure>
  );
}
