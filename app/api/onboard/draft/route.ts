import { getAiProvider } from "@/lib/ai";
import { draftFromVoice, MAX_AUDIO_BYTES, MAX_IMAGE_BYTES } from "@/lib/services/onboarding";

const fail = (status: number, error: string) => Response.json({ ok: false, reason: "bad_request", error }, { status });

/** Audio + optional photo in, validated draft out. Nothing is stored here: the photo is only shown to the model. */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Upload was incomplete. Please try again.");
  }
  const audio = form.get("audio");
  const image = form.get("image");
  if (!(audio instanceof File)) return fail(400, "No recording received.");
  if (audio.size > MAX_AUDIO_BYTES) return fail(413, "Recording is too long. Please keep it under a minute.");
  if (image instanceof File && image.size > MAX_IMAGE_BYTES) return fail(413, "Photo is too large.");

  const result = await draftFromVoice(getAiProvider(), {
    audio: Buffer.from(await audio.arrayBuffer()),
    audioMime: audio.type.split(";")[0] || "audio/webm",
    ...(image instanceof File && image.size > 0 ? { image: Buffer.from(await image.arrayBuffer()), imageMime: image.type || "image/jpeg" } : {}),
  });
  return Response.json(result, { status: result.ok ? 200 : result.reason === "empty_audio" ? 422 : 200 });
}
