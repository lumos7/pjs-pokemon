# Phase 1: Full App Build - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning
**Source:** User spec (direct)

<domain>
## Phase Boundary

Build the complete "PJ's Pokemon" interactive kids book web app. A child named Aziah picks a background scene and a Pokémon; the app composites them with his character (PokeMaster PJ.png) into a shareable image, reads "Aziah meets [Pokémon name]!" aloud via ElevenLabs TTS, and loops background Pokémon music throughout.

Deliverables: working Next.js app, landing page, encounter builder page, composite API, TTS API, Pokémon API, all components, mobile responsive, Vercel-deployable.

</domain>

<decisions>
## Implementation Decisions

### Stack (LOCKED)
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Sharp for server-side image compositing
- ElevenLabs API for TTS
- PokéAPI for Pokémon data (first 250)
- No database, no auth, no ORM
- Vercel deployment

### Assets (LOCKED)
- Source images in images/ → move to public/images/
- Source audio in audio/ → move to public/music/ (rename files: no spaces, ampersands, or Unicode)
- PokeMaster PJ.png stays as the child's character overlay
- 4 scenes: canyon, coast, forest, glacier

### ElevenLabs (LOCKED)
- Header: `xi-api-key` (NOT Authorization: Bearer)
- Voice IDs (random per generation): Gsndh0O5AnuI2Hj3YUlA, O4fnkotIypvedJqBp4yb, iukn3a1vSSNFmdi5NZS4
- Text: "Aziah meets [Pokémon name]!"
- TTS fires automatically when composite image is ready

### Sharp on Vercel (LOCKED)
- Install `@img/sharp-linux-x64` at same version as `sharp` as direct dependency
- This bundles the Linux binary for Vercel serverless
- Do NOT use --turbopack in build scripts

### Image Compositing (LOCKED)
- Pokémon placed randomly in right 60% of canvas, vertically centred ± random offset
- PJ character (PokeMaster PJ.png) composited into scene
- Text overlay: "Aziah meets [Pokémon name]!" bottom-centre, white with dark outline
- Text implementation: SVG Buffer composited over image (Sharp text doesn't support stroke — use SVG with paint-order: stroke fill)
- Minimum 48px font size

### Music (LOCKED)
- Random track per session from public/music/
- Starts on first user interaction (click/touchstart on document) — audio autoplay policy
- Loops throughout session
- Mute toggle available

### Download (LOCKED)
- Filename: aziah-meets-[pokemon-name].png

### Design (LOCKED)
- Warm, bold, Pokémon-inspired colour palette
- Large tap targets (minimum 48px touch targets)
- Kids book feel
- Mobile-first, primary user is child on tablet/phone

### Project Structure (LOCKED)
```
app/
  page.tsx                  ← Landing page
  encounter/
    page.tsx                ← Encounter builder
  api/
    composite/route.ts      ← Sharp compositor
    tts/route.ts            ← ElevenLabs proxy
    pokemon/route.ts        ← PokéAPI fetch/cache
components/
  PokemonSelector.tsx
  SceneSelector.tsx
  EncounterCanvas.tsx
  MusicPlayer.tsx
  SurpriseButton.tsx
lib/
  pokemon.ts
  voices.ts
  scenes.ts
public/
  images/                   ← scene backgrounds + PJ character
  music/                    ← MP3 tracks (renamed)
```

### Claude's Discretion
- Exact Tailwind colour values (stay warm/Pokémon-feel: yellows, reds, blues)
- Pokémon API response caching strategy (in-memory Map is fine, no DB)
- Exact canvas dimensions for composite (suggest 800×600 or 1200×800)
- PokéAPI HD artwork URL: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`
- Component internal state management (useState/useCallback, no external state lib)
- Error states / loading states UI

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

Key external references:
- PokéAPI list endpoint: `https://pokeapi.co/api/v2/pokemon?limit=250&offset=0`
- PokéAPI HD artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`
- ElevenLabs TTS endpoint: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- ElevenLabs auth header: `xi-api-key`

</canonical_refs>

<specifics>
## Specific Ideas

- Music files need renaming during asset move: strip spaces, ampersands, Unicode chars (e.g., "Kato - Pokémon Center - Lofi.mp3" → "pokemon-center-lofi.mp3")
- The 10 audio files currently in audio/: use all of them, pick random index with Math.random()
- PokéAPI first 250: use offset=0&limit=250 on the list endpoint, then for each Pokémon extract ID from URL to build artwork URL
- SVG text overlay pattern:
  ```js
  const svg = `<svg ...><text ... style="paint-order: stroke fill; stroke: #000; stroke-width: 4; fill: white; font-size: 48px">${text}</text></svg>`
  await sharp(base).composite([{ input: Buffer.from(svg), ... }])
  ```

</specifics>

<deferred>
## Deferred Ideas

- Multiple child profiles (only Aziah for now)
- Social sharing (only download for now)
- All 898 Pokémon (only first 250 for now)
- Animated GIF output
- Additional scenes beyond the 4 provided

</deferred>

---

*Phase: 01-full-app-build*
*Context gathered: 2026-03-20 via direct spec*
