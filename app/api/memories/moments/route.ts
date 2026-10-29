import { getAiProvider } from "@/lib/ai";
import { clientKey } from "@/lib/http";
import { limits, tooMany } from "@/lib/rate-limit";
import { MAX_FRAMES, pickMoments } from "@/lib/services/memories";
import { sniffImage } from "@/lib/sniff";

const MAX_FRAME_BYTES = 1.5 * 1024 * 1024;

/** Still frames in (one request), captions and verified stories out. Nothing is stored. */
export async function POST(req: Request) {
  if (!limits.memories.allow(await clientKey(req))) return tooMany();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: "Upload was incomplete. Please try again." }, { status: 400 });
  }
  const files = form.getAll("frames").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return Response.json({ ok: false, error: "No photos received." }, { status: 400 });
  if (files.length > MAX_FRAMES) return Response.json({ ok: false, error: `Please pick up to ${MAX_FRAMES} moments.` }, { status: 400 });
  if (files.some((f) => f.size > MAX_FRAME_BYTES)) return Response.json({ ok: false, error: "A photo is too large." }, { status: 413 });

  let chosen: (string | null)[] = [];
  try {
    const raw = JSON.parse(String(form.get("places") ?? "[]"));
    if (Array.isArray(raw)) chosen = raw.map((x) => (typeof x === "string" && x ? x : null));
  } catch {
    // No place choices: the model's suggestions (if any) are used.
  }

  // The real type comes from the first bytes, never from the label the browser sent.
  const buffers = await Promise.all(files.map(async (f) => Buffer.from(await f.arrayBuffer())));
  const mimes = buffers.map(sniffImage);
  if (mimes.some((m) => !m)) return Response.json({ ok: false, error: "A file is not a JPEG, PNG or WebP photo." }, { status: 415 });
  const frames = buffers.map((data, i) => ({ data, mime: mimes[i] as string }));
  const result = await pickMoments(getAiProvider(), frames, chosen);
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
