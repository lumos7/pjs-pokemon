---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
last_updated: "2026-03-20T03:44:21.114Z"
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 4
  completed_plans: 4
---

# PJ's Pokemon — Project State

**Project:** pjs-pokemon
**Started:** 2026-03-20
**Status:** Executing Phase 01
**Current Milestone:** M1 — Full Build

## Decisions

- Stack: Next.js 14 App Router + TypeScript + Tailwind CSS
- Image compositing: Sharp (server-side, API route)
- TTS: ElevenLabs API (proxy via API route)
- Pokemon data: PokéAPI, first 250, cached
- No database, no auth, no ORM
- Deploy target: Vercel
- Assets in public/images/ and public/music/
- ElevenLabs voice IDs: Gsndh0O5AnuI2Hj3YUlA, O4fnkotIypvedJqBp4yb, iukn3a1vSSNFmdi5NZS4 (random per generation)
- Music: random track per session, loops, starts on first user interaction
- TTS fires automatically when composite image is ready
- Download filename: aziah-meets-[pokemon-name].png
- Target user: child named Aziah, on tablet/phone
- Design: warm, bold, Pokémon-inspired colour palette, large tap targets, kids book feel
- [Phase 01-full-app-build]: Used optionalDependencies for @img/sharp-linux-x64 so it installs on Vercel but not macOS dev
- [Phase 01-full-app-build]: Pokemon ID extracted from PokéAPI URL segments, not array index
- [Phase 01-full-app-build]: Module-scope pokemonCache for in-memory PokéAPI caching across requests
- [Phase 01-full-app-build]: Pokemon right-60% canvas placement using leftMin = CANVAS_WIDTH * 0.4
- [Phase 01-full-app-build]: SVG caption uses paint-order stroke fill for outline without external fonts
- [Phase 01-full-app-build]: ElevenLabs uses xi-api-key header (not Authorization: Bearer)
- [Phase 01-full-app-build]: Surprise handler calls generate() directly with random values to avoid async setState race condition
- [Phase 01-full-app-build]: Binary API responses (image, audio) use res.blob() + URL.createObjectURL() on client

## History

- 2026-03-20: Project initiated with full spec
- 2026-03-20: Completed Plan 01-01 — scaffold, assets, config (4 min, 3 tasks, 30+ files)
- 2026-03-20: Completed Plan 01-02 — lib layer: scenes, voices, pokemon (2 min, 3 tasks, 3 files)
- 2026-03-20: Completed Plan 01-03 — API routes: pokemon list, composite image, TTS proxy (5 min, 2 tasks, 3 files)
