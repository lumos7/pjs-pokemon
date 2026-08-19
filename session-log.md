# Session Log

> Auto-maintained by Claude. Most recent session first.

---

## Session — [DATE]

### What Was Done
- (Claude fills this at session end)

### What Broke
- (Claude fills this at session end)

### What's Next
- (Claude fills this at session end)

### Decisions Made
- (Claude fills this at session end)

---

## 2026-08-19 — Audio overhaul + PWA + round-table review sweep

**Round table:** 3 expert review agents (audio engineering, Next.js perf/correctness, kids-UX/PWA) ran in parallel; findings verified and folded in.

### Audio bugs fixed (the reported overlaps + laggy TTS)
- NEW `lib/audioBus.ts` — single shared HTMLAudioElement for ALL one-shot audio (TTS/cries/jingles). Overlap now physically impossible; element is unlocked on first gesture (fixes iOS autoplay rejections after fetch awaits); `done` promise always settles (fixes queue deadlocks on stop/preempt/block).
- All 7 audio call-sites (encounter, quiz, pokedex cards, pokemon-of-the-day, birthday, queue engine) routed through the bus.
- Background music now DUCKS to 25% under voice clips (pj-audio-active/idle events).
- Mute button now mutes everything, not just music.
- TTS: ElevenLabs model multilingual_v2 → flash_v2_5 (3-5× faster), server-side cache + in-flight dedupe (free-tier 429 fix), client nameOnly clip cache, queue TTS fetched in parallel with image + next-item TTS prefetched.
- Safari/iOS: .ogg cries fall back to Showdown mp3s (cries were 100% silent on Apple devices).
- MusicPlayer: "Next ♪" during theme no longer permanently kills bg music; unlock retries on failure; next track pre-decoded (gapless); zipper-noise-free gain ramps.

### Bugs fixed (round-table findings)
- Queue uid collision after refresh (duplicate keys / double-remove).
- Pokemon of the Day flipped at 1am London (UTC seed) → local date.
- /api/tts abuse hole closed (message whitelist, length cap) — logged to .shared/security-todo.md.
- /api/composite: input validation, Pango escaping, 8s artwork timeout, maxDuration=30, PJ+artwork memos, outputFileTracingIncludes.
- Object URL leaks: composite revoked on replace, TTS revoked after play, encounterImages LRU-capped (16).
- PokeAPI over-fetch: shared promise caches (lib/pokeapiCache.ts) for detail/species/evolution; all 3 pages use cached fetchAllPokemon(); ~75% traffic cut.
- alert() on generate failure → inline kid-friendly retry; retry states on all list loads.

### PWA (new)
- manifest.webmanifest (standalone, portrait, theme #CC0000), icons 192/512/maskable/apple-touch (generated from PJ art), public/sw.js (shell precache, cache-first CDN sprites/cries/music, network-only APIs), ServiceWorkerRegister (prod only), viewport export + appleWebApp metadata, safe-area insets on nav + music bar.

### UX improvements
- Sticky "Go! Meet X!" CTA on encounter; quiz choices get 🔊 speak-the-name (pre-reader support); quiz "?" no longer clipped off-screen; Bangers font actually loads in browser (@font-face from public/fonts); touch targets bumped to 44px+; active:scale press feedback everywhere; GenFilter closes on outside tap; PokemonSelector caps rendered rows (jank); Download uses share sheet on iOS PWA; spinning Pokéball loader; body scroll-lock + z-fix on result modal.

### Housekeeping
- Deleted dead /api/pokemon route + 325MB temp-scaffold/ (moved to trash-staging per hook).
- voices.ts deduped. Console noise stripped.

**Build:** passes. Routes smoke-tested 200. NOT pushed yet.

**Next:** push to deploy (pre-push hook runs build); consider on-device iPad test of TTS unlock + cry fallback; parked: QueuePanel hard-coded bottom geometry, touch drag-reorder, quiz sprite hints.

### Pre-push review fixes (same session, amended into the commit)
- /api/tts: pokemonName now validated against the canonical 1025-name set (lib/pokemonNames.ts, generated from PokeAPI) — free-form billable text rejected 400; per-IP fixed-window rate limit (30/min → 429). Cache key confirmed voiceId+full-text.
- Sprite `<img>`s: crossOrigin="anonymous" added (raw.githubusercontent sends ACAO:*) — without it responses were opaque and the SW cached NOTHING from the CDN. Audio bus deliberately untouched (Showdown has no ACAO).
- SW: now generated from sw.template.js by scripts/gen-sw.mjs (chained in `build`, not prebuild — pnpm doesn't auto-run pre-scripts); VERSION = Vercel commit SHA so caches rotate per deploy and swapped unhashed assets reach installed users. public/sw.js gitignored.
- SW guards: Range-request bail (206 put-throw + Safari seek), res.ok && !res.redirected before caching, _next/static in its own untrimmed version-scoped cache (was FIFO-evicted by Pokédex browsing → offline white screen), shell keys normalised to pathname + ignoreSearch fallback.
- Manifest: portrait orientation lock removed (iPad landscape).
- Gotcha caught in smoke test: String.replace only substitutes the first occurrence — the template comment ate the version and the const kept the placeholder; gen-sw now uses split/join + output assertion.
