"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { compressImage, fetchWithTimeout, mediaErrorMessage, TimeoutError } from "@/lib/client/media";
import { pick, t, type Lang } from "@/lib/i18n";
import type { CameraResult } from "@/lib/services/camera";
import { StoryBlock } from "./domain";
import { Button, IDontKnow, Label } from "./ui";

const TOO_DARK = 40; // mean brightness out of 255

export function CameraMode({
  lang,
  demo,
  places,
  uploadTimeoutMs,
}: {
  lang: Lang;
  demo: boolean;
  places: { id: string; name: string }[];
  uploadTimeoutMs: number;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CameraResult | null>(null);

  useEffect(() => () => stream.current?.getTracks().forEach((tr) => tr.stop()), []);

  async function startCamera() {
    setMessage(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser cannot open the camera here. Choose a photo instead.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (video.current) {
        video.current.srcObject = stream.current;
        await video.current.play();
      }
      setLive(true);
    } catch (e) {
      setMessage(mediaErrorMessage(e, "camera").replace("use the typed form below", "choose a photo instead"));
    }
  }

  function stopCamera() {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setLive(false);
  }

  async function send(input: { source: Blob | HTMLVideoElement } | { demoPlaceId: string }) {
    setBusy(true);
    setMessage(null);
    setResult(null);
    try {
      const form = new FormData();
      if ("demoPlaceId" in input) form.append("demoPlaceId", input.demoPlaceId);
      else {
        const { blob, brightness } = await compressImage(input.source, 1024, 0.7);
        if (brightness < TOO_DARK) {
          setMessage("That photo is too dark. Try again with more light.");
          return;
        }
        form.append("frame", blob, "frame.jpg");
      }
      const res = await fetchWithTimeout("/api/camera/match", { method: "POST", body: form }, uploadTimeoutMs);
      const body = await res.json();
      if (!res.ok) setMessage(body.error ?? t(lang, "errorBody"));
      else {
        setResult(body);
        if (body.known) stopCamera();
      }
    } catch (e) {
      setMessage(e instanceof TimeoutError ? "Slow connection. Please try again." : "Could not check that photo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-ink">
        <video ref={video} playsInline muted className={`aspect-[3/4] w-full object-cover sm:aspect-video ${live ? "" : "hidden"}`} />
        {!live && <div className="grid aspect-[3/4] place-items-center p-6 text-center text-paper/80 sm:aspect-video">Point your camera at a monument.</div>}
      </div>
      <div className="flex flex-wrap gap-2">
        {live ? (
          <>
            <Button type="button" variant="accent" disabled={busy} onClick={() => video.current && send({ source: video.current })}>
              {busy ? "Checking…" : "What is this?"}
            </Button>
            <Button type="button" variant="secondary" onClick={stopCamera}>
              Close camera
            </Button>
          </>
        ) : (
          <Button type="button" onClick={startCamera}>
            Open camera
          </Button>
        )}
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-ink/30 px-5">
          Choose a photo
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) send({ source: f });
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-xs text-ink-soft">Your photo is used only for this check and is not saved.</p>

      {demo && (
        <div className="space-y-2 rounded-2xl border border-dashed border-saffron p-3">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <Label tone="warn">Demo response</Label> AI is not configured, so the camera cannot recognise places. Pick one to see how it works:
          </p>
          <div className="flex flex-wrap gap-2">
            {places.map((p) => (
              <Button key={p.id} type="button" variant="secondary" disabled={busy} onClick={() => send({ demoPlaceId: p.id })}>
                {p.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className="rounded-xl bg-rose/15 p-3 text-sm">
          {message}
        </p>
      )}

      {result && !result.known && (
        <IDontKnow
          lang={lang}
          title={t(lang, "dontKnowPlace")}
          body={
            result.reason === "person"
              ? "This looks like a photo of a person. Point the camera at a monument instead. People's photos are not used."
              : "Try a clearer photo, or search for the place."
          }
        />
      )}

      {result?.known && (
        <section className="space-y-3" data-testid="camera-match">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl">{pick(lang, result.place.name, result.place.name_hi)}</h2>
            {result.demo && <Label tone="warn">Demo response</Label>}
          </div>
          {result.stories.length ? result.stories.map((s) => <StoryBlock key={s.id} story={s} lang={lang} />) : <IDontKnow lang={lang} />}
          <Link href={`/places/${result.place.slug}`} className="inline-block underline">
            Open the place page
          </Link>
        </section>
      )}
    </div>
  );
}
