import { describe, expect, it, vi } from "vitest";
import { describeCheck, runAiCheck } from "@/lib/ai/check";
import { GeminiAiProvider } from "@/lib/ai/gemini";
import { AiTimeoutError, createGate, robustCall } from "@/lib/ai/robust";
import type { AiProvider } from "@/lib/ai/types";

const httpError = (status: number) => Object.assign(new Error("boom with secret AIzaSy-FAKE-KEY-0123456789"), { name: "ApiError", status });
const opts = { timeoutMs: 1000, jitterMs: 0 };

describe("robustCall", () => {
  it("returns the value on success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    expect(await robustCall(fn, opts)).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it.each([429, 500, 503])("retries once on %i and returns the second answer", async (status) => {
    const fn = vi.fn().mockRejectedValueOnce(httpError(status)).mockResolvedValue("ok");
    expect(await robustCall(fn, opts)).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it.each([429, 503])("gives up after one retry when %i repeats", async (status) => {
    const fn = vi.fn().mockRejectedValue(httpError(status));
    await expect(robustCall(fn, opts)).rejects.toMatchObject({ status });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it.each([400, 401, 403, 404])("never retries on %i", async (status) => {
    const fn = vi.fn().mockRejectedValue(httpError(status));
    await expect(robustCall(fn, opts)).rejects.toMatchObject({ status });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("aborts a call that does not answer and throws AiTimeoutError, with no retry", async () => {
    const fn = vi.fn((signal: AbortSignal) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))));
    await expect(robustCall(fn, { timeoutMs: 20, jitterMs: 0 })).rejects.toBeInstanceOf(AiTimeoutError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("runs at most the gate limit at once", async () => {
    const gate = createGate(4);
    let running = 0;
    let peak = 0;
    const fn = async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return 1;
    };
    await Promise.all(Array.from({ length: 12 }, () => robustCall(fn, { ...opts, gate })));
    expect(peak).toBe(4);
  });
});

const fake = (name: "mock" | "gemini", matchPlace: () => Promise<unknown>): AiProvider => ({
  name,
  matchPlace,
  draftListing: async () => "",
  pickMoments: async () => "",
});

describe("ai check", () => {
  it("reports ok", async () => {
    expect(describeCheck(await runAiCheck(fake("gemini", async () => "{}")))).toBe("ok");
  });

  it("reports not configured for the mock without calling it", async () => {
    const call = vi.fn();
    const r = await runAiCheck(fake("mock", call));
    expect(r).toEqual({ status: "not_configured" });
    expect(call).not.toHaveBeenCalled();
  });

  it.each([
    [404, "ApiError (HTTP 404): check GEMINI_MODEL"],
    [403, "ApiError (HTTP 403): check GEMINI_API_KEY"],
    [429, "ApiError (HTTP 429): quota or too many requests"],
    [503, "ApiError (HTTP 503): Google's side, try again"],
  ])("failure %i gives the kind and a hint, never the message or key", async (status, expected) => {
    const text = describeCheck(await runAiCheck(fake("gemini", async () => Promise.reject(httpError(status)))));
    expect(text).toBe(expected);
    expect(text).not.toMatch(/AIzaSy|secret|boom/);
  });

  it("failure on timeout names the kind", async () => {
    const text = describeCheck(await runAiCheck(fake("gemini", async () => Promise.reject(new AiTimeoutError()))));
    expect(text).toMatch(/^AiTimeoutError: no answer in time/);
  });
});

describe("GeminiAiProvider", () => {
  it("passes an abort signal to the SDK and survives a 503 then success", async () => {
    const provider = new GeminiAiProvider("AIzaSy-FAKE-KEY-0123456789", "fake-model");
    const generateContent = vi.fn().mockRejectedValueOnce(httpError(503)).mockResolvedValue({ text: "{}" });
    (provider as unknown as { client: unknown }).client = { models: { generateContent } };
    process.env.GEMINI_TIMEOUT_MS = "2000";
    const out = await provider.matchPlace({ image: Buffer.from("x"), imageMime: "image/png", candidates: [{ id: "a", name: "A" }] });
    delete process.env.GEMINI_TIMEOUT_MS;
    expect(out).toBe("{}");
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(generateContent.mock.calls[0][0].config.abortSignal).toBeInstanceOf(AbortSignal);
  });
});
