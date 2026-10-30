/**
 * The title shown on LIST and CARD views only. A sample entry's leading "SAMPLE:" or "Sample " is dropped so the card reads cleanly
 * ("Sample Artisan 2" shows as "Artisan 2"). Only sample entries are changed, so a real entry that happens to start with "Sample" keeps it.
 *
 * This is display only. The stored text, `isSample` and every schema stay as they are. The card keeps its quiet sample marker and the
 * "Demo data" pill stays on every screen. Never use this on a detail page, in moderation, in content:check or in CONTENT_TODO.md.
 */
export function displayTitle(title: string, isSample: boolean): string {
  if (!isSample) return title;
  const stripped = title.replace(/^(?:SAMPLE:\s*|Sample\s+)/, "");
  if (stripped === title || !stripped.trim()) return title;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}
