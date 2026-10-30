import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { displayTitle } from "@/lib/display-title";

describe("displayTitle (list and card views only)", () => {
  it("drops a leading SAMPLE: or Sample from a sample entry and capitalises what is left", () => {
    expect(displayTitle("SAMPLE: history story 1 for Pichhola", true)).toBe("History story 1 for Pichhola");
    expect(displayTitle("SAMPLE:workshop title goes here", true)).toBe("Workshop title goes here");
    expect(displayTitle("Sample Artisan 2", true)).toBe("Artisan 2");
    expect(displayTitle("Sample guide", true)).toBe("Guide");
  });

  it("never changes an entry that is not a sample, so a real name that starts with 'Sample' keeps it", () => {
    expect(displayTitle("Sample Crafts of Udaipur", false)).toBe("Sample Crafts of Udaipur");
    expect(displayTitle("SAMPLE: x", false)).toBe("SAMPLE: x");
  });

  it("leaves other titles alone and never shows an empty title", () => {
    expect(displayTitle("City Palace", true)).toBe("City Palace");
    expect(displayTitle("Sampler Co", true)).toBe("Sampler Co");
    expect(displayTitle("The Lake that Chose Udaipur", true)).toBe("The Lake that Chose Udaipur");
    expect(displayTitle("SAMPLE:", true)).toBe("SAMPLE:");
    expect(displayTitle("Sample ", true)).toBe("Sample ");
    expect(displayTitle("राजस्थानी लघु चित्रकला", true)).toBe("राजस्थानी लघु चित्रकला");
  });
});

describe("the stored content is unchanged", () => {
  const titles = (dir: string, key: string) =>
    fs
      .readdirSync(path.resolve("content", dir))
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => {
        const j = JSON.parse(fs.readFileSync(path.resolve("content", dir, f), "utf8"));
        return (Array.isArray(j) ? j : [j]).map((e: Record<string, string>) => e[key]);
      });

  it("still has the full SAMPLE: and Sample titles, so content:check and the detail pages see them", () => {
    expect(titles("stories", "title").some((t) => t.startsWith("SAMPLE:"))).toBe(true);
    expect(titles("artisans", "name").some((t) => t.startsWith("Sample "))).toBe(true);
    expect(titles("workshops", "title").some((t) => t.startsWith("SAMPLE:"))).toBe(true);
  });
});

describe("where the helper is used", () => {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (["node_modules", ".next"].includes(e.name) ? [] : walk(path.join(dir, e.name))) : [path.join(dir, e.name)]));

  it("only the card components import it: not a detail page, moderation, content:check or any script", () => {
    const users = ["app", "components", "lib", "scripts"]
      .flatMap((d) => walk(path.resolve(d)))
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith("lib/display-title.ts"))
      .filter((f) => fs.readFileSync(f, "utf8").includes("display-title"))
      .map((f) => path.relative(process.cwd(), f));
    expect(users).toEqual(["components/domain.tsx"]);
  });

  it("in domain.tsx it is applied to the four card titles and not to the detail header or the story block", () => {
    const src = fs.readFileSync(path.resolve("components/domain.tsx"), "utf8");
    expect(src.match(/displayTitle\(/g)).toHaveLength(4);
    for (const expected of ["displayTitle(place.name, place.isSample)", "displayTitle(story.title, story.isSample)", "displayTitle(artisan.name, artisan.isSample)", "displayTitle(w.title, w.isSample)"]) {
      expect(src).toContain(expected);
    }
    // Detail header and story block still render the full stored title.
    expect(src).toContain("en={place.name}");
    expect(src).toContain("pick(lang, story.title, story.title_hi)");
  });
});
