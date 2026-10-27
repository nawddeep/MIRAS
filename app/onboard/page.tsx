import { OnboardFlow } from "@/components/OnboardFlow";
import { Label } from "@/components/ui";
import { aiStatus } from "@/lib/ai";
import { getConfig } from "@/lib/config";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

export default async function OnboardPage() {
  const lang = await getLang();
  const ai = aiStatus();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">{t(lang, "onboardTitle")}</h1>
      <p className="text-ink-soft">
        Speak for a minute about your work. An assistant turns it into a draft listing. You check and edit every word, and nothing is public
        until you tap Publish.
      </p>
      {!ai.configured && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-saffron/15 p-3 text-sm">
          <Label tone="warn">Demo response</Label> The AI assistant is not configured, so drafts are placeholder text.
        </p>
      )}
      <OnboardFlow uploadTimeoutMs={getConfig().uploadTimeoutMs} />
    </div>
  );
}
