import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as cameraPOST } from "@/app/api/camera/match/route";
import { clientKey } from "@/lib/http";
import { createRateLimiter, limits } from "@/lib/rate-limit";
import { place, withFixture } from "./helpers";

const req = (headers: Record<string, string>) => new Request("http://x/api", { method: "POST", headers });
const id = (c: string) => `miras_cid=${c.padEnd(24, "x")}`;

afterEach(() => {
  delete process.env.TRUST_PROXY;
});

describe("clientKey with TRUST_PROXY off (default)", () => {
  it("ignores x-forwarded-for and x-real-ip, so a forged header gets no new bucket", async () => {
    const a = await clientKey(req({ "x-forwarded-for": "1.1.1.1" }));
    const b = await clientKey(req({ "x-forwarded-for": "2.2.2.2", "x-real-ip": "3.3.3.3", "cf-connecting-ip": "4.4.4.4" }));
    expect(a).toBe(b);
  });

  it("gives two cookie ids separate keys, and ignores a malformed id", async () => {
    const a = await clientKey(req({ cookie: id("aaa") }));
    const b = await clientKey(req({ cookie: id("bbb") }));
    expect(a).not.toBe(b);
    expect(await clientKey(req({ cookie: "miras_cid=short" }))).toBe(await clientKey(req({})));
  });
});

describe("clientKey with TRUST_PROXY=true (behind a tunnel)", () => {
  it("uses cf-connecting-ip first, then the LAST x-forwarded-for hop, never the first", async () => {
    process.env.TRUST_PROXY = "true";
    expect(await clientKey(req({ "cf-connecting-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1, 8.8.8.8" }))).toBe("9.9.9.9");
    expect(await clientKey(req({ "x-forwarded-for": "6.6.6.6, 8.8.8.8" }))).toBe("8.8.8.8");
  });
});

describe("rate limit on a real route", () => {
  beforeEach(() => Object.values(limits).forEach((l) => l.reset()));
  const call = (headers: Record<string, string>) => {
    const form = new FormData();
    form.append("demoPlaceId", "p1");
    return cameraPOST(new Request("http://x/api/camera/match", { method: "POST", body: form, headers }));
  };

  it("a spoofed x-forwarded-for cannot bypass the limit: request 21 is 429", async () => {
    withFixture({ places: [place()] });
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await call({ "x-forwarded-for": `10.0.0.${i}` })).status);
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
  });

  it("two clients with their own cookies get separate buckets", async () => {
    withFixture({ places: [place()] });
    for (let i = 0; i < 20; i++) await call({ cookie: id("aaa") });
    expect((await call({ cookie: id("aaa") })).status).toBe(429);
    expect((await call({ cookie: id("bbb") })).status).toBe(200);
  });
});

describe("global ceiling", () => {
  it("returns false once all clients together reach it, even if each is under its own limit", () => {
    const l = createRateLimiter(5, 1000, 3);
    expect([l.allow("a", 0), l.allow("b", 1), l.allow("c", 2), l.allow("d", 3)]).toEqual([true, true, true, false]);
    expect(l.allow("e", 1500)).toBe(true);
  });

  it("defaults: camera ceiling 120 per minute", () => {
    const l = limits.cameraMatch;
    l.reset();
    const results = Array.from({ length: 121 }, (_, i) => l.allow(`client-${i}`, 0));
    expect(results.filter(Boolean)).toHaveLength(120);
    l.reset();
  });
});
