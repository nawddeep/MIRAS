import { IDontKnow, SampleBadge } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

export default async function Home() {
  const lang = await getLang();
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">{t(lang, "tagline")}</h1>
      <SampleBadge lang={lang} />
      <IDontKnow lang={lang} />
    </div>
  );
}
