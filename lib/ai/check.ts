import { describeError } from "@/lib/ai-log";
import type { AiProvider } from "./types";

export type AiCheckResult = { status: "ok" } | { status: "not_configured" } | { status: "failed"; kind: string };

// 1x1 transparent PNG. Small on purpose: this call only proves the key, the model name and the network work.
const TINY_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const hintFor = (e: unknown): string => {
  const status = (e as { status?: unknown } | null)?.status;
  if (typeof status === "number") {
    if (status === 404) return "check GEMINI_MODEL";
    if (status === 401 || status === 403) return "check GEMINI_API_KEY";
    if (status === 400) return "check GEMINI_MODEL and GEMINI_API_KEY";
    if (status === 429) return "quota or too many requests";
    if (status >= 500) return "Google's side, try again";
  }
  if ((e as Error | null)?.name === "AiTimeoutError") return "no answer in time, check the network";
  return "";
};

/** One tiny real call. Reports only the kind of failure: never the key, the response body or the full error message. */
export async function runAiCheck(provider: AiProvider): Promise<AiCheckResult> {
  if (provider.name !== "gemini") return { status: "not_configured" };
  try {
    await provider.matchPlace({ image: TINY_PNG, imageMime: "image/png", candidates: [{ id: "check", name: "Check" }] });
    return { status: "ok" };
  } catch (e) {
    const hint = hintFor(e);
    return { status: "failed", kind: `${describeError(e)}${hint ? `: ${hint}` : ""}` };
  }
}

export const describeCheck = (r: AiCheckResult) =>
  r.status === "ok" ? "ok" : r.status === "not_configured" ? "not configured (set GEMINI_API_KEY and GEMINI_MODEL)" : r.kind;
