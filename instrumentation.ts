// Runs once when the server starts. If the data folder cannot be used, say so plainly (one line, no stack trace).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getConfig } = await import("@/lib/config");
  const { dataDirProblem } = await import("@/lib/data-dir");
  const problem = dataDirProblem(getConfig().dataDir);
  if (problem) console.error(`[miras] ${problem}`);
}
