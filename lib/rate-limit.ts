// Sliding-window limiter per client, in memory. Fine for one demo server; a hosted store can replace it.

/** `globalMax` is a ceiling for all clients together, so many forged client keys still cannot run up the AI bill. */
export function createRateLimiter(max: number, windowMs: number, globalMax = Infinity) {
  const hits = new Map<string, number[]>();
  let all: number[] = [];
  return {
    /** Records a hit and returns false if this client, or all clients together, are over the limit. */
    allow(key: string, now = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      all = all.filter((t) => now - t < windowMs);
      if (recent.length >= max || all.length >= globalMax) {
        hits.set(key, recent);
        return false;
      }
      hits.set(key, [...recent, now]);
      all.push(now);
      return true;
    },
    reset() {
      hits.clear();
      all = [];
    },
  };
}

export const tooMany = () => Response.json({ ok: false, error: "Too many requests. Please wait a minute and try again." }, { status: 429 });

const ceiling = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// One limiter per AI or upload endpoint. The last argument is the all-clients ceiling (env-configurable).
export const limits = {
  cameraMatch: createRateLimiter(20, 60_000, ceiling("RATE_GLOBAL_CAMERA", 120)),
  onboardDraft: createRateLimiter(10, 10 * 60_000, ceiling("RATE_GLOBAL_ONBOARD_DRAFT", 60)),
  onboardSubmit: createRateLimiter(5, 10 * 60_000),
  memories: createRateLimiter(10, 10 * 60_000, ceiling("RATE_GLOBAL_MEMORIES", 60)),
  picks: createRateLimiter(5, 10 * 60_000),
};
