"use server";

import { cookies } from "next/headers";
import { isModerator, MOD_COOKIE } from "@/lib/admin-auth";
import { getAiProvider } from "@/lib/ai";
import { describeCheck, runAiCheck } from "@/lib/ai/check";

export type AiCheckState = { message?: string };

const COOLDOWN_MS = 5000;
let lastRun = 0;

/** Same check as `npm run ai:check`. Needs the moderator passcode sign-in, and runs at most once every 5 seconds. */
export async function runAiCheckAction(): Promise<AiCheckState> {
  if (!isModerator((await cookies()).get(MOD_COOKIE)?.value)) return { message: "Sign in at /admin/moderation first." };
  const now = Date.now();
  if (now - lastRun < COOLDOWN_MS) return { message: "Please wait a few seconds and try again." };
  lastRun = now;
  return { message: describeCheck(await runAiCheck(getAiProvider())) };
}
