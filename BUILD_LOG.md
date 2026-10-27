# Build log

A dated record of what was built and when, kept because the event rules on prepared work are not yet confirmed.
Times are IST.

## M0 Scaffold: 2026-10-28 00:22

- Next.js 16.4.3 (App Router, TypeScript, Tailwind 4) scaffolded with create-next-app into an empty folder.
- `cacheComponents` turned off in `next.config.ts`: every page reads local JSON/SQLite per request, and the classic dynamic model is simpler to keep reliable.
- Dependencies pinned: zod 4.6.7, better-sqlite3 13.0.3, @google/genai 2.31.0, @photo-sphere-viewer/core 5.15.1. Dev: vitest 5.0.5, @playwright/test 1.64.1, tsx.
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `content:check`.
- Files: `package.json`, `next.config.ts`, `.env.example`, `.gitignore` (adds `/private`, `/data`), `README.md`, `BUILD_LOG.md`, `vitest.config.ts`, `playwright.config.ts`.

## M1 Design foundation: 2026-10-28 00:31

- Design tokens as CSS variables (ink, lake, saffron, rose, paper, plus sky and mist from the story page) in `app/globals.css`.
- Fonts: Tiro Devanagari Hindi (headings) and Hind (body) via next/font.
- Layout shell with a demo-mode banner, header, main nav and footer (`app/layout.tsx`).
- EN/HI language switch (cookie set by a server action). Hindi strings are a first pass and need native-speaker review.
- Components: Button, ButtonLink, Card, Label, SampleBadge, NotRealLabel (Concept/Illustrative/Demo response/Estimate/Synthetic voice), SourceTypeLabel, EmptyState, ErrorState, SearchBox, IDontKnow (`components/ui.tsx`); PlaceHeader, PlaceCard, StoryBlock, ArtisanCard, IllustrativePhoto (`components/domain.tsx`).
- `/story` route: shows `public/story/index.html` in a frame if the team copies it there, always with a "Needs rights confirmation" note. Not installed now, because the clips' rights are unconfirmed.
- Error and not-found pages.
- Files: app/globals.css, app/layout.tsx, app/page.tsx (temporary), app/error.tsx, app/not-found.tsx, app/story/page.tsx, components/ui.tsx, components/domain.tsx, components/LanguageSwitch.tsx, lib/i18n.ts, lib/lang-server.ts, lib/actions/lang.ts, lib/config.ts.
