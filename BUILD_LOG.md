# Build log

A dated record of what was built and when, kept because the event rules on prepared work are not yet confirmed.
Times are IST.

## M0 Scaffold: 2026-10-28 00:22

- Next.js 16.4.3 (App Router, TypeScript, Tailwind 4) scaffolded with create-next-app into an empty folder.
- `cacheComponents` turned off in `next.config.ts`: every page reads local JSON/SQLite per request, and the classic dynamic model is simpler to keep reliable.
- Dependencies pinned: zod 4.6.7, better-sqlite3 13.0.3, @google/genai 2.31.0, @photo-sphere-viewer/core 5.15.1. Dev: vitest 5.0.5, @playwright/test 1.64.1, tsx.
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `content:check`.
- Files: `package.json`, `next.config.ts`, `.env.example`, `.gitignore` (adds `/private`, `/data`), `README.md`, `BUILD_LOG.md`, `vitest.config.ts`, `playwright.config.ts`.
