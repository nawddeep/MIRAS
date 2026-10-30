import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// List and card views drop the leading "SAMPLE:" / "Sample " from a sample entry's title. Detail pages keep the full stored title.
// Every sample card still tells assistive technology "Sample content", and the "Demo data" pill is on every screen.

const stored = (dir: string) =>
  fs
    .readdirSync(path.resolve("content", dir))
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => {
      const j = JSON.parse(fs.readFileSync(path.resolve("content", dir, f), "utf8"));
      return (Array.isArray(j) ? j : [j]) as Record<string, string>[];
    });

const PREFIXED = /^(SAMPLE:|Sample )/;

test("stories list: no visible title starts with SAMPLE: or Sample, the stored titles still do, every card says 'Sample content'", async ({ page }) => {
  expect(stored("stories").some((s) => s.title.startsWith("SAMPLE:")), "stored content still has the prefix").toBe(true);
  await page.goto("/stories");
  const cards = page.locator("[data-testid=story-card]");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const title of await cards.locator("h3").allInnerTexts()) expect(title, "visible title").not.toMatch(PREFIXED);
  await expect(page.locator("[data-testid=story-card]:not(:has(.sr-only))")).toHaveCount(0);
  await expect(cards.locator(".sr-only").first()).toHaveText("Sample content");
  await expect(page.getByRole("link", { name: /History story 1 for Pichhola/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Demo data/ })).toBeVisible();
});

test("makers list: 'Sample Artisan 2' shows as 'Artisan 2', the stored name still starts with Sample", async ({ page }) => {
  expect(stored("artisans").some((a) => a.name.startsWith("Sample ")), "stored content still has the prefix").toBe(true);
  await page.goto("/artisans");
  const cards = page.locator("main a.rounded-card[href^='/artisans/sample-']");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const title of await cards.locator("h3").allInnerTexts()) expect(title, "visible title").not.toMatch(PREFIXED);
  await expect(page.locator("main a.rounded-card[href^='/artisans/sample-']:not(:has(.sr-only))")).toHaveCount(0);
  await expect(cards.locator("h3", { hasText: /^Artisan 2$/ })).toHaveCount(1);
});

test("places list: titles are unchanged and every card still says 'Sample content'", async ({ page }) => {
  await page.goto("/places");
  const cards = page.locator(".place-photo-card");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const title of await cards.locator("h2").allInnerTexts()) expect(title).not.toMatch(PREFIXED);
  await expect(page.locator(".place-photo-card:not(:has(.sr-only))")).toHaveCount(0);
});

test("detail pages show the full stored title", async ({ page }) => {
  const story = stored("stories").find((s) => s.title.startsWith("SAMPLE:") && s.language === "en")!;
  await page.goto(`/stories/${story.id}`);
  await expect(page.locator("main h1")).toContainText(story.title);
  await expect(page.locator("main span.border-dashed").filter({ hasText: /^Sample content$/ }).first()).toBeVisible();

  await page.goto("/artisans/sample-artisan-2");
  await expect(page.locator("main h1")).toContainText("Sample Artisan 2");
  await expect(page.locator("main span.border-dashed").filter({ hasText: /^Sample content$/ }).first()).toBeVisible();
});

test("no sideways scroll at 360 px on the changed list screens", async ({ page }) => {
  for (const route of ["/stories", "/artisans", "/places"]) {
    await page.goto(route);
    const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scroll, route).toBeLessThanOrEqual(width);
  }
});
