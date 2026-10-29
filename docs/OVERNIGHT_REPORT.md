# Overnight report

Branch `overnight-finish` (worktree `../miras-finish`), based on tag `known-good-1` = commit `22311f3`. `MIRAS` was not changed. Nothing was merged.

_This report is updated at every stage boundary. If the run stopped early, the stage list below shows where._

## Summary

(filled in at the end, S8)

## Files NOT mine (uncommitted in the shared folder at the start, never touched)

- ` M app/artisans/[id]/page.tsx`
- ` M app/artisans/page.tsx`
- ` M app/camera/page.tsx`
- ` M app/globals.css`
- ` M app/layout.tsx`
- ` M app/places/[slug]/page.tsx`
- ` M app/stories/[id]/page.tsx`
- ` M components/AudioBar.tsx`
- ` M components/BookmarkPlace.tsx`
- ` M components/CameraMode.tsx`
- ` M components/HomeShell.tsx`
- ` M components/InstallPrompt.tsx`
- ` M components/StoryReader.tsx`
- ` M components/domain.tsx`
- ` M components/icons.tsx`
- ` M components/scene.tsx`
- ` M components/shell.tsx`
- ` M lib/time-of-day.ts`
- ` M next.config.ts`
- ` M public/sw.js`
- ` M tests/unit/sw.test.ts`
- ` M tests/unit/theme.test.ts`
- `?? app/profile/`
- `?? components/PhotoGallery.tsx`
- `?? components/SavedItems.tsx`
- `?? components/SectionNav.tsx`
- `?? docs/PICHHOLA_IMPLEMENTATION.md`
- `?? docs/ui-polish/`
- `?? docs/ui-review/`
- `?? tests/e2e/mobile-reference.spec.ts`
- `?? tests/e2e/phone-fallbacks.spec.ts`

Two of these were mine from earlier (`components/CameraMode.tsx` camera-picker edit and `tests/e2e/phone-fallbacks.spec.ts`). As instructed they were not copied; S5 re-implements them in this branch.

## S0 Baseline (worktree, `known-good-1`, real results)

- `npm ci` done. `better-sqlite3` loads.
- typecheck pass. lint pass. unit tests 140 passed. `content:check` 0 errors. build pass.
- e2e: **74 passed, 0 failed.** The "save for offline" failure mentioned in the brief did not reproduce here. The one failure I saw earlier was in the untracked `mobile-reference.spec.ts`, which is not in this branch.
- `known-good-1` did not exist; I created it at `22311f3` and pushed only that tag.
- No `.env` in the shared folder, so none was copied. Real Gemini could not be run.
- Test runs regenerate `CONTENT_TODO.md` and `docs/ui/*.png`; they are left uncommitted and never staged.

## Stages

### S1 Rate limiter: done (commit 979342b)
- `TRUST_PROXY` (default false). Off: forwarded headers ignored; anonymous httpOnly cookie id, cookieless callers share one bucket. On: `cf-connecting-ip`, else the last `x-forwarded-for` hop.
- Global ceilings: camera 120/min, onboarding drafts 60/10 min, memories 60/10 min (env-configurable).
- Tests: 7 new, pass. Confirmed facts: `clientKey` used the first `x-forwarded-for` value; limits were as the brief said; enquiries have their own limit (3 per 10 minutes) keyed by the same `clientKey`.
- Known limit: route handlers cannot see the socket address, so "socket address if available" is not possible. A client that forges random cookie values gets its own bucket each time; the global ceiling bounds the total. The cookie being set on a real response is checked in S8.

### S2 ai:check and robust Gemini calls: done (commit 0be84ef)
- `npm run ai:check` verified for: no config ("not configured", exit 0), fake key and model (reached Google, `ApiError (HTTP 400): check GEMINI_MODEL and GEMINI_API_KEY`, exit 1, no key text in output). **Not verified with a real key** (none available).
- `/admin` has a "Run the check" button gated by the moderator sign-in, 5 s cooldown. Note: the `/admin` status page itself was already open to anyone; only the button needs the passcode.
- `lib/ai/robust.ts`: timeout (`GEMINI_TIMEOUT_MS`, 25 s), one retry on 429/5xx only, concurrency cap 4. 20 new tests.

### S3 Upload hardening: done
- First-byte type checks on all four upload routes; media route traversal tests. 22 new tests; 189 unit tests pass.
- Conflict reported: one existing test's fixture bytes (not assertions) changed (see BUILD_LOG). HEIC sent directly to the camera route is now rejected; not verified on a real iPhone.

