import { expect, test, type Page } from "@playwright/test";

// What a phone shows when the camera cannot start: the page was opened over plain http (the browser then has no
// navigator.mediaDevices at all), or the visitor tapped "Don't allow". Either way there must be a clear message,
// a manual way to pick the place, and Photo and Upload must still be offered.

async function openCamera(page: Page) {
  await page.goto("/camera");
  await page.getByRole("button", { name: "Open camera" }).click();
}

async function expectWayForward(page: Page) {
  await expect(page.getByText("The camera is blocked")).toBeVisible();
  await expect(page.getByText("Pick the place you are at instead:")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pichhola" })).toBeVisible();
  await expect(page.locator("input[type=file]:not([capture])")).toHaveCount(1);
  await expect(page.locator("input[type=file][capture]")).toHaveCount(1);
}

test("camera without navigator.mediaDevices: message, place picker, Photo and Upload still offered", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true }));
  await openCamera(page);
  await expect(page.getByText("This browser cannot open the camera here. Choose a photo instead.")).toBeVisible();
  await expectWayForward(page);
});

test("camera on a page that is not https: the message says it needs a secure connection", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
    Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });
  });
  await openCamera(page);
  await expect(page.getByText("The camera needs a secure (https) connection. Choose a photo instead.")).toBeVisible();
  await expectWayForward(page);
});

test("camera permission denied: the same place picker is shown", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("Permission denied"), { name: "NotAllowedError" }));
  });
  await openCamera(page);
  await expectWayForward(page);
});
