import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { GET as healthGET } from "@/app/api/health/route";
import { dataDirProblem } from "@/lib/data-dir";
import { backupData, resetData } from "@/lib/data-tools";
import { imageWidth, runPreflight, type PreflightDeps } from "@/lib/preflight";
import { setRepos } from "@/lib/repos";
import { openDb } from "@/lib/repos/sqlite";
import { withFixture } from "./helpers";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "miras-ops-"));

/** A data folder with test enquiries, a pick, one draft and one published artisan, and two uploads. */
function seedData() {
  const root = tmp();
  const dataDir = path.join(root, "data");
  const db = openDb(dataDir);
  const at = "2026-10-29T00:00:00.000Z";
  db.prepare(`INSERT INTO enquiries VALUES ('e1','a1','question','hello','x@example.invalid',?)`).run(at);
  db.prepare(`INSERT INTO enquiries VALUES ('e2','a1','question','hello again','x@example.invalid',?)`).run(at);
  db.prepare(`INSERT INTO picks VALUES ('p1','pending','{}',?)`).run(at);
  db.prepare(`INSERT INTO artisans VALUES ('draft1','tok-draft','{"status":"draft"}',?)`).run(at);
  db.prepare(`INSERT INTO artisans VALUES ('live1','tok-live','{"status":"published"}',?)`).run(at);
  db.prepare(`INSERT INTO workshops VALUES ('w1','live1','{"status":"draft"}',?)`).run(at);
  db.prepare(`INSERT INTO media_assets VALUES ('upload-a.jpg','{}'),('keep-me','{}')`).run();
  db.close();
  const uploads = path.join(dataDir, "uploads");
  fs.mkdirSync(uploads, { recursive: true });
  fs.writeFileSync(path.join(uploads, "a.jpg"), "x");
  fs.writeFileSync(path.join(uploads, "b.png"), "y");
  const contentFile = path.join(root, "content", "places", "keep.json");
  fs.mkdirSync(path.dirname(contentFile), { recursive: true });
  fs.writeFileSync(contentFile, '{"id":"keep"}');
  return { root, dataDir, backups: path.join(root, "backups"), contentFile };
}

const rows = (dataDir: string, sql: string) => {
  const db = new Database(path.join(dataDir, "miras.db"), { readonly: true });
  try {
    return (db.prepare(sql).get() as { n: number }).n;
  } finally {
    db.close();
  }
};

describe("data:backup", () => {
  it("copies a consistent database and the uploads into backups/<timestamp>", () => {
    const s = seedData();
    const r = backupData(s.dataDir, s.backups, new Date("2026-10-29T10:00:00.123Z"));
    expect(path.basename(r.dir)).toBe("2026-10-29T10-00-00-123");
    expect(r).toMatchObject({ database: true, uploads: 2 });
    expect(rows(r.dir, "SELECT COUNT(*) AS n FROM enquiries")).toBe(2);
    expect(fs.readdirSync(path.join(r.dir, "uploads")).sort()).toEqual(["a.jpg", "b.png"]);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM enquiries")).toBe(2);
  });

  it("works with no database yet", () => {
    const root = tmp();
    expect(backupData(path.join(root, "data"), path.join(root, "backups"))).toMatchObject({ database: false, uploads: 0 });
  });
});

describe("data:reset", () => {
  it("without --yes prints what it would delete and changes nothing", () => {
    const s = seedData();
    const r = resetData(s.dataDir, s.backups, { yes: false });
    expect(r).toMatchObject({ done: false, counts: { enquiries: 2, picks: 1, draftArtisans: 1, draftWorkshops: 1, uploadRecords: 1, uploadFiles: 2 } });
    expect(fs.existsSync(s.backups)).toBe(false);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM enquiries")).toBe(2);
    expect(fs.readdirSync(path.join(s.dataDir, "uploads"))).toHaveLength(2);
  });

  it("with --yes backs up first, then removes test data only and never touches content", () => {
    const s = seedData();
    const r = resetData(s.dataDir, s.backups, { yes: true });
    expect(r.done).toBe(true);
    expect(rows(r.backup!.dir, "SELECT COUNT(*) AS n FROM enquiries")).toBe(2); // the backup still has the old data
    expect(fs.readdirSync(path.join(r.backup!.dir, "uploads"))).toHaveLength(2);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM enquiries")).toBe(0);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM picks")).toBe(0);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM artisans WHERE id = 'draft1'")).toBe(0);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM artisans WHERE id = 'live1'")).toBe(1); // published listings stay
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM workshops")).toBe(0);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM media_assets WHERE id = 'keep-me'")).toBe(1);
    expect(rows(s.dataDir, "SELECT COUNT(*) AS n FROM media_assets WHERE id LIKE 'upload-%'")).toBe(0);
    expect(fs.readdirSync(path.join(s.dataDir, "uploads"))).toHaveLength(0);
    expect(fs.readFileSync(s.contentFile, "utf8")).toBe('{"id":"keep"}');
  });
});

describe("data folder check", () => {
  it("is quiet for a writable folder and names the folder when it cannot be used", () => {
    expect(dataDirProblem(path.join(tmp(), "new-data"))).toBeNull();
    const msg = dataDirProblem("/dev/null/not-a-folder");
    expect(msg).toContain("/dev/null/not-a-folder");
    expect(msg).toContain("MIRAS_DATA_DIR");
    expect(msg).not.toMatch(/\bat \w+\.|Error:/); // one plain sentence, no stack trace
  });
});

