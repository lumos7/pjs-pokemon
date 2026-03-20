---
phase: 01-full-app-build
plan: 02
subsystem: lib
tags: [typescript, pokeapi, elevenlabs, scenes, voices, pokemon]

# Dependency graph
requires: []
provides:
  - lib/scenes.ts — Scene type, 4 scene configs, 10 music tracks, pickRandomTrack
  - lib/voices.ts — 3 ElevenLabs voice IDs, VoiceId type, pickRandomVoice
  - lib/pokemon.ts — Pokemon type, fetchFirst250 (cached), getOfficialArtworkUrl
affects:
  - app/api/composite
  - app/api/tts
  - app/api/pokemon
  - components/SceneSelector
  - components/PokemonSelector
  - components/MusicPlayer

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Module-scope variable for in-memory caching (pokemonCache)
    - const array with `as const` + derived type (VOICE_IDS / VoiceId)
    - ID extracted from PokéAPI URL, not array index

key-files:
  created:
    - lib/scenes.ts
    - lib/voices.ts
    - lib/pokemon.ts
  modified: []

key-decisions:
  - "Pokemon ID extracted from PokéAPI URL segments, not array index — handles any ordering"
  - "Module-scope pokemonCache avoids repeated PokéAPI calls across requests"
  - "VOICE_IDS as const array with derived VoiceId type — type-safe voice selection"

patterns-established:
  - "lib/ files are pure TypeScript with typed exports, no React, no Node APIs"
  - "Caching pattern: module-scope nullable variable, check before fetch"

requirements-completed: [REQ-003]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 01 Plan 02: Lib Layer Summary

**Three shared lib modules — typed scenes config, ElevenLabs voice IDs with random picker, and cached PokéAPI helper with official artwork URL builder**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-20T03:32:05Z
- **Completed:** 2026-03-20T03:33:33Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Scene config with 4 backgrounds and 10 music track filenames, consumed by SceneSelector and MusicPlayer
- ElevenLabs voice IDs array with `as const` type safety and random picker function
- PokéAPI helper fetching first 250 Pokemon with module-scope cache, ID extracted from URL

## Task Commits

Each task was committed atomically:

1. **Task 1: Create lib/scenes.ts** - `13692d9` (feat)
2. **Task 2: Create lib/voices.ts** - `4e9eecb` (feat)
3. **Task 3: Create lib/pokemon.ts** - `3129095` (feat)

## Files Created/Modified

- `lib/scenes.ts` — Scene interface, 4 scenes array, 10 MUSIC_TRACKS, pickRandomTrack helper
- `lib/voices.ts` — VOICE_IDS const array (3 ElevenLabs IDs), VoiceId type, pickRandomVoice helper
- `lib/pokemon.ts` — Pokemon interface, fetchFirst250 with module cache, getOfficialArtworkUrl

## Decisions Made

- Pokemon ID extracted from URL segments rather than array index — more robust if PokéAPI ordering changes
- `as const` for VOICE_IDS enables derived VoiceId type without manual maintenance
- No error handling in getOfficialArtworkUrl — it's a pure URL builder, no I/O

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- tsc binary in node_modules/.bin/tsc had a broken relative path (`../lib/tsc.js`). Worked around by calling `node /path/to/typescript/lib/tsc.js --noEmit` directly — compilation succeeded with no errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three lib files are complete and TypeScript-clean
- API routes (composite, tts, pokemon) can now import from lib/
- Components (SceneSelector, PokemonSelector, MusicPlayer) can now import from lib/

---
*Phase: 01-full-app-build*
*Completed: 2026-03-20*
