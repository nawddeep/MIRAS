import { CameraMode } from "@/components/CameraMode";
import { aiStatus } from "@/lib/ai";
import { getConfig } from "@/lib/config";
import { pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { getVisiblePlaces } from "@/lib/services/content";

export default async function CameraPage() {
  const lang = await getLang();
  const places = getVisiblePlaces().map((p) => ({ id: p.id, name: pick(lang, p.name, p.name_hi) }));
  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Camera story mode</h1>
      <p className="text-ink-soft">
        Point your camera at one of {places.length} supported places to read its stories. If MIRAS is not sure, it says so instead of guessing.
      </p>
      <CameraMode lang={lang} demo={!aiStatus().configured} places={places} uploadTimeoutMs={getConfig().uploadTimeoutMs} />
    </div>
  );
}
