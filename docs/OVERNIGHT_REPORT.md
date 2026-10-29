# Overnight report

Branch `overnight-finish` (worktree `../miras-finish`), based on tag `known-good-1` = commit `22311f3`. `MIRAS` was not changed. Nothing was merged.

_This report is updated at every stage boundary. If the run stopped early, the stage list below shows where._

## Summary

- All work is on `overnight-finish` (9 commits). Nothing was merged; `MIRAS` and the tag `known-good-1` (= `22311f3`) are unchanged.
- Done: a rate limiter that forged headers cannot get around, a real Gemini check, timeout and retry for Gemini calls, upload checks from the first bytes, security headers, backup, reset, health and preflight commands, hosting and morning documents, and the "Demo data" polish.
- Final clean-build run: typecheck, lint, 208 unit tests (was 140), `content:check` 0 errors, 88 browser tests (was 74), demo path 3 of 3. All passed.
- **Never run: real Gemini (no `.env` existed), real phones, a real tunnel.** The Gemini check was only run with a fake key (it reached Google and got HTTP 400).
- Biggest finding: the design CSS hid the "Demo mode" strip on every screen, so per-card badges were the only visible disclosure; the polish makes a pill visible instead of leaving list screens nearly undisclosed.

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

### S4 Tokens, headers, owner enquiries: done
- Token comparison is constant-time. New tokens were already 192-bit random; no change. Existing tokens keep working (tested).
- Four security headers added, no CSP. Headers on a real server are checked in S8.
- Owner enquiry list and `/admin` per-artisan counts already existed; only tests were added. 5 new tests.
- Merge note: the shared folder has an uncommitted change to `next.config.ts` (`devIndicators: false`). It will conflict with this branch's `headers()` addition in the same file; both hunks should be kept.

### S5 Camera fallback: done
- One small change in `components/CameraMode.tsx` (missing `navigator.mediaDevices` now shows the same blocked state and place picker as a denied permission, with an https-specific message). Re-implemented, not copied. 3 new browser tests pass.
- Merge note: the shared folder has uncommitted edits in the same file, and its own earlier version of this fix. When merging, keep one version; this branch's is the smaller one.
- Note for `tests/e2e/phone-fallbacks.spec.ts`: an untracked file with the same name exists in the shared folder; git will refuse to merge over it until it is moved or deleted by its owner.

### S6 Data safety, health, preflight: done
- `data:backup`, `data:reset` (refuses without `--yes`, backs up first, test data only, never `/content`), start-up data-folder check, `/api/health`, `npm run preflight`. 14 new tests; 208 unit tests pass.
- Verified on a real production server with an unusable data folder: one plain log line, health 503 without details, and the S4 security headers present on the real response.
- Decision: the brief limits exit-code blockers to the data folder and the build, so a busy port or a failed Gemini check shows as FAIL but still exits 0. The morning checklist therefore tells the reader to read the list, not only the exit code.
- Limit: stories carry no writer field, so "verified by a second person" can only be checked as "named verifier plus date".

### S7 Documents: done
- `docs/HOSTING.md`, `docs/MORNING_CHECKLIST.md` written. `docs/DEMO_RUNBOOK.md` updated in three places where a fact was now wrong (Gemini proof, clearing test data, shared limits) plus the 25-second timeout note. `docs/PHONE_TEST.md` untouched.
- The checklist mentions `docs/MIRAS_Content_Intake_Sheet.*` only "if it exists"; no such file exists in this branch.

### Demo polish: done (commit 72f55e8)
- One "Demo data" pill at the top of every screen, a quiet dot with hidden text "Sample content" on place, story, maker and workshop list cards, and the full badge kept on detail pages and on the story section of a place page. Details in `BUILD_LOG.md`.
- **Finding:** `.miras-body > .demo-notice { display:none }` in the committed design CSS hid the demo strip everywhere. Changed so the strip shows (only the pill is visible; the old sentence stays for screen readers). The CSS also hid the whole footer on Home; now only the sample-data note stays there.
- **Conflict, not changed:** Home has a fixed footnote "Sample content · Illustrative imagery supplied for MIRAS" that also shows with demo mode off (`components/HomeShell.tsx`). It describes the imagery, so it was left alone; decide whether it should hide in live mode.
- No existing test asserted a per-card list badge, so no test was changed.
- 11 new browser tests, including a second server on port 3101 with demo mode off (no pill, no sample entries).

### S8 Final verification: done
Clean build (`rm -rf .next` first) on `overnight-finish`:

| Check | S0 baseline (`known-good-1`) | Final |
|---|---|---|
| typecheck | pass | pass |
| lint | pass | pass |
| unit tests | 140 pass | 208 pass |
| `content:check` | 0 errors, 50 sample/unverified | 0 errors, 50 sample/unverified |
| build | pass | pass |
| browser tests | 74 pass, 0 fail | 88 pass, 0 fail |
| demo path spec, 3 runs | not run at baseline | 3 of 3 pass |