describe("GET /api/health", () => {
  it("answers ok with only safe fields, and is never rate-limited", async () => {
    withFixture({});
    for (let i = 0; i < 200; i++) expect((await healthGET()).status).toBe(200);
    const body = await (await healthGET()).json();
    expect(Object.keys(body).sort()).toEqual(["ai", "db", "demoMode", "ok", "time"]);
    expect(body).toMatchObject({ ok: true, db: "ok", ai: "mock" });
  });

  it("reports gemini without leaking the key or model", async () => {
    withFixture({});
    process.env.GEMINI_API_KEY = "AIzaSy-FAKE-KEY-0123456789";
    process.env.GEMINI_MODEL = "fake-model";
    const text = JSON.stringify(await (await healthGET()).json());
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    expect(text).toContain('"ai":"gemini"');
    expect(text).not.toMatch(/AIzaSy|fake-model/);
  });

  it("is 503 with no error details when the database cannot be read", async () => {
    setRepos({
      enquiries: {
        countByArtisan: () => {
          throw new Error("disk I/O error at /secret/path");
        },
      },
    } as never);
    const res = await healthGET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body).toMatchObject({ ok: false, db: "error" });
    expect(JSON.stringify(body)).not.toContain("secret");
  });
});

describe("image width reader", () => {
  it("reads PNG headers, rejects non-images, and the real project images are small", () => {
    const png = Buffer.alloc(32);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);
    png.writeUInt32BE(1280, 16);
    expect(imageWidth(png)).toBe(1280);
    expect(imageWidth(Buffer.from("not an image at all, just some text bytes"))).toBeNull();
    const dir = path.resolve("public/media/pichhola");
    const widths = fs.readdirSync(dir).map((f) => imageWidth(fs.readFileSync(path.join(dir, f))));
    expect(widths.every((w) => w !== null && w < 800)).toBe(true);
    expect(widths).toContain(358);
  });
});

describe("preflight", () => {
  const FAKE_KEY = "AIzaSy-FAKE-KEY-0123456789";
  const deps = (over: Partial<PreflightDeps> = {}): PreflightDeps => ({
    root: process.cwd(),
    env: { GEMINI_API_KEY: FAKE_KEY, GEMINI_MODEL: "fake-model", ADMIN_PASSCODE: "pass", MIRAS_DATA_DIR: path.join(tmp(), "data") } as unknown as NodeJS.ProcessEnv,
    port: 3000,
    portInUse: async () => false,
    healthy: async () => false,
    aiCheck: async () => ({ status: "ok" }),
    ...over,
  });

  it("prints a PASS/FAIL/WARN list, only says set or not set for secrets, and lists the small images", async () => {
    const { text, blockers } = await runPreflight(deps());
    expect(text).toMatch(/^MIRAS preflight/);
    expect(text).toMatch(/PASS\s+GEMINI_API_KEY: set/);
    expect(text).toMatch(/PASS\s+GEMINI_MODEL: set/);
    expect(text).toMatch(/PASS\s+Gemini answered a real test call/);
    expect(text).toMatch(/PASS\s+Port 3000 is free/);
    expect(text).toContain("Content readiness (warnings only, they do not block)");
    expect(text).toMatch(/WARN\s+\d+ of 3 places have real, non-placeholder coordinates/);
    expect(text).toMatch(/WARN\s+\d+ of 3 stories are verified/);
    expect(text).toMatch(/WARN\s+\d+ of 2 artisans have recorded consent/);
    expect(text).toMatch(/under 800 px wide:/);
    expect(text).toContain("media/pichhola/");
    expect(text).not.toContain(FAKE_KEY);
    expect(text).not.toContain("fake-model");
    expect(text).toMatch(/RESULT: /);
    expect(blockers).toBe(fs.existsSync(path.join(process.cwd(), ".next", "BUILD_ID")) ? 0 : 1);
  });

  it("not configured: warns and skips the Gemini check", async () => {
    const { text } = await runPreflight(deps({ env: { MIRAS_DATA_DIR: path.join(tmp(), "data") } as unknown as NodeJS.ProcessEnv }));
    expect(text).toMatch(/WARN\s+GEMINI_API_KEY: not set/);
    expect(text).toMatch(/SKIP\s+Gemini check skipped: not configured/);
  });

  it("a failed Gemini check is a FAIL line but not a blocker", async () => {
    const base = await runPreflight(deps());
    const { text, blockers } = await runPreflight(deps({ aiCheck: async () => ({ status: "failed", kind: "ApiError (HTTP 404): check GEMINI_MODEL" }) }));
    expect(text).toMatch(/FAIL\s+Gemini check failed: ApiError \(HTTP 404\): check GEMINI_MODEL/);
    expect(blockers).toBe(base.blockers);
  });

  it("port taken by something else: FAIL with how to free it; taken by MIRAS itself: PASS", async () => {
    const other = await runPreflight(deps({ portInUse: async () => true }));
    expect(other.text).toMatch(/FAIL\s+Port 3000 is used by something else/);
    expect(other.text).toContain("lsof -i :3000");
    expect(other.text).toContain("kill <PID>");
    const ours = await runPreflight(deps({ portInUse: async () => true, healthy: async () => true }));
    expect(ours.text).toMatch(/PASS\s+MIRAS is already running on port 3000/);
    expect(ours.text).toMatch(/PASS\s+\/api\/health answers/);
  });

  it("real blockers: an unusable data folder and a missing build", async () => {
    const root = tmp(); // no .next folder here
    const { text, blockers } = await runPreflight(deps({ root, env: { MIRAS_DATA_DIR: "/dev/null/no" } as unknown as NodeJS.ProcessEnv }));
    expect(blockers).toBe(2);
    expect(text).toMatch(/FAIL\s+The data folder/);
    expect(text).toMatch(/FAIL\s+No production build\. Run: npm run build/);
    expect(text).toMatch(/FAIL\s+\.env file exists/);
  });
});
