import { HomeShell } from "@/components/HomeShell";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Splash } from "@/components/Splash";
import { getConfig } from "@/lib/config";
import { t, type DictKey } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import type { TimeMode } from "@/lib/time-of-day";

export default async function Home() {
  const lang = await getLang();
  const modes: TimeMode[] = ['dawn','day','golden','night'];
  const copy = Object.fromEntries(modes.map(m=>[m,{greetingHi:t('hi',`greeting_${m}` as DictKey),greetingEn:t('en',`greeting_${m}` as DictKey),headline:t('en',`hero_${m}` as DictKey),headlineHi:t('hi',`hero_${m}` as DictKey)}])) as Record<TimeMode,{greetingHi:string;greetingEn:string;headline:string;headlineHi:string}>;
  return <><Splash tagline="Udaipur, hour by hour." taglineHi="उदयपुर, घंटे-घंटे"/><HomeShell copy={copy} demoMode={getConfig().demoMode} lang={lang} top={<LanguageSwitch lang={lang}/>}/></>;
}
