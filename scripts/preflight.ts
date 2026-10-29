// `npm run preflight`: a plain PASS/FAIL list before you present. Exit code 1 only for real blockers (data folder, build).
import net from "node:net";
import { getAiProvider } from "@/lib/ai";
import { runAiCheck } from "@/lib/ai/check";
import { runPreflight } from "@/lib/preflight";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: preflight reports it.
}

const PORT = 3000;

const portInUse = () =>
  new Promise<boolean>((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(true));
    s.once("listening", () => s.close(() => resolve(false)));
    s.listen(PORT);
  });

const healthy = async () => {
  try {
    const res = await fetch(`http://localhost:${PORT}/api/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok && ((await res.json()) as { ok?: boolean }).ok === true;
  } catch {
    return false;
  }
};

async function main() {
  const { text, blockers } = await runPreflight({ root: process.cwd(), env: process.env, port: PORT, portInUse, healthy, aiCheck: () => runAiCheck(getAiProvider()) });
  console.log(text);
  process.exit(blockers ? 1 : 0);
}

void main();
