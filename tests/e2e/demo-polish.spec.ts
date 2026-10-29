import { expect, test, type Page } from "@playwright/test";

// Less badge clutter, same honesty: one "Demo data" pill on every screen, a quiet marker on list cards,
// the full "Sample content" badge on detail pages, and never a verification claim on a sample entry.

const LIVE = "http://localhost:3101"; // second server, started with NEXT_PUBLIC_DEMO_MODE=false (see playwright.config.ts)
const SCREENS = ["/", "/camera", "/places", "/stories", "/artisans", "/places/pichhola", "/artisans/sample-artisan-1"];
const CLAIMS = /Consent recorded|Confirmed by the maker|Verified source|Verified by/;

const noSidewaysScroll = async (page: Page) => {
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
};

for (const path of SCREENS) {
  test(`${path}: the Demo data pill is there, readable, links to the explanation, and nothing scrolls sideways`, async ({ page }) => {
    await page.goto(path);
    const pill = page.getByRole("link", { name: /Demo data/ });
    await expect(pill).toBeVisible();
    expect((await pill.boundingBox())!.height).toBeGreaterThanOrEqual(32);
    await expect(pill).toHaveAttribute("href", "#sample-data");
    await expect(page.locator("#sample-data")).toContainText("Places, stories and makers marked as sample are placeholders. Nothing marked sample is real.");
    await expect(page.locator(".demo-notice")).toContainText("Demo mode: sample content is shown and badged. Nothing marked sample is real.");
    await noSidewaysScroll(page);
  });
}

test("list cards carry a quiet marker named 'Sample content' instead of the dashed badge", async ({ page }) => {
  const lists: [string, string][] = [
    ["/places", ".place-photo-card"],
    ["/stories", "[data-testid=story-card]"],
    // Only the sample makers: a listing created by another test is a real entry and rightly has no sample marker.
    ["/artisans", "main a.rounded-card[href^='/artisans/sample-']"],
  ];
  for (const [path, card] of lists) {
    await page.goto(path);
    const cards = page.locator(card);
    expect(await cards.count(), `${path} has cards`).toBeGreaterThan(0);
    // Every card has the hidden text label (never colour alone) and none has the dashed badge.
    await expect(page.locator(`${card}:not(:has(.sr-only))`)).toHaveCount(0);
    await expect(page.locator(`${card} .sr-only`).first()).toHaveText("Sample content");
    await expect(page.locator(`${card} span.border-dashed`).filter({ hasText: "Sample content" })).toHaveCount(0);
  }
});

test("detail pages keep the full visible 'Sample content' badge", async ({ page }) => {
  const badge = (p: Page) => p.locator("main span.border-dashed").filter({ hasText: /^Sample content$/ }).first();

  await page.goto("/places/pichhola");
  await expect(badge(page)).toBeVisible();

  await page.goto("/stories");
  await page.locator("[data-testid=story-card]").first().click();
  await expect(page).toHaveURL(/\/stories\/.+/);
  await expect(badge(page)).toBeVisible();

  await page.goto("/artisans/sample-artisan-1");
  await expect(badge(page)).toBeVisible();
});

test("a sample entry never shows a verification or consent claim", async ({ page }) => {
  for (const path of ["/places", "/places/pichhola", "/stories", "/artisans", "/artisans/sample-artisan-1"]) {
    await page.goto(path);
    await expect(page.locator("body"), path).not.toContainText(CLAIMS);
  }
  await page.goto("/stories");
  await page.locator("[data-testid=story-card]").first().click();
  await expect(page.locator("body")).not.toContainText(CLAIMS);
});

test("with demo mode off: no pill, no sample content, no sample markers", async ({ page }) => {
  for (const path of ["/", "/places", "/stories", "/artisans"]) {
    await page.goto(`${LIVE}${path}`);
    await expect(page.getByRole("link", { name: /Demo data/ }), path).toHaveCount(0);
    await expect(page.locator("#sample-data"), path).toHaveCount(0);
    await expect(page.locator("body"), path).not.toContainText("SAMPLE:");
    // Home has a fixed footnote about its supplied imagery ("Sample content · Illustrative imagery"). It is not a sample entry,
    // so only the list screens are held to "no Sample content text at all".
    if (path !== "/") await expect(page.locator("body"), path).not.toContainText("Sample content");
  }
});
