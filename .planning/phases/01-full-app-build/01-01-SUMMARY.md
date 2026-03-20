---
phase: 01-full-app-build
plan: 01
subsystem: infra
tags: [next.js, sharp, tailwind, typescript, elevenlabs, assets]

requires: []
provides:
  - Next.js 14 App Router project with TypeScript and Tailwind CSS
  - All 5 scene images in public/images/ and 10 music tracks in public/music/
  - ElevenLabs API key env template
  - CLAUDE.md project coding instructions
  - memory/ reference files for Claude sessions
affects:
  - 01-02 (lib layer needs scenes/voices/pokemon config)
  - 01-03 (API routes need public/ assets and env key)
  - 01-04 (components need public/ assets and running Next.js)

tech-stack:
  added:
    - next@14.2.35
    - react@18
    - sharp@0.34.5
    - "@img/sharp-linux-x64@0.34.5 (optional, for Vercel)"
    - axios
    - typescript@5
    - tailwindcss@3.4.1
  patterns:
    - App Router (app/ directory with page.tsx and route.ts)
    - Server-side sharp calls via API routes
    - In-memory module-scope caching
    - Slug-safe audio filenames

key-files:
  created:
    - package.json
    - tsconfig.json
    - next.config.mjs
    - tailwind.config.ts
    - app/layout.tsx
    - app/page.tsx
    - public/images/canyon.jpg
    - public/images/coast.jpg
    - public/images/forest.jpg
    - public/images/glacier.jpg
    - "public/images/PokeMaster PJ.png"
    - public/music/pokemon-theme.mp3
    - public/music/title-screen.mp3
    - public/music/jigglypuffs-song.mp3
    - public/music/opening-theme.mp3
    - public/music/professor-oaks-theme.mp3
    - public/music/bicycle-theme.mp3
    - public/music/lance-and-red-battle-theme.mp3
    - public/music/celadon-city-fuchsia-city.mp3
    - public/music/pokemon-center-lofi.mp3
    - public/music/route-3-lofi.mp3
    - .env.local.example
    - CLAUDE.md
    - memory/project.md
    - memory/rules.md
    - memory/decisions.md
    - memory/plan.md
    - memory/architecture.md
    - .gitignore
  modified: []

key-decisions:
  - "Used optionalDependencies for @img/sharp-linux-x64 so it installs on Vercel (linux-x64) but not macOS dev"
  - "Dev script uses `next dev` without --turbopack to avoid Vercel incompatibilities"
  - "Music files renamed to slug-safe names: lowercase, hyphens, no spaces/unicode/ampersands"

patterns-established:
  - "Public assets: scene images in public/images/, audio in public/music/"
  - "All Sharp calls go in API routes (server-side), never in client components"
  - "ElevenLabs auth header is xi-api-key (not Authorization: Bearer)"

requirements-completed: [REQ-001, REQ-002, REQ-012, REQ-013]

duration: 4min
completed: 2026-03-20
---

# Phase 01 Plan 01: Scaffold and Asset Setup Summary

**Next.js 14 App Router + TypeScript + Tailwind scaffolded with Sharp, axios, all 5 scene images and 10 Pokemon music tracks in public/ with slug-safe names**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T03:24:33Z
- **Completed:** 2026-03-20T03:28:00Z
- **Tasks:** 3
- **Files modified:** 30+

## Accomplishments
- Next.js 14.2.35 App Router project scaffolded with TypeScript and Tailwind CSS
- Sharp 0.34.5 + @img/sharp-linux-x64 (optional for Vercel) + axios installed
- All 5 scene images copied to public/images/, all 10 audio tracks renamed and copied to public/music/ with slug-safe filenames
- CLAUDE.md, .env.local.example, and 5 memory reference files created

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 14 project and install dependencies** - `43ade8f` (feat)
2. **Task 2: Move and rename assets to public/** - `7aa9459` (feat)
3. **Task 3: Create .env.local.example, CLAUDE.md, and memory files** - `5443e32` (feat)

## Files Created/Modified
- `package.json` - Next.js 14 + sharp + @img/sharp-linux-x64 (optional) + axios
- `tsconfig.json` - TypeScript config
- `next.config.mjs` - Next.js config (no turbopack)
- `tailwind.config.ts` - Tailwind config
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Default home page
- `.gitignore` - Ignores node_modules, .next, env files, temp-scaffold
- `public/images/` - 5 scene images (canyon, coast, forest, glacier, PokeMaster PJ)
- `public/music/` - 10 slug-safe MP3 tracks
- `.env.local.example` - ELEVENLABS_API_KEY placeholder
- `CLAUDE.md` - Project coding conventions and stack details
- `memory/project.md` - App description and target user
- `memory/rules.md` - Key constraints (no DB, sharp in API routes, etc.)
- `memory/decisions.md` - Stack and voice ID decisions
- `memory/plan.md` - 4-plan roadmap overview
- `memory/architecture.md` - Full architecture: pages, API routes, lib, components, data flow

## Decisions Made
- Used `optionalDependencies` for `@img/sharp-linux-x64` — npm skips it on macOS but installs it on Vercel's Linux x64 environment
- Kept `next dev` without `--turbopack` as required for Vercel compatibility
- Audio files renamed during copy (not moved) so originals remain in audio/ untouched

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx next dev` failed due to a broken `.bin/next` symlink after copying node_modules from temp-scaffold. Resolved by running `npm install` to properly rebuild node_modules in the project root.
- `@img/sharp-linux-x64` refused to install on macOS arm64 with a platform error — expected behavior, used `optionalDependencies` instead of `dependencies` so it installs on Vercel (linux-x64) only.

## User Setup Required
- Create `.env.local` from `.env.local.example` and add real `ELEVENLABS_API_KEY` before using TTS features.

## Next Phase Readiness
- Next.js 14 dev server starts on localhost:3000
- All assets in public/ with correct structure
- Ready for Plan 02 (lib layer: scenes, voices, pokemon helpers)

## Self-Check: PASSED

- package.json: FOUND
- CLAUDE.md: FOUND
- .env.local.example: FOUND
- memory/project.md: FOUND
- public/images/ (5 files): FOUND
- public/music/ (10 files): FOUND
- Commit 43ade8f: FOUND
- Commit 7aa9459: FOUND
- Commit 5443e32: FOUND

---
*Phase: 01-full-app-build*
*Completed: 2026-03-20*
