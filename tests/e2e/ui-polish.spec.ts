import { expect, test, type Page } from "@playwright/test";

// UI polish, theme unchanged: 44 px tap targets, no sideways scroll, visible focus, subtle motion, skeletons, empty states.

const LIVE = "http://localhost:3101"; // second server with demo mode off (see playwright.config.ts): lists are empty there
const ROUTES = [
  "/?nosplash",
  "/places",
  "/places/pichhola",
  "/stories",
  "/stories/city-palace-sample-1",
  "/artisans",
  "/artisans/sample-artisan-1",
  "/camera",
  "/plan",
  "/trails",
  "/trails/sample-lake-palace",
  "/trails/sample-lake-palace/walk",
  "/memories",
  "/passport",
  "/picks",
  "/events",
  "/search",
  "/search?q=palace",
  "/offline",
  "/replay",
  "/concept/ar",
  "/story",
  "/onboard",
  "/roadmap",
  "/admin",
  "/admin/moderation",
];

/** Visible buttons, links and form controls smaller than 44 x 44 px (a file input counts as its label). */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel = "a[href], button, summary, input:not([type=hidden]), select, textarea, [role=button], [role=tab]";
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest(".sr-only, .skip-link")) continue;
      const cs = getComputedStyle(el);
      const r0 = el.getBoundingClientRect();
      if (r0.width === 0 || r0.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
      if (cs.position === "absolute" && r0.width <= 2) continue;
      let target: Element = el;
      if (el instanceof HTMLInputElement && ["file", "checkbox", "radio"].includes(el.type)) target = el.closest("label") ?? el;
      const r = target.getBoundingClientRect();
      if (r.width >= 43.5 && r.height >= 43.5) continue;
      out.push(`${target.tagName.toLowerCase()} "${(target.getAttribute("aria-label") ?? target.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  });
}

for (const route of ROUTES) {
  test(`${route}: no sideways scroll and every button and link is at least 44 px`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll, "no sideways scroll").toBeLessThanOrEqual(width);
    expect(await smallTargets(page), "targets under 44 px").toEqual([]);
  });
}

test("motion is subtle (about 180 ms ease) and is switched off under reduced motion", async ({ page }) => {
  await page.goto("/places");
  const duration = () => page.locator("footer a").first().evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(await duration()).toContain("0.18s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await duration()).toBe("0s");
});

test("every tab stop shows a visible focus indicator", async ({ page }) => {
  for (const route of ["/places", "/artisans/sample-artisan-1", "/memories"]) {
    await page.goto(route);
    const bad: string[] = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el.getBoundingClientRect().width === 0) return null;
        const own = (e: Element) => {
          const cs = getComputedStyle(e);
          return (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow !== "" && cs.boxShadow !== "none");
        };
        const wrapper = el.closest("label, summary, .hours-search");
        return { ok: own(el) || (wrapper ? own(wrapper) : false), name: `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 20)}"` };
      });
      if (info && !info.ok) bad.push(info.name);
    }
    expect(bad, route).toEqual([]);
  }
});

// A page whose local database never answers shows a skeleton, not an empty list.
const stalledIndexedDb = () => {
  indexedDB.open = () => ({}) as IDBOpenDBRequest;
};

test("saved offline copies: a skeleton while loading", async ({ page }) => {
  await page.addInitScript(stalledIndexedDb);
  await page.goto("/offline");
  const loading = page.getByRole("status", { name: "Loading saved copies" });
  await expect(loading).toBeVisible();
  await expect(loading).toHaveAttribute("aria-busy", "true");
  await expect(page.getByText("Nothing saved yet.")).toHaveCount(0);
});

test("saved memories: a skeleton while loading", async ({ page }) => {
  await page.addInitScript(stalledIndexedDb);
  await page.goto("/memories");
  await expect(page.getByRole("status", { name: "Loading saved memories" })).toBeVisible();
  await expect(page.getByText("Nothing saved yet.")).toHaveCount(0);
});

test("empty states say what to do next", async ({ page }) => {
  // Offline copies, nothing saved yet.
  await page.goto("/offline");
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse places" })).toBeVisible();
  // Memories, nothing saved yet: the next step is named.
  await page.goto("/memories");
  await expect(page.getByText("Nothing saved yet.")).toBeVisible();
  await expect(page.getByText("To start, pick up to five photos or clips in step 1 above.")).toBeVisible();
  // Live mode has no sample content, so these lists are empty: each offers a link onward.
  for (const route of ["/artisans", "/trails", "/events"]) {
    await page.goto(`${LIVE}${route}`);
    await expect(page.getByText("Nothing here yet"), route).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: "Places" }), route).toBeVisible();
  }
});
