// `npm run data:backup`: copies the database and uploads into backups/<timestamp>/.
import path from "node:path";
import { getConfig } from "@/lib/config";
import { backupData } from "@/lib/data-tools";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: the default data folder is used.
}

const r = backupData(getConfig().dataDir, path.resolve("backups"));
console.log(`Backup written to ${r.dir}`);
console.log(`  database: ${r.database ? "copied" : "none found"}`);
console.log(`  uploaded files: ${r.uploads}`);
