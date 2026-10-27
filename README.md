# MIRAS

Heritage and local-discovery web app for Udaipur. Team Impala, hackathon final
(Heritage, Tourism and Sustainable Hospitality).

**Demo journey:** find a heritage site → preview it → read a sourced story → meet a local artisan → send an enquiry.
**Second journey:** an artisan creates a listing by voice (`/onboard`).

Everything you see today is **sample content**, badged `Sample content` in the UI.
The real content list is in `CONTENT_TODO.md`.

## Run it

Needs Node 22 or newer.

```bash
npm install
npm run dev            # http://localhost:3000
```

No `.env` is needed. Without a Gemini key, AI features use a mock provider labelled `Demo response`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build && npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests at 360 px (Playwright). Run `npm run build` and `npx playwright install chromium` first |
| `npm run content:check` | Validates `/content`, fails on errors, writes `CONTENT_TODO.md` |

## Configuration

Copy `.env.example` to `.env`. Never commit `.env`.

- `GEMINI_API_KEY`, `GEMINI_MODEL`: both needed to switch from the mock to Gemini. Use the exact model name from Google's docs.
- `MATCH_THRESHOLD`: camera mode confidence needed to show a place (default `0.85`).
- `NEXT_PUBLIC_DEMO_MODE`: `true` (default) also shows sample content. Set `false` for real, verified content only. Rebuild after changing it.

`/admin` shows whether AI is configured and the content status.

## Adding real content (no code changes)

| What | Where |
|---|---|
| Places | `content/places/*.json` |
| Stories | `content/stories/*.json` |
| Artisans | `content/artisans/*.json` |
| Workshops | `content/workshops/*.json` |
| Photos | `public/media/…`, plus an entry in `content/media.json` (owner, permitted use, contains people) |
| Signed consent forms | `private/` (gitignored). Reference the file name in `consent.docRef` |

Each file holds one object or an array. After every change, run `npm run content:check`.

Rules the app enforces:

- A visitor sees a story only when `verifiedBy` is set and `isSample` is `false`. In demo mode, sample stories also show, always badged.
- `sourceType` is `history`, `oral_tradition` or `legend`. `history` needs a `sourceRef`.
- An artisan can be `published` only with `consent.given`, `consent.date` and `ownerConfirmedAt`.
- A workshop can be `published` only with `confirmedByOwnerAt`.
- Every file in `public/media` needs a rights entry in `content/media.json`.

## Folders

- `app/`: pages and API routes
- `components/`: UI components
- `lib/`: schemas, repositories (JSON + SQLite), services (visibility and publish gates), AI providers
- `content/`: team-supplied content (JSON)
- `public/media/`: images
- `scripts/`: `content:check`
- `tests/`: unit and e2e tests
- `data/` (gitignored): SQLite database and uploads

See `BUILD_LOG.md` for what was built and when.
