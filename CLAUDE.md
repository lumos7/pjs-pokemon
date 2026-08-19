# PJ's Pokemon — Project Context

## What This Is
Interactive kids' web app where PJ meets Pokemon — scene compositing, TTS narration, Pokedex, quiz, and daily featured Pokemon.

## Full Reference
See /Users/lumos/Projects/pjs-pokemon/docs/PROJECT-REFERENCE.md for complete project documentation.

## Quick Reference
- Next.js 14 App Router + TypeScript + Tailwind CSS + Sharp + ElevenLabs TTS
- No database, no auth, no ORM — all state is in-memory, localStorage, or sessionStorage
- 5 pages: landing, encounter builder, Pokedex (1025 Pokemon), quiz, Pokemon of the Day
- 2 API routes: /api/composite (POST, Sharp), /api/tts (POST, ElevenLabs — pokemonName validated against lib/pokemonNames.ts, per-IP rate limited)
- Sharp on Vercel requires @img/sharp-linux-x64 optional dep + serverComponentsExternalPackages config
- ElevenLabs uses `xi-api-key` header (NOT Bearer auth) — Bella voice only (free tier)
- Web Audio API for background music with Fisher-Yates shuffle queue
- All Sharp/ElevenLabs calls must be in API routes (server-side only)
- Do NOT use --turbopack flag
- Read memory/*.md files at session start for additional context

## Key Files
- `lib/audioBus.ts` — SINGLE shared HTMLAudioElement for ALL one-shot audio (TTS/cries/jingles). Route every new sound through `playExclusive`/`playClip` — never `new Audio()` directly. Emits pj-audio-active/idle (MusicPlayer ducks bg music on these). Unlocked on first gesture for iOS.
- `lib/pokeapiCache.ts` — promise-cached PokeAPI detail/species/evolution fetches; use these instead of raw fetch
- `sw.template.js` → `public/sw.js` (GENERATED, gitignored) — edit the TEMPLATE, never public/sw.js. `scripts/gen-sw.mjs` injects a commit-SHA cache VERSION during `pnpm build`, so caches rotate automatically per deploy. Plus `public/manifest.webmanifest` + `components/ServiceWorkerRegister.tsx` — PWA (installable, offline shell, cache-first sprites; sprite `<img>`s need `crossOrigin="anonymous"` or the SW can't cache them).
- `app/encounter/page.tsx` — Main encounter builder (scene + Pokemon selection + generation)
- `app/quiz/page.tsx` — Who's That Pokemon? silhouette quiz with session persistence
- `app/api/composite/route.ts` — Sharp image compositing (scene + Pokemon + PJ + caption)
- `app/api/tts/route.ts` — ElevenLabs TTS proxy
- `components/MusicPlayer.tsx` — Web Audio background music player
- `components/EncounterCanvas.tsx` — Composite result modal with size comparison
- `components/PokemonCard.tsx` — Lazy-loaded Pokemon card with types, evolution, cries
- `lib/pokemon.ts` — PokeAPI helpers, generation config, type color map
- `lib/scenes.ts` — Scene config, music tracks, Fisher-Yates shuffle

## Conventions
- App Router patterns: route.ts for API, page.tsx for pages
- Client components marked with 'use client'
- Tailwind for all styling, no CSS modules
- Raw fetch for HTTP, no wrapper libraries
- In-memory caching (module-scope variables), no external cache
- Music files must be slug-safe lowercase names in public/music/
- Image compositing uses path.join(process.cwd(), 'public', ...) for file paths

## Deploying
- Push to `main` — auto-deploys on Vercel
- Set `ELEVENLABS_API_KEY` in Vercel environment variables
- No build flags needed — `pnpm build` handles everything
