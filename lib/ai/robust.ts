// Timeout, one retry and a concurrency cap around every Gemini call. Provider-agnostic so it can be tested with a fake.

export class AiTimeoutError extends Error {
  override name = "AiTimeoutError";
  constructor() {
    super("The model did not answer in time.");
  }
}

/** At most `limit` calls run at once; the rest wait their turn. */
export function createGate(limit: number) {
  let running = 0;
  const waiting: (() => void)[] = [];
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (running >= limit) await new Promise<void>((resolve) => waiting.push(resolve));
    running++;
    try {
      return await fn();
    } finally {
      running--;
      waiting.shift()?.();
    }
  };
}

export const sharedGate = createGate(4);

const statusOf = (e: unknown) => (e as { status?: unknown } | null)?.status;
/** Only a busy or broken server is worth one more try. A wrong key, model or request will fail the same way again. */
export const isRetryable = (e: unknown) => {
  const s = statusOf(e);
  return typeof s === "number" && (s === 429 || (s >= 500 && s <= 599));
};

export type RobustOptions = { timeoutMs: number; jitterMs?: number; gate?: ReturnType<typeof createGate> };

export function geminiTimeoutMs(): number {
  const n = Number(process.env.GEMINI_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : 25_000;
}

export async function robustCall<T>(fn: (signal: AbortSignal) => Promise<T>, opts: RobustOptions): Promise<T> {
  const attempt = async (): Promise<T> => {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeoutMs);
    try {
      return await fn(controller.signal);
    } catch (e) {
      throw timedOut ? new AiTimeoutError() : e;
    } finally {
      clearTimeout(timer);
    }
  };
  return (opts.gate ?? sharedGate)(async () => {
    try {
      return await attempt();
    } catch (e) {
      if (!isRetryable(e)) throw e;
      const jitter = opts.jitterMs ?? 300 + Math.random() * 500;
      await new Promise((r) => setTimeout(r, jitter));
      return attempt();
    }
  });
}
