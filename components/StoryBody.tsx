"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { pick, t, type Lang } from "@/lib/i18n";
import type { StoryEntry } from "@/lib/schemas";
import { Label } from "./ui";

const subscribeNoop = () => () => {};

/**
 * Story text with two optional controls:
 * - "Simple version", only when a person has checked simpleText against the source (simpleTextChecked).
 * - "Listen", using the browser's built-in speech synthesis, always labelled "Synthetic voice".
 */
export function StoryBody({ story, lang }: { story: StoryEntry; lang: Lang }) {
  const canSimple = story.simpleTextChecked && Boolean(story.simpleText?.trim());
  const [simple, setSimple] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const canSpeak = useSyncExternalStore(
    subscribeNoop,
    () => "speechSynthesis" in window,
    () => false,
  );
  const text = simple && canSimple ? story.simpleText! : pick(lang, story.text, story.text_hi);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function toggleSpeak() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "hi" && !(simple && canSimple) && story.text_hi ? "hi-IN" : "en-IN";
    u.onend = u.onerror = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="leading-relaxed whitespace-pre-line">{text}</p>
      {(canSimple || canSpeak) && (
        <div className="flex flex-wrap items-center gap-2">
          {canSimple && (
            <button type="button" onClick={() => setSimple(!simple)} className="min-h-9 rounded-full border border-ink/25 px-3 text-sm" aria-pressed={simple}>
              {simple ? t(lang, "fullVersion") : t(lang, "simpleVersion")}
            </button>
          )}
          {canSpeak && (
            <>
              <button type="button" onClick={toggleSpeak} className="min-h-9 rounded-full border border-ink/25 px-3 text-sm" aria-pressed={speaking}>
                {speaking ? t(lang, "stop") : t(lang, "listen")}
              </button>
              <Label tone="warn">{t(lang, "syntheticVoice")}</Label>
            </>
          )}
        </div>
      )}
    </div>
  );
}
