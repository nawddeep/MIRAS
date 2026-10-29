# Morning checklist

Follow these in order. Each step says the exact command and what a good result looks like. Commands run in the project folder unless it says otherwise.

## 1. Read the overnight report

Open `docs/OVERNIGHT_REPORT.md`. The first lines say what was done in five lines or fewer. The last sections say what could **not** be checked and what only people can do.
Good result: you know which stages are done, partly done or reverted.

## 2. Review the work, then merge it (or throw it away)

The work is on the branch `overnight-finish`. Nothing was merged into `MIRAS`.

Look first (changes nothing):
```
cd ~/Desktop/MIRAS
git fetch origin
git log --oneline known-good-1..origin/overnight-finish
git diff --stat known-good-1 origin/overnight-finish
```
Good result: about 8 commits, one per task, each with a plain message.

Merge it (only after you have committed or saved everyone's unfinished work in this folder, because merging changes files):
```
mv tests/e2e/phone-fallbacks.spec.ts ~/Desktop/phone-fallbacks.old.spec.ts   # only if that untracked file exists; git will not merge over it
git checkout MIRAS
git merge --no-ff origin/overnight-finish
```
Good result: "Merge made by the 'ort' strategy". If git reports conflicts, they are expected in `next.config.ts` and `components/CameraMode.tsx` (someone else edited them too): keep **both** sides' changes. Then run `npm run typecheck && npm test`.

Throw it away instead:
```
git push origin --delete overnight-finish
git push origin --delete overnight-done
git worktree remove ../miras-finish --force
git branch -D overnight-finish
git tag -d overnight-done
```
Good result: `git branch -a` no longer lists `overnight-finish`. `MIRAS` and the tag `known-good-1` are unchanged either way.

## 3. Make the settings file

```
cp .env.example .env
```
Open `.env` and fill in:
- `GEMINI_API_KEY`: your key. Do not paste it anywhere else.
- `GEMINI_MODEL`: the exact model name from Google AI Studio. Do not guess it.
- `ADMIN_PASSCODE`: any passcode you choose.
- `TRUST_PROXY=true` (you will use a tunnel in step 6).

Good result: the file exists and those four lines are not blank.

## 4. Free port 3000

```
lsof -i :3000
```
Good result: it prints nothing. If it prints a line, note the PID (the number in the second column) and run `kill <PID>`, then run `lsof -i :3000` again.

## 5. Run the preflight

```
npm run preflight
```
Good result: ends with `RESULT: no blockers`. Read every **FAIL** line. The command only returns an error code for an unusable data folder or a missing build, so a failed Gemini check or a busy port still shows up as FAIL on a command that "succeeded". Lines marked **WARN** under "Content readiness" are the content work still to do.

## 6. Build, start, and open the tunnel

```
npm run build
npm run start
```
In a second terminal:
```
cloudflared tunnel --url http://localhost:3000
```
(or `ngrok http 3000`). Open the `https://` address it prints on a phone.
Good result: the home page loads on the phone. Run `npm run preflight` again; it should say `MIRAS is already running on port 3000` and `/api/health answers`.

## 7. Test on real phones

Follow `docs/PHONE_TEST.md` on one Android phone and one iPhone, and paste the results back in the format at the end of that file. Nobody has run this on a real phone yet.

## 8. Content work

If `docs/MIRAS_Content_Intake_Sheet.*` exists, give it to the team. If it is not in `docs/`, ask whoever wrote it. The warnings in step 5 say how many places, stories and artisans are still missing.

## 9. Right before you present

Stop the server (Ctrl+C in its terminal), then:
```
npm run data:backup
npm run data:reset -- --yes
npm run preflight
```
Good result: `data:backup` prints a folder under `backups/`; `data:reset` lists what it removed (test enquiries, drafts, picks, uploads) and says sample content was not touched; preflight shows no blockers. Then `npm run start` again. Sample content is not removed by any of this.
