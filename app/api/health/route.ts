import { aiStatus } from "@/lib/ai";
import { getConfig } from "@/lib/config";
import { getRepos } from "@/lib/repos";

/** Is the server up and the database readable? No secrets, no private counts, and never rate-limited. */
export async function GET() {
  let db: "ok" | "error" = "ok";
  try {
    getRepos().enquiries.countByArtisan();
  } catch {
    db = "error";
  }
  const ok = db === "ok";
  return Response.json(
    { ok, db, ai: aiStatus().configured ? "gemini" : "mock", demoMode: getConfig().demoMode, time: new Date().toISOString() },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