Also checked on a real production server: the rate-limit cookie is set, a forged `x-forwarded-for` does not get around the limit (the 21st request is 429), the four security headers are on real responses, `/api/health` answers, and an unusable data folder gives one plain log line and a 503 health answer without details.

The "save for offline" failure mentioned in the brief did not appear in any run of this branch.

## Decisions made without asking, and why
1. **Cookie ids for the rate limiter, with one shared bucket for visitors without a cookie.** Route handlers cannot see the socket address, so "socket address if available" was not possible. Forged cookie values get their own bucket, but the all-visitor ceilings cap the total.
2. **Uploads rejected when the bytes do not match.** A HEIC photo sent straight to the camera route is now refused (415); the browser normally converts it to JPEG and the app re-encodes frames, but this is not verified on a real iPhone.
3. **One existing test's fixture bytes changed** (`tests/unit/memories.test.ts`: 10 zero bytes became a JPEG header). Its assertions are the same.
4. **Preflight exit code** is non-zero only for an unwritable data folder or a missing build, as the brief says. A failed Gemini check or a busy port is a FAIL line but exits 0.
5. **"Verified by a second person"** is measured as "named verifier plus date", because stories have no writer field.
6. **Pill placement.** It is in the layout's demo strip (every screen), not in `TopBar`, because `TopBar` is deliberately hidden on Home and Camera.
7. **The admin "Run the check" button** needs the moderator sign-in. The `/admin` status page itself was already open to anyone and still is.
8. **A second Playwright web server** (port 3101, demo mode off) was added to `playwright.config.ts` to test live mode.

## Not verified
- Real phones (Android Chrome, iPhone Safari), including camera, microphone, install, offline, narration and Hindi voices.
- Real Gemini: no `.env` existed, so `ai:check` ran only with a fake key and model (it reached Google and printed `ApiError (HTTP 400)`). Whether the real key and model name work is unknown.
- The admin "Run the check" button was tested in unit tests only, not clicked in a browser.
- A real tunnel (cloudflared or ngrok), a real VM, real network speed.
- Fonts: the build succeeded (Next fetches Google Fonts at build time), but the fonts were not checked on a phone.
- Hindi text, image rights, history sources and artisan consent.
- The merge into `MIRAS` (see conflicts below).

## What only humans can do
- Write and verify content: real places (coordinates, summaries), stories with sources and a second checker, artisans with signed consent and confirmed listings. `npm run preflight` shows 0 of 3, 0 of 3 and 0 of 2 today.
- Native-speaker review of the Hindi text.
- Hi-res, rights-cleared images: all 14 files in `public/media/pichhola/` are 358 px wide or smaller (12 are 358 wide, one is 260, one is 160), and they will look soft on a phone.
- The real-phone test (`docs/PHONE_TEST.md`) and the real Gemini key.
- Decide what to do with the failing `tests/e2e/mobile-reference.spec.ts` in the shared folder. It is not in this branch, so it did not run here. Earlier, in the shared folder, it failed ("installation is delayed and dismissed without interrupting first use").
- Decide whether Home's "Sample content" footnote should hide in live mode.

## Other things worth knowing
- **Stale CSS:** Turbopack's incremental build kept old CSS after a CSS-only change. Use a clean build (`rm -rf .next`) for any final check.
- **`lib/config.ts` build warnings** ("Dynamic filesystem access causes tracing of the whole project") exist at baseline and are unchanged.
- **Merge conflicts to expect** in the shared folder (other people have uncommitted edits there): `next.config.ts`, `components/CameraMode.tsx`, `components/domain.tsx`, `components/ui.tsx`, `app/layout.tsx`, `app/globals.css`, and the untracked `tests/e2e/phone-fallbacks.spec.ts` (move it away before merging). Keep both sides' changes. Their CSS may re-hide the demo strip: check `.miras-body > .demo-notice` after merging.
- Test runs regenerate `CONTENT_TODO.md` and `docs/ui/*.png` in the worktree; those were never staged, so the branch does not contain them. `git status` in the worktree shows them as modified.

## Merge and discard
Merge (after saving everyone's unfinished work in `~/Desktop/MIRAS`):
```
cd ~/Desktop/MIRAS
git fetch origin
mv tests/e2e/phone-fallbacks.spec.ts ~/Desktop/phone-fallbacks.old.spec.ts   # only if it exists
git checkout MIRAS
git merge --no-ff origin/overnight-finish
```
Discard:
```
git push origin --delete overnight-finish
git push origin --delete overnight-done
git worktree remove ../miras-finish --force
git branch -D overnight-finish
git tag -d overnight-done
```
