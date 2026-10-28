"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { parseHourParam, sceneFor, timeOfDay, type TimeMode } from "@/lib/time-of-day";
import { ArrowIcon, BookmarkIcon, SearchIcon } from "./icons";
import { HeroScene } from "./scene";

type Copy = Record<TimeMode, { greetingHi: string; greetingEn: string; headline: string; headlineHi: string }>;

export function HomeShell({ copy, demoMode, top }: { copy: Copy; demoMode: boolean; lang: Lang; top: ReactNode; children?: ReactNode }) {
  const [mode, setMode] = useState<TimeMode>("dawn");
  const [notice, setNotice] = useState(false);
  useEffect(() => {
    const update = () => {
      const forced = demoMode ? parseHourParam(new URLSearchParams(window.location.search).get("hour")) : null;
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
      setMode(timeOfDay(forced ?? hour));
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [demoMode]);
  const c = copy[mode];
  const dark = mode === 'night';
  const golden = mode === 'golden';
  const categories = [
    { name:'Places',hi:'स्थल',image:'palace',href:'/places' },
    { name:'Artisans',hi:'कारीगर',image:'artisan',href:'/artisans' },
    { name:'Food',hi:'भोजन',image:'golden',href:'/search?q=food' },
    { name:'Experiences',hi:'अनुभव',image:'garden',href:'/trails' },
  ];
  return <div data-time={mode} data-testid="home-shell" className={`hours-home ${dark ? 'on-dark' : ''}`}>
    <section className="hours-hero">
      <HeroScene scene={sceneFor(mode)} className="hours-hero-photo" />
      <div className="hours-hero-wash" />
      <header className="hours-greeting">
        <div><p lang="hi">{mode==='dawn'?'सुबह का उदय':mode==='golden'?'शाम का उजास':c.greetingHi}</p><p>{c.greetingEn}</p></div>
        <div className="hours-tools">
          <button type="button" aria-label="Notifications" aria-expanded={notice} onClick={()=>setNotice(!notice)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3V9M10 21h4"/></svg><i /></button>
          <Link href="/passport" aria-label="Your heritage passport"><BookmarkIcon size={20}/></Link>
        </div>
      </header>
      {notice && <div role="status" className="hours-notice">You’re all caught up. Live local alerts are not connected in this demo.</div>}
      <div className="hours-headline anim-arrival">
        <h1>{dark ? <><span>शुभ रात्रि</span><small>Good night</small></> : golden ? <>Pichhola<small>in golden hours.</small></> : mode==='day' ? <>A little closer<small>to Udaipur.</small></> : <>Udaipur<small>in the morning light.</small></>}</h1>
        {!dark && <p lang="hi">{golden ? 'साँझ में पिघलता उदयपुर' : mode==='day' ? 'हर मोड़ पर एक कहानी' : 'जब झील सुनहरी हो उठती है'}</p>}
      </div>
    </section>
    <div className="hours-home-content">
      <form action="/search" role="search" className="hours-search"><SearchIcon size={20}/><label htmlFor="home-q" className="sr-only">Search places, experiences, artisans</label><input id="home-q" name="q" placeholder={dark?'Search stories, places…':'Search places, experiences, artisans…'} type="search"/></form>
      <nav aria-label="Categories" className="hours-shortcuts">{categories.map(c=><Link href={c.href} key={c.name}><span style={{backgroundImage:`url(/media/pichhola/${c.image}.webp)`}}/><strong>{c.name}</strong><small lang="hi">{c.hi}</small></Link>)}</nav>
      <section className="hours-feature"><div className="hours-section-heading"><h2>{dark?'Tonight at Pichhola':golden?'Continue Exploring':'Today in Udaipur'}</h2><Link href="/stories">See all</Link></div>
        {demoMode ? <Link href={golden?'/places/city-palace':'/stories/city-palace-sample-1'} className="hours-feature-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/media/pichhola/${dark?'moonlight':golden?'golden':'story'}.webp`} alt="Lake Pichhola and palace reflections"/>
          <span><strong>{dark?'Moonlight on the Lake':golden?'City Palace':'Sunrise over Lake Pichhola'}</strong><small>{dark?'A different kind of beauty':golden?'A royal legacy by the lake':'A city waking with the water'}</small></span><ArrowIcon size={21}/>
        </Link> : <p>No reviewed stories are published yet. <Link href="/places">Explore available places</Link></p>}
      </section>
      <div className="hours-footnote"><span className="hours-sample">Sample content</span><span>Illustrative imagery supplied for MIRAS</span></div>
      {demoMode && <div className="hours-more"><h2>There is more to discover</h2><Link href="/places/city-palace">City Palace <ArrowIcon size={18}/></Link><Link href="/places/pichhola">Pichhola <ArrowIcon size={18}/></Link><Link href="/artisans/sample-artisan-1">Rajasthan Miniature Painting <ArrowIcon size={18}/></Link></div>}
      <details className="hours-settings"><summary>Make it your hour</summary><div className="hours-preview">{[['Dawn',7],['Day',12],['Golden',17],['Night',22]].map(([name,hour])=><Link key={name} href={`/?hour=${hour}&nosplash`}>{name}</Link>)}</div><div>{top}</div><p>Time follows Udaipur (Asia/Kolkata). Theme links are demo previews.</p></details>
    </div>
  </div>;
}
