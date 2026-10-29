// `npm run data:reset -- --yes`: removes TEST data only (enquiries, picks, draft listings, uploads) after taking a backup.
// Without --yes it only prints what it would delete. It never touches /content.
import path from "node:path";
import { getConfig } from "@/lib/config";
import { describeCounts, resetData } from "@/lib/data-tools";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: the default data folder is used.
}

const yes = process.argv.includes("--yes");
const { dataDir } = getConfig();
const r = resetData(dataDir, path.resolve("backups"), { yes });

if (!r.done) {
  console.log(`Nothing was deleted. This is what npm run data:reset -- --yes would remove from ${dataDir}:`);
  console.log(describeCounts(r.counts));
  console.log("\nStop the server first, then run it again with --yes. A backup is taken before anything is deleted.");
} else {
  console.log(`Backup written to ${r.backup?.dir}`);
  console.log(`Removed from ${dataDir}:`);
  console.log(describeCounts(r.counts));
  console.log("\nSample content and everything under /content were not touched.");
}
