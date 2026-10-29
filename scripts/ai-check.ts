// `npm run ai:check`: one tiny real Gemini call that tells you whether the key, the model name and the network work.
// Prints "ok" or only the kind of failure. Never the key, a response body or a full error message.
import { getAiProvider } from "@/lib/ai";
import { describeCheck, runAiCheck } from "@/lib/ai/check";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: the check will report "not configured".
}

async function main() {
  const result = await runAiCheck(getAiProvider());
  console.log(`ai:check: ${describeCheck(result)}`);
  process.exit(result.status === "failed" ? 1 : 0);
}

void main();
