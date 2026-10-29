import fs from "node:fs";
import path from "node:path";
import type { AiCheckResult } from "@/lib/ai/check";
import { checkContent } from "@/lib/content-check";
import { dataDirProblem } from "@/lib/data-dir";
import { placeholderCoordinateIds } from "@/lib/planner";
import { readEntities } from "@/lib/repos/json";
import { Artisan, Place, StoryEntry } from "@/lib/schemas";

/** Width in pixels read from the file header, or null if it is not a JPEG, PNG or WebP. */
export function imageWidth(b: Buffer): number | null {
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47) return b.readUInt32BE(16);
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return b.readUInt16BE(i + 7);
      i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
  }
  if (b.length >= 30 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") {
    const kind = b.toString("latin1", 12, 16);
    if (kind === "VP8 ") return b.readUInt16LE(26) & 0x3fff;
    if (kind === "VP8L") return (b.readUInt32LE(21) & 0x3fff) + 1;
    if (kind === "VP8X") return 1 + b.readUIntLE(24, 3);
  }
  return null;
}

const walk = (dir: string): string[] =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])) : [];

export type Readiness = { places: number; stories: number; artisans: number; smallImages: { file: string; width: number }[] };

/** How much real (non-sample) content exists, from the content files. A story's writer is not recorded, so "verified" means a named verifier and a date. */
export function readiness(contentDir: string, publicDir: string): Readiness {
  const places = readEntities(path.join(contentDir, "places"), Place).items;
  const stories = readEntities(path.join(contentDir, "stories"), StoryEntry).items;
  const artisans = readEntities(path.join(contentDir, "artisans"), Artisan).items;
  const shared = placeholderCoordinateIds(places);
  const smallImages = walk(path.join(publicDir, "media"))
    .map((f) => ({ file: path.relative(publicDir, f), width: imageWidth(fs.readFileSync(f)) }))
    .filter((x): x is { file: string; width: number } => x.width !== null && x.width < 800);
  return {
    places: places.filter((p) => !p.isSample && !shared.has(p.id)).length,
    stories: stories.filter((s) => !s.isSample && s.verifiedBy?.trim() && s.verifiedAt).length,
    artisans: artisans.filter((a) => !a.isSample && a.consent.given && a.ownerConfirmedAt).length,
    smallImages,
  };
}

/** "" is for continuation lines (a list under a WARN) that should not carry a tag of their own. */
export type Level = "PASS" | "FAIL" | "WARN" | "SKIP" | "";
type Line = { level: Level; text: string };

export type PreflightDeps = {
  root: string;
  env: NodeJS.ProcessEnv;
  port: number;
  portInUse: () => Promise<boolean>;
  /** True if GET /api/health answered with ok. */
  healthy: () => Promise<boolean>;
  aiCheck: () => Promise<AiCheckResult>;
};

/** Plain-language PASS/FAIL list. Secrets are only ever reported as "set" or "not set". */
export async function runPreflight(d: PreflightDeps): Promise<{ text: string; blockers: number }> {
  const out: string[] = ["MIRAS preflight", "==============="];
  let blockers = 0;
  const section = (title: string, lines: Line[]) => {
    out.push("", title);
    for (const l of lines) out.push(`  ${l.level.padEnd(4)}  ${l.text}`);
  };
  const set = (name: string) => Boolean(d.env[name]?.trim());
  const yesNo = (ok: boolean, text: string, fix: string): Line => ({ level: ok ? "PASS" : "FAIL", text: ok ? text : `${text}. ${fix}` });

  section("Settings", [
    yesNo(fs.existsSync(path.join(d.root, ".env")), ".env file exists", "Create it with: cp .env.example .env"),
    { level: set("GEMINI_API_KEY") ? "PASS" : "WARN", text: `GEMINI_API_KEY: ${set("GEMINI_API_KEY") ? "set" : "not set (the app will use labelled demo responses)"}` },
    { level: set("GEMINI_MODEL") ? "PASS" : "WARN", text: `GEMINI_MODEL: ${set("GEMINI_MODEL") ? "set" : "not set (the app will use labelled demo responses)"}` },
    { level: set("ADMIN_PASSCODE") ? "PASS" : "WARN", text: `ADMIN_PASSCODE: ${set("ADMIN_PASSCODE") ? "set" : "not set (the moderation page and the AI check button stay locked)"}` },
  ]);

  const dataDir = path.resolve(d.root, d.env.MIRAS_DATA_DIR || "./data");
  const dataProblem = dataDirProblem(dataDir);
  const hasBuild = fs.existsSync(path.join(d.root, ".next", "BUILD_ID"));
  if (dataProblem) blockers++;
  if (!hasBuild) blockers++;

  const inUse = await d.portInUse();
  const healthy = inUse ? await d.healthy() : false;
  const portLine: Line = !inUse
    ? { level: "PASS", text: `Port ${d.port} is free` }
    : healthy
      ? { level: "PASS", text: `MIRAS is already running on port ${d.port}` }
      : { level: "FAIL", text: `Port ${d.port} is used by something else. Find it with: lsof -i :${d.port}   then stop it with: kill <PID>` };

  section("This computer", [
    portLine,
    dataProblem ? { level: "FAIL", text: dataProblem } : { level: "PASS", text: `Data folder is writable (${dataDir})` },
    hasBuild ? { level: "PASS", text: "A production build exists" } : { level: "FAIL", text: "No production build. Run: npm run build" },
    healthy ? { level: "PASS", text: "/api/health answers" } : { level: "SKIP", text: "The server is not running yet. After npm run start, run this again." },
  ]);

  let ai: Line;
  if (set("GEMINI_API_KEY") && set("GEMINI_MODEL")) {
    const r = await d.aiCheck();
    ai =
      r.status === "ok"
        ? { level: "PASS", text: "Gemini answered a real test call" }
        : r.status === "failed"
          ? { level: "FAIL", text: `Gemini check failed: ${r.kind}` }
          : { level: "SKIP", text: "skipped: not configured" };
  } else ai = { level: "SKIP", text: "Gemini check skipped: not configured" };
  section("Gemini", [ai]);

  const contentDir = path.join(d.root, "content");
  const publicDir = path.join(d.root, "public");
  const report = checkContent(contentDir, publicDir);
  const r = readiness(contentDir, publicDir);
  const target = (n: number, want: number, what: string): Line => ({ level: n >= want ? "PASS" : "WARN", text: `${n} of ${want} ${what}` });
  section("Content", [
    report.errors.length ? { level: "FAIL", text: `content:check found ${report.errors.length} error(s). Run: npm run content:check` } : { level: "PASS", text: "content:check found no errors" },
  ]);
  section("Content readiness (warnings only, they do not block)", [
    target(r.places, 3, "places have real, non-placeholder coordinates"),
    target(r.stories, 3, "stories are verified by a named person with a date"),
    target(r.artisans, 2, "artisans have recorded consent and owner confirmation"),
    {
      level: r.smallImages.length ? "WARN" : "PASS",
      text: r.smallImages.length ? `${r.smallImages.length} image(s) in public/media are under 800 px wide:` : "No image in public/media is under 800 px wide",
    },
    ...r.smallImages.map((x): Line => ({ level: "", text: `  ${x.file} (${x.width} px)` })),
  ]);

  out.push("", blockers ? `RESULT: ${blockers} blocker(s). Fix the data folder or the build first.` : "RESULT: no blockers. Read any FAIL or WARN lines above before you present.");
  return { text: out.join("\n"), blockers };
}
