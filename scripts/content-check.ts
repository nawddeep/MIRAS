import fs from "node:fs";
import path from "node:path";
import { checkContent, renderTodo } from "../lib/content-check";

const root = process.cwd();
const report = checkContent(path.join(root, "content"), path.join(root, "public"));
fs.writeFileSync(path.join(root, "CONTENT_TODO.md"), renderTodo(report, new Date()));

console.log(`Content check: ${report.errors.length} error(s), ${report.todo.length} item(s) still sample or unverified.`);
if (report.todo.length) {
  console.log("\nStill to replace or verify (full list in CONTENT_TODO.md):");
  for (const t of report.todo) console.log(`  - ${t.kind} ${t.id}: ${t.note}`);
}
if (report.errors.length) {
  console.error("\nErrors:");
  for (const e of report.errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("\nNo errors.");
