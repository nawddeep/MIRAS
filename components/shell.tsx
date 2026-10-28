"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BackIcon, CameraIcon, HomeIcon, MakersIcon, PlacesIcon, SearchIcon, StoriesIcon } from "./icons";

// Screens that draw their own top area (home greeting, full-screen camera).
const OWN_TOP = new Set(["/", "/camera"]);

/** Back button, wordmark and the language toggle (which replaces the board's bell and avatar). */
export function TopBar({ appName, right }: { appName: string; right: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(false);
  if (OWN_TOP.has(pathname)) return null;
  const detail = /^\/(places|stories|artisans)\/.+/.test(pathname);
  const title = pathname === '/places' ? 'Explore Places' : pathname === '/stories' ? 'Stories' : appName;
  const hi = pathname === '/places' ? 'उदयपुर के स्थल' : pathname === '/stories' ? 'कहानियाँ' : null;
  return (
    <header className={`miras-top ${detail ? 'detail-toolbar' : ''} ${search ? 'search-open' : ''} sticky top-0 z-30 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)]`}>
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-1.5">
        <button type="button" aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))} className="toolbar-back grid h-11 w-11 place-items-center rounded-full"><BackIcon /></button>
        <Link href="/" className="toolbar-title flex flex-1 flex-col font-display text-xl"><span>{title}</span>{hi && <small lang="hi">{hi}</small>}</Link>
        {hi ? <button type="button" aria-label="Search this collection" aria-expanded={search} className="toolbar-search grid h-11 w-11 place-items-center rounded-full" onClick={()=>setSearch(!search)}><SearchIcon size={22}/></button> : <div className="toolbar-language">{right}</div>}
      </div>
    </header>
  );
}

type Slot = "home" | "places" | "camera" | "stories" | "makers";
const SLOTS: { slot: Slot; href: string; icon: (p: { size?: number }) => ReactNode; centre?: boolean }[] = [
  { slot: "home", href: "/", icon: HomeIcon },
  { slot: "places", href: "/places", icon: PlacesIcon },
  { slot: "camera", href: "/camera", icon: CameraIcon, centre: true },
  { slot: "stories", href: "/stories", icon: StoriesIcon },
  { slot: "makers", href: "/artisans", icon: MakersIcon },
];
// Slots whose route exists (all five now).
const LIVE = new Set<Slot>(["home", "places", "camera", "stories", "makers"]);

/**
 * Bottom nav: Home, Places, Camera (centred), Stories, Makers.
 * Replaces the board's Map and Profile, which have no data and no accounts.
 */
export function BottomNav({ labels }: { labels: Record<Slot, string> }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav aria-label="Main" className="miras-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line-dark bg-ink pb-[env(safe-area-inset-bottom)] text-on-dark">
      <ul className="mx-auto flex h-[76px] max-w-md items-end justify-around px-2 pb-2">
        {SLOTS.filter((s) => LIVE.has(s.slot)).map(({ slot, href, icon: Icon, centre }) => (
          <li key={slot} className="flex flex-1 justify-center">
            {centre ? (
              <Link
                href={href}
                aria-label={labels[slot]}
                aria-current={active(href) ? "page" : undefined}
                className="-mt-8 grid h-16 w-16 place-items-center rounded-full bg-saffron text-ink shadow-lg ring-4 ring-ink"
              >
                <Icon size={28} />
              </Link>
            ) : (
              <Link
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={`flex min-h-11 min-w-11 flex-col items-center justify-end gap-0.5 text-[11px] leading-tight ${active(href) ? "text-saffron" : "text-muted-dark"}`}
              >
                <Icon size={22} />
                {labels[slot]}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
