import { expect, test } from "@playwright/test";
import { ROADMAP, roadmapCounts, STATUS_LABEL } from "../../lib/roadmap";

// The roadmap is a read-only pitch page: nine cards, one honest status each, and nothing that looks like a working feature.

const LABELS = Object.values(STATUS_LABEL);

test("nine cards, each with exactly one of the three status labels", async ({ page }) => {
  await page.goto("/roadmap");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What is built, and what comes next");
  const cards = page.getByTestId("roadmap-card");
  await expect(cards).toHaveCount(9);
  for (let i = 0; i < 9; i++) {
    const status = cards.nth(i).getByTestId("roadmap-status");
    await expect(status).toHaveCount(1);
    expect(LABELS).toContain((await status.innerText()).trim());
    await expect(cards.nth(i).getByText("Today in MIRAS")).toBeVisible();
    await expect(cards.nth(i).getByText("Before we build it")).toBeVisible();
    // The status on the card is the one in the data file.
    expect((await status.innerText()).trim()).toBe(STATUS_LABEL[ROADMAP[i].status]);
  }
});

test("the three summary counts equal the counts in the data", async ({ page }) => {
  await page.goto("/roadmap");
  const expected = roadmapCounts();
  for (const status of ["built", "concept", "not_planned"] as const) {
    await expect(page.locator(`[data-testid=roadmap-summary] [data-status=${status}]`)).toHaveText(String(expected[status]));
  }
  // And they match what is actually on the cards.
  for (const label of LABELS) {
    const onCards = await page.getByTestId("roadmap-status").filter({ hasText: label }).count();
    const status = (Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).find((k) => STATUS_LABEL[k] === label)!;
    expect(onCards, label).toBe(expected[status]);
  }
});

test("nothing looks like a working feature: no rupee sign, no rating, no buttons, no book/buy/pay/follow/rent/chat links", async ({ page }) => {
  await page.goto("/roadmap");
  const main = page.locator("main");
  const text = await main.innerText();
  expect(text).not.toMatch(/₹|★|☆/);
  await expect(main.locator("button, input, select, textarea, form, [role=button]")).toHaveCount(0);
  const links = await main.locator("a").allInnerTexts();
  expect(links.map((l) => l.trim())).toEqual(["Back to Home"]);
  for (const l of links) expect(l).not.toMatch(/book|buy|pay|follow|rent|chat|log ?in|sign ?up|like/i);
});

test("Built (prototype) cards name a route that exists", async ({ page }) => {
  await page.goto("/roadmap");
  const built = page.getByTestId("roadmap-card").filter({ has: page.getByTestId("roadmap-status").filter({ hasText: "Built (prototype)" }) });
  expect(await built.count()).toBe(roadmapCounts().built);
  const routes = await built.locator("code").allInnerTexts();
  expect(routes.length).toBeGreaterThan(0);
  for (const r of routes.filter((x) => /^\/[a-z]+$/.test(x))) {
    const res = await page.request.get(r);
    expect(res.status(), r).toBeLessThan(400);
  }
});

test("linked from the footer, not from the bottom navigation, and no sideways scroll at 360 px", async ({ page }) => {
  await page.goto("/places");
  await expect(page.locator("footer a[href='/roadmap']")).toHaveCount(1);
  await expect(page.locator(".miras-bottom a[href='/roadmap']")).toHaveCount(0);
  await page.locator("footer a[href='/roadmap']").click();
  await expect(page).toHaveURL(/\/roadmap$/);
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
});
