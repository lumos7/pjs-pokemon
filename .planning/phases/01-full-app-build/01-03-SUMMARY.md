---
phase: 01-full-app-build
plan: 03
subsystem: api-routes
tags: [api, sharp, elevenlabs, tts, image-compositing, pokemon]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [pokemon-list-api, composite-image-api, tts-api]
  affects: [app/api/pokemon, app/api/composite, app/api/tts]
tech_stack:
  added: []
  patterns: [next-api-routes, sharp-compositing, svg-text-overlay, elevenlabs-proxy]
key_files:
  created:
    - app/api/pokemon/route.ts
    - app/api/composite/route.ts
    - app/api/tts/route.ts
  modified: []
decisions:
  - "Pokemon right-60% placement: leftMin = CANVAS_WIDTH * 0.4 (480px), random within remaining space"
  - "SVG caption uses paint-order stroke fill for text outline without external fonts"
  - "NextResponse(compositeImage as unknown as BodyInit) to satisfy Next.js 14 types with Buffer"
  - "xi-api-key header for ElevenLabs (not Authorization: Bearer) — locked convention"
metrics:
  duration: "5 min"
  completed: "2026-03-20"
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 01 Plan 03: API Routes Summary

**One-liner:** Three Next.js API routes — Pokemon JSON list, Sharp image compositor (1200x900 PNG), and ElevenLabs TTS proxy with xi-api-key auth.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Pokemon list + composite image API routes | ead546e | app/api/pokemon/route.ts, app/api/composite/route.ts |
| 2 | TTS proxy API route | 15424d1 | app/api/tts/route.ts |

## What Was Built

**GET /api/pokemon** — Fetches first 250 Pokemon from PokéAPI via `fetchFirst250()` (module-scope cached). Returns `[{ id, name }]` JSON array.

**POST /api/composite** — Accepts `{ sceneId, pokemonId, pokemonName }`. Composites:
- Scene background (1200x900, loaded from `public/images/`)
- Pokemon sprite (380x380 max, fit: inside) placed in right 60% of canvas with random vertical offset
- PJ character (`PokeMaster PJ.png`, 500px tall) pinned bottom-left
- SVG caption "Aziah meets [Name]!" at bottom centre, white fill with `paint-order: stroke fill` dark outline
Returns `image/png` binary.

**POST /api/tts** — Accepts `{ pokemonName }`. Proxies to ElevenLabs `/v1/text-to-speech/{voiceId}` with:
- Random voice from 3 configured IDs via `pickRandomVoice()`
- Model: `eleven_multilingual_v2`
- Header: `xi-api-key` (not Authorization)
- Text: "Aziah meets [Name]!"
Returns `audio/mpeg` binary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type error: Buffer not assignable to BodyInit**
- **Found during:** Task 1 verification (tsc --noEmit)
- **Issue:** `new NextResponse(compositeImage, ...)` where `compositeImage` is `Buffer` — Next.js 14 types require `BodyInit` which doesn't include Node.js `Buffer` directly
- **Fix:** Cast as `compositeImage as unknown as BodyInit` — works at runtime since Next.js handles Buffer correctly
- **Files modified:** app/api/composite/route.ts
- **Commit:** 15424d1 (included in TTS commit during amend)

## Self-Check: PASSED

- app/api/pokemon/route.ts — FOUND
- app/api/composite/route.ts — FOUND
- app/api/tts/route.ts — FOUND
- Commit ead546e — FOUND
- Commit 15424d1 — FOUND
