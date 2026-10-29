"use client";

import { useActionState } from "react";
import { type AiCheckState, runAiCheckAction } from "@/lib/actions/ai-check";

/** Runs one tiny real Gemini call. Shows only "ok" or the kind of failure. */
export function AiCheckButton() {
  const [state, action, pending] = useActionState<AiCheckState>(runAiCheckAction, {});
  return (
    <form action={action} className="mt-2">
      <button type="submit" disabled={pending} className="min-h-11 rounded-card border border-line-dark px-4 py-2 text-sm font-semibold">
        {pending ? "Checking…" : "Run the check"}
      </button>
      {state.message && (
        <p role="status" className="mt-2 text-sm">
          Result: <code>{state.message}</code>
        </p>
      )}
    </form>
  );
}
