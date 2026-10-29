import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROADMAP, roadmapCounts, STATUS_LABEL } from "@/lib/roadmap";

const everyText = () => ROADMAP.flatMap((i) => [i.name, i.what, i.today, ...i.before, ...i.evidence.map((e) => e.route)]).join("\n");

describe("roadmap data", () => {
  it("has the nine modules in the agreed order, with unique ids", () => {
    expect(ROADMAP.map((i) => i.id)).toEqual([
      "badges-passport",
      "social-profiles",
      "live-stories",
      "memories",
      "bookings-commerce",
      "verified-artisans",
      "hidden-places",
      "companion-guides",
      "mobility-rentals",
    ]);
  });

  it("allows only the three status labels, and never 'coming soon', 'beta' or 'live' as a status", () => {
    expect(Object.values(STATUS_LABEL)).toEqual(["Built (prototype)", "Concept", "Not planned yet"]);
    for (const i of ROADMAP) expect(Object.keys(STATUS_LABEL)).toContain(i.status);
    expect(Object.values(STATUS_LABEL).join(" ")).not.toMatch(/coming soon|beta|\blive\b/i);
  });

  it("computes the summary counts from the data, and they add up to nine", () => {
    const c = roadmapCounts();
    expect(c.built).toBe(ROADMAP.filter((i) => i.status === "built").length);
    expect(c.concept).toBe(ROADMAP.filter((i) => i.status === "concept").length);
    expect(c.not_planned).toBe(ROADMAP.filter((i) => i.status === "not_planned").length);
    expect(c.built + c.concept + c.not_planned).toBe(9);
  });

  it("every Built (prototype) item names a route and a file that exists; nothing else claims one", () => {
    for (const i of ROADMAP) {
      if (i.status === "built") {
        expect(i.evidence.length, `${i.id} names a route`).toBeGreaterThan(0);
        for (const e of i.evidence) {
          expect(e.route.startsWith("/"), `${i.id} route ${e.route}`).toBe(true);
          expect(fs.existsSync(path.resolve(e.file)), `${i.id}: ${e.file} exists`).toBe(true);
        }
      } else {
        expect(i.evidence, `${i.id} is not built, so it names no route`).toEqual([]);
      }
    }
  });

  it("the document the bookings card points to exists", () => {
    expect(fs.existsSync(path.resolve("docs/PHASE6_NOT_BUILT.md"))).toBe(true);
  });

  it("has no rupee sign, rating, emoji, or invented figure", () => {
    const text = everyText();
    expect(text).not.toMatch(/₹|★|☆|\bRs\.?\s?\d|\d\s?%/);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(text).not.toMatch(/\b\d{2,}\b/); // no counts of people, prices or dates
  });

  it("every card has a 'today' sentence and at least one prerequisite", () => {
    for (const i of ROADMAP) {
      expect(i.today.trim().length, i.id).toBeGreaterThan(0);
      expect(i.before.length, i.id).toBeGreaterThan(0);
    }
  });
});
