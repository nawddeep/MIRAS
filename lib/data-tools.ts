import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const stamp = (d: Date) => d.toISOString().replace(/[:.]/g, "-").slice(0, 23);

function fileCount(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? fileCount(path.join(dir, e.name)) : 1), 0);
}

export type BackupResult = { dir: string; database: boolean; uploads: number };

/**
 * Copies the database and the uploads folder into <backupsRoot>/<timestamp>/.
 * The database is copied with VACUUM INTO: a consistent copy even while the server runs.
 * A raw file copy of a live WAL-mode database could be torn, so it is never used.
 */
export function backupData(dataDir: string, backupsRoot: string, now = new Date()): BackupResult {
  const dir = path.join(backupsRoot, stamp(now));
  fs.mkdirSync(dir, { recursive: true });

  let database = false;
  const dbFile = path.join(dataDir, "miras.db");
  if (fs.existsSync(dbFile)) {
    const db = new Database(dbFile, { readonly: true, fileMustExist: true });
    try {
      db.prepare("VACUUM INTO ?").run(path.join(dir, "miras.db"));
      database = true;
    } finally {
      db.close();
    }
  }

  const uploads = path.join(dataDir, "uploads");
  if (fs.existsSync(uploads)) fs.cpSync(uploads, path.join(dir, "uploads"), { recursive: true });
  return { dir, database, uploads: fileCount(uploads) };
}

export type ResetCounts = { enquiries: number; picks: number; draftArtisans: number; draftWorkshops: number; uploadRecords: number; uploadFiles: number };

const DRAFT = `json_extract(data, '$.status') = 'draft'`;
const UPLOAD_RECORD = `id LIKE 'upload-%'`;

export type ResetResult = { done: boolean; counts: ResetCounts; backup?: BackupResult };

/**
 * Test data only: all enquiries and picks, draft listings and workshops, upload records and the uploaded files.
 * Published listings and everything under /content are never touched. Without `yes` nothing is changed.
 */
export function resetData(dataDir: string, backupsRoot: string, opts: { yes: boolean; now?: Date }): ResetResult {
  const dbFile = path.join(dataDir, "miras.db");
  const uploads = path.join(dataDir, "uploads");
  const db = fs.existsSync(dbFile) ? new Database(dbFile, { fileMustExist: true }) : undefined;
  try {
    const count = (sql: string) => (db ? (db.prepare(sql).get() as { n: number }).n : 0);
    const counts: ResetCounts = {
      enquiries: count(`SELECT COUNT(*) AS n FROM enquiries`),
      picks: count(`SELECT COUNT(*) AS n FROM picks`),
      draftArtisans: count(`SELECT COUNT(*) AS n FROM artisans WHERE ${DRAFT}`),
      draftWorkshops: count(`SELECT COUNT(*) AS n FROM workshops WHERE ${DRAFT}`),
      uploadRecords: count(`SELECT COUNT(*) AS n FROM media_assets WHERE ${UPLOAD_RECORD}`),
      uploadFiles: fileCount(uploads),
    };
    if (!opts.yes) return { done: false, counts };

    const backup = backupData(dataDir, backupsRoot, opts.now);
    if (db) {
      db.transaction(() => {
        db.exec(`DELETE FROM enquiries; DELETE FROM picks;`);
        db.exec(`DELETE FROM artisans WHERE ${DRAFT}; DELETE FROM workshops WHERE ${DRAFT};`);
        db.exec(`DELETE FROM media_assets WHERE ${UPLOAD_RECORD};`);
      })();
    }
    if (fs.existsSync(uploads)) for (const e of fs.readdirSync(uploads)) fs.rmSync(path.join(uploads, e), { recursive: true, force: true });
    return { done: true, counts, backup };
  } finally {
    db?.close();
  }
}

export function describeCounts(c: ResetCounts): string {
  return [
    `  enquiries:              ${c.enquiries}`,
    `  visitor picks:          ${c.picks}`,
    `  draft artisan listings: ${c.draftArtisans}`,
    `  draft workshops:        ${c.draftWorkshops}`,
    `  upload records:         ${c.uploadRecords}`,
    `  uploaded files:         ${c.uploadFiles}`,
  ].join("\n");
}
