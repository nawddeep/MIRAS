import { Label } from "./ui";

/**
 * The app-level indicator: one persistent "Demo data" pill at the top of every screen while demo mode is on.
 * It replaces the dashed badge on list cards only. Detail pages keep their full "Sample content" badge.
 * The pill links to the explanation in the footer (#sample-data).
 */
export function DemoStrip() {
  return (
    <div className="demo-notice flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-ink px-4 py-1 text-center text-xs text-on-dark">
      <a href="#sample-data" className="inline-flex min-h-8 items-center" aria-label="Demo data. Read what this means.">
        <Label tone="sample">Demo data</Label>
      </a>
      {/* Kept for screen readers; the visible explanation is the footer note the pill links to. */}
      <span className="sr-only">Demo mode: sample content is shown and badged. Nothing marked sample is real.</span>
    </div>
  );
}
