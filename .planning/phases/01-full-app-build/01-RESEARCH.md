# Phase 1: Full App Build - Research

**Researched:** 2026-03-20
**Domain:** Next.js 14 App Router / Sharp image compositing / ElevenLabs TTS / PokéAPI / Browser audio
**Confidence:** HIGH (core stack), MEDIUM (Vercel sharp config), HIGH (ElevenLabs API)

---

## Summary

This is a greenfield Next.js 14 App Router app with no database, no auth, and no ORM. The stack is locked: Next.js 14 + TypeScript + Tailwind CSS + Sharp + ElevenLabs TTS + PokéAPI. All project assets already exist in `images/` and `audio/` and need moving to `public/`.

The main technical risk is Sharp on Vercel serverless. Sharp installs platform-specific native binaries. Building on macOS then deploying to Vercel's Linux environment can cause "Could not load the 'sharp' module using the linux-x64 runtime." The fix is reliable: add `@img/sharp-linux-x64` as a direct dependency alongside `sharp`. For text overlays with stroke/outline, Sharp's built-in `input.text` supports Pango markup and RGBA but does NOT support text stroke natively — use SVG compositing instead.

Audio autoplay is locked to first-user-interaction by all modern browsers. The `HTMLAudioElement.play()` call must happen inside a user gesture handler (click/tap). Music setup pattern: create audio element at session start, call `.play()` inside the "Let's Go" button click handler, then the audio is unlocked for the session.

**Primary recommendation:** Scaffold with `npx create-next-app@14 --typescript --tailwind --app --no-turbo`, install `sharp @img/sharp-linux-x64`, and implement text captions via SVG Buffer composited over the final image.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-001 | Next.js 14 App Router + TS + Tailwind scaffold, Sharp + axios, assets to public/ | Scaffold command, package list, asset move confirmed |
| REQ-002 | memory/ directory + CLAUDE.md | Simple file creation, no technical research needed |
| REQ-003 | lib/scenes.ts, lib/voices.ts, lib/pokemon.ts | PokéAPI endpoint + voice ID array confirmed |
| REQ-004 | API routes: pokemon, composite, tts | All three APIs researched, endpoints + patterns confirmed |
| REQ-005 | Components: MusicPlayer, SceneSelector, PokemonSelector, SurpriseButton, EncounterCanvas | Audio autoplay unlock pattern researched |
| REQ-006 | Pages: landing + encounter | Standard Next.js App Router pages |
| REQ-007 | Sharp compositing: pokemon position + caption text | SVG text-overlay pattern confirmed for stroke text |
| REQ-008 | TTS auto-fires on image ready, random voice | ElevenLabs endpoint + response format confirmed |
| REQ-009 | Music on first interaction, loops, random track | Audio autoplay unlock pattern confirmed |
| REQ-010 | Download as "aziah-meets-[pokemon-name].png" | HTML anchor download attribute pattern |
| REQ-011 | Mobile responsive, large tap targets | Tailwind responsive utilities |
| REQ-012 | .env.local.example + Vercel config for Sharp | @img/sharp-linux-x64 dependency fix confirmed |
| REQ-013 | Vercel deploy works | Sharp linux x64 fix confirmed, no turbopack flag |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 14.2.35 | App framework, routing, API routes | Locked decision |
| typescript | (bundled) | Type safety | Locked decision |
| tailwindcss | 4.2.2 | Styling | Locked decision |
| sharp | 0.34.5 | Server-side image compositing | Locked decision |
| @img/sharp-linux-x64 | 0.34.5 | Sharp native binary for Vercel Linux | Required for Vercel deployment |
| axios | 1.13.6 | HTTP client for PokéAPI + ElevenLabs | Simple, consistent error handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | 19.2.14 | React type definitions | Always with TS React |
| @types/node | (bundled) | Node type definitions | Needed for path, fs in API routes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVG text overlay | sharp `input.text` Pango | Sharp text has no stroke/outline support; SVG gives full control |
| axios | native fetch | fetch works fine in API routes, but axios has better error messages — either works |

**Installation:**
```bash
npx create-next-app@14 pjs-pokemon --typescript --tailwind --app --no-turbo --eslint
cd pjs-pokemon
npm install sharp @img/sharp-linux-x64 axios
```

**Version verification (confirmed 2026-03-20):**
- `sharp`: 0.34.5 (latest stable, published 2026-01-02)
- `@img/sharp-linux-x64`: 0.34.5
- `next`: 14.2.35 (latest 14.x patch)
- `tailwindcss`: 4.2.2
- `axios`: 1.13.6

---

## Architecture Patterns

### Recommended Project Structure
```
public/
├── images/          # canyon.jpg, coast.jpg, forest.jpg, glacier.jpg, PokeMaster PJ.png
└── music/           # 10 MP3 tracks
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── encounter/
│   │   └── page.tsx                # Main encounter builder
│   └── api/
│       ├── pokemon/route.ts        # PokéAPI proxy + cache
│       ├── composite/route.ts      # Sharp image compositor
│       └── tts/route.ts            # ElevenLabs TTS proxy
├── components/
│   ├── MusicPlayer.tsx
│   ├── SceneSelector.tsx
│   ├── PokemonSelector.tsx
│   ├── SurpriseButton.tsx
│   └── EncounterCanvas.tsx
└── lib/
    ├── scenes.ts
    ├── voices.ts
    └── pokemon.ts
memory/
├── project.md
├── rules.md
├── decisions.md
├── plan.md
└── architecture.md
CLAUDE.md
.env.local.example
```

### Pattern 1: Next.js App Router API Route returning binary image

```typescript
// Source: Next.js App Router docs + verified pattern
// app/api/composite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const { sceneFile, pokemonUrl, pokemonName } = await req.json()

  // fetch pokemon PNG
  const pokemonRes = await fetch(pokemonUrl)
  const pokemonBuffer = Buffer.from(await pokemonRes.arrayBuffer())

  // build SVG caption (white text + dark outline via paint-order)
  const svgCaption = `<svg width="1200" height="100">
    <style>
      text {
        font-family: Arial, sans-serif;
        font-size: 56px;
        font-weight: bold;
        fill: white;
        stroke: #222;
        stroke-width: 6px;
        paint-order: stroke fill;
        text-anchor: middle;
        dominant-baseline: middle;
      }
    </style>
    <text x="600" y="50">Aziah meets ${pokemonName}!</text>
  </svg>`

  const composite = await sharp(`public/images/${sceneFile}`)
    .resize(1200, 900)
    .composite([
      { input: await sharp(pokemonBuffer).resize(400).toBuffer(), top: randomTop, left: randomLeft },
      { input: Buffer.from(`public/images/PokeMaster PJ.png`), gravity: 'southwest' },
      { input: Buffer.from(svgCaption), top: 800, left: 0 },
    ])
    .png()
    .toBuffer()

  return new NextResponse(composite, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
```

### Pattern 2: ElevenLabs TTS API route

```typescript
// Source: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pickRandomVoice } from '@/lib/voices'

export async function POST(req: NextRequest) {
  const { pokemonName } = await req.json()
  const voiceId = pickRandomVoice()

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: `Aziah meets ${pokemonName}!`,
        model_id: 'eleven_multilingual_v2',
      }),
    }
  )

  const audioBuffer = await res.arrayBuffer()
  return new NextResponse(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  })
}
```

### Pattern 3: PokéAPI — fetch first 250, cache in module scope

```typescript
// Source: https://pokeapi.co/docs/v2 — fair use policy recommends local caching
// lib/pokemon.ts
let pokemonCache: { id: number; name: string }[] | null = null

export async function fetchFirst250() {
  if (pokemonCache) return pokemonCache
  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=250&offset=0')
  const data = await res.json()
  pokemonCache = data.results.map((p: { name: string; url: string }, i: number) => ({
    id: i + 1,
    name: p.name,
  }))
  return pokemonCache
}

export function getOfficialArtworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}
```

### Pattern 4: Audio autoplay unlock on first interaction

```typescript
// Source: MDN Autoplay guide — AudioContext must be resumed on user gesture
// components/MusicPlayer.tsx
'use client'
import { useEffect, useRef } from 'react'

export function MusicPlayer({ tracks }: { tracks: string[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const track = tracks[Math.floor(Math.random() * tracks.length)]
    const audio = new Audio(`/music/${track}`)
    audio.loop = true
    audioRef.current = audio

    // Must be triggered by user gesture — attach to document once
    const unlock = () => {
      audio.play().catch(() => {})
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
    }
  }, [])

  return null // hidden player
}
```

### Anti-Patterns to Avoid

- **Calling `audio.play()` on page load without user gesture:** Browsers will silently reject it. Always tie first play to a click/touchstart handler.
- **Using `--turbopack` flag with sharp:** Causes "Could not load the 'sharp' module" on Vercel. Use standard `next build` (no turbopack flag).
- **Importing sharp in Client Components:** Sharp is Node.js only — it must stay in API routes and server-side code.
- **Using `useEffect` to fire TTS before image is ready:** Fire TTS only after the composite API call resolves and the image src is set.
- **Reading files from `public/` with `fs` in production:** On Vercel, use `path.join(process.cwd(), 'public', ...)` not relative paths.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text with stroke/outline | Custom canvas text renderer | SVG `paint-order: stroke fill` composited via Sharp | SVG handles fonts, sizing, exact positioning with one Buffer |
| Image resize + format convert | Manual pixel manipulation | `sharp().resize().png().toBuffer()` | Sharp handles all edge cases |
| Pokemon list + artwork | Scraping or bundling sprites | PokéAPI + GitHub raw sprites CDN | Free, stable, HD PNG, no hosting cost |
| TTS audio | Browser Speech Synthesis API | ElevenLabs API (locked decision) | Browser TTS sounds robotic; ElevenLabs is natural |
| Platform binary switching | npm scripts / postinstall | `@img/sharp-linux-x64` as direct dep | Correct binary always available on Vercel |

**Key insight:** SVG-as-Buffer compositing is the standard pattern for text overlays in Sharp. Building it any other way reintroduces complexity Sharp already solves.

---

## Common Pitfalls

### Pitfall 1: Sharp linux-x64 module not found on Vercel
**What goes wrong:** Build succeeds locally on macOS, but runtime throws "Could not load the 'sharp' module using the linux-x64 runtime"
**Why it happens:** Sharp installs macOS binaries locally; Vercel runs Linux. Without the linux binary present, the module fails at runtime.
**How to avoid:** Add `@img/sharp-linux-x64` as a direct dependency in `package.json` (same version as `sharp`). This forces the Linux binary to be installed and bundled.
**Warning signs:** Successful Vercel build but 500 errors on any route that calls Sharp.

### Pitfall 2: Audio plays before user gesture
**What goes wrong:** `audio.play()` is called on mount or page load; Chrome/Safari silently fail with a DOMException. User hears nothing.
**Why it happens:** All modern browsers block autoplay without prior user activation.
**How to avoid:** Attach play() call to the first click or touchstart event on the document (or the "Let's Play" button). Remove the listener after first fire.
**Warning signs:** No audio on first load; console shows "DOMException: play() failed because the user didn't interact with the document first."

### Pitfall 3: PokéAPI rate limiting
**What goes wrong:** Multiple rapid requests to PokéAPI trigger rate limits or slow responses.
**Why it happens:** PokéAPI requests local caching explicitly in their Fair Use Policy.
**How to avoid:** Cache the 250-Pokémon list in module scope (or Next.js route cache). The `/api/pokemon` route should return from cache on subsequent calls.
**Warning signs:** Slow Pokémon selector load times, occasional 429 responses.

### Pitfall 4: Sharp composite top/left out of bounds
**What goes wrong:** Pokemon sprite gets clipped or disappears when placed at computed random position.
**Why it happens:** If `left + spriteWidth > canvasWidth`, the overlay is silently cropped.
**How to avoid:** After computing random position in right 60% of canvas, clamp `left` to `Math.min(left, canvasWidth - resizedPokemonWidth)`. Same for `top`.
**Warning signs:** Pokemon partially visible or invisible on edge positions.

### Pitfall 5: ElevenLabs API key exposed to client
**What goes wrong:** API key leaked in browser network tab.
**Why it happens:** Calling ElevenLabs directly from client-side fetch.
**How to avoid:** All ElevenLabs calls go through `app/api/tts/route.ts` (server-side). Key stays in env var only.
**Warning signs:** ElevenLabs key visible in browser DevTools Network tab.

### Pitfall 6: Vercel 4.5MB request body limit
**What goes wrong:** Large composite images sent as base64 in request body fail.
**Why it happens:** Vercel serverless functions have a 4.5MB inbound payload limit.
**How to avoid:** Never send image data in the request body. Send only scene name + pokemon ID (strings). The composite API route fetches the pokemon sprite server-side.
**Warning signs:** 413 or 500 errors when generating composites for large sprites.

---

## Code Examples

### Sharp: SVG text overlay with stroke (caption pattern)
```typescript
// Source: sharp compositing docs + SVG paint-order standard
const width = 1200
const captionText = `Aziah meets ${pokemonName}!`
const svgBuffer = Buffer.from(`
  <svg width="${width}" height="80" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${width / 2}"
      y="60"
      font-family="Arial, sans-serif"
      font-size="56"
      font-weight="bold"
      fill="white"
      stroke="#1a1a1a"
      stroke-width="6"
      paint-order="stroke fill"
      text-anchor="middle"
    >${captionText}</text>
  </svg>
`)
// Composite onto final image near bottom
.composite([{ input: svgBuffer, top: canvasHeight - 90, left: 0 }])
```

### Sharp: Pokemon placement in right 60%
```typescript
// Pokémon placed randomly in right 60% of canvas, vertically centred ± offset
const canvasWidth = 1200
const canvasHeight = 900
const spriteSize = 380

const leftMin = Math.floor(canvasWidth * 0.4)
const leftMax = canvasWidth - spriteSize
const left = leftMin + Math.floor(Math.random() * (leftMax - leftMin))

const topCenter = Math.floor((canvasHeight - spriteSize) / 2)
const vertOffset = Math.floor((Math.random() - 0.5) * 200)
const top = Math.max(0, Math.min(topCenter + vertOffset, canvasHeight - spriteSize))
```

### Next.js App Router: return PNG buffer from API route
```typescript
// Source: Next.js App Router docs
return new NextResponse(imageBuffer, {
  status: 200,
  headers: {
    'Content-Type': 'image/png',
    'Cache-Control': 'no-store',
  },
})
```

### ElevenLabs TTS: full request with correct header
```typescript
// Source: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
// Header name is 'xi-api-key' (NOT 'Authorization: Bearer')
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text: 'Aziah meets Pikachu!',
      model_id: 'eleven_multilingual_v2',
    }),
  }
)
// Response body is binary audio/mpeg — pipe directly to client
```

### PokéAPI: list + artwork URL
```typescript
// First 250: GET https://pokeapi.co/api/v2/pokemon?limit=250&offset=0
// Official artwork: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
// Shiny: .../official-artwork/shiny/{id}.png
```

### Client-side: download composited image
```typescript
// Source: HTML5 anchor download attribute
const handleDownload = (imageUrl: string, pokemonName: string) => {
  const a = document.createElement('a')
  a.href = imageUrl
  a.download = `aziah-meets-${pokemonName.toLowerCase()}.png`
  a.click()
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `overlayWith()` Sharp method | `composite([])` array method | Sharp v0.28+ | Old method removed; use `composite()` |
| `Authorization: Bearer` header | `xi-api-key` header | ElevenLabs API v1 | Wrong header = 401, not 403 |
| `official_artwork` key | `official-artwork` key (hyphen) | PokéAPI update | URL path uses hyphen, not underscore |
| Sharp without linux binary | Sharp + `@img/sharp-linux-x64` | Sharp v0.33+ | Separate package for each platform binary |

**Deprecated/outdated:**
- `sharp.overlayWith()`: Removed. Use `.composite([{ input: ... }])`.
- ElevenLabs `optimize_streaming_latency` param: Deprecated in newer API versions, omit it.

---

## Open Questions

1. **Font availability on Vercel for SVG text rendering**
   - What we know: SVG text in a Buffer composited by Sharp uses the system font stack. Vercel's Linux environment has a limited font set.
   - What's unclear: Whether Arial/sans-serif fallback renders acceptably or looks broken.
   - Recommendation: Use `font-family="Arial, Liberation Sans, sans-serif"` as fallback chain. If output looks wrong, embed a font file and use Sharp's `fontfile` option or pre-rasterise text differently. Test on first deploy.

2. **Vercel free tier: function execution time for Sharp compositing**
   - What we know: Default serverless timeout is 10s on hobby tier. Sharp compositing of 3 images should complete in 1-2s.
   - What's unclear: Whether fetching the pokemon sprite from GitHub CDN adds enough latency to risk timeout.
   - Recommendation: Pre-fetch pokemon sprite client-side and send only the pokemon ID; let API route construct the CDN URL server-side and fetch directly — should be well within 10s.

3. **Music file names with special characters**
   - What we know: Some audio filenames contain spaces, ampersands, and Unicode (e.g., "Kato - Pokémon Center - Lofi.mp3").
   - What's unclear: Whether serving these filenames directly from `public/music/` causes URL encoding issues in the Audio element `src`.
   - Recommendation: Rename all music files during the asset-move step to slug-safe names (e.g., `pokemon-center-lofi.mp3`). Build the track list in `lib/scenes.ts` or a dedicated `lib/tracks.ts` from the known safe names.

---

## Validation Architecture

Per project conventions (CLAUDE.md: "I test features manually against real data, not unit tests"), automated test infrastructure is not part of this build. Manual testing protocol:

| REQ | Manual Test |
|-----|-------------|
| REQ-007 | Generate composites with 5 different Pokémon, verify placement stays in right 60%, caption readable |
| REQ-008 | Tap generate, confirm TTS audio plays within 2s of image appearing |
| REQ-009 | Load landing page, tap "Let's Play", confirm music starts |
| REQ-013 | Deploy to Vercel, hit each API route, confirm no 500s |

No test files to create. No Wave 0 gaps.

---

## Sources

### Primary (HIGH confidence)
- Sharp official docs: https://sharp.pixelplumbing.com/api-composite/ — composite API, text input options
- Sharp install docs: https://sharp.pixelplumbing.com/install/ — Linux/Vercel configuration
- ElevenLabs API reference: https://elevenlabs.io/docs/api-reference/text-to-speech/convert — endpoint, headers, request body
- PokéAPI docs: https://pokeapi.co/docs/v2 — list endpoint, sprite URL pattern, caching guidance
- MDN Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay — autoplay policy, resume pattern
- npm registry: `npm view sharp version`, `npm view next@14 version` — verified 2026-03-20

### Secondary (MEDIUM confidence)
- GitHub issue vercel/vercel#14001 — Sharp + Vercel fix: disable turbopack, use `@img/sharp-linux-x64`
- Next.js create-next-app docs: https://nextjs.org/docs/app/api-reference/cli/create-next-app — scaffold flags
- Vercel Functions Limits: https://vercel.com/docs/functions/limitations — 4.5MB payload, 10s default timeout

### Tertiary (LOW confidence)
- WebSearch community findings on pnpm `approve-builds` workaround — reliability varies, prefer `@img/sharp-linux-x64` approach

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry 2026-03-20
- Architecture: HIGH — all APIs verified against official docs
- Pitfalls: MEDIUM-HIGH — Sharp/Vercel pitfalls from official issue tracker; audio from MDN
- Open questions: LOW confidence on font rendering — needs empirical test

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable libraries; ElevenLabs API changes occasionally — verify header name if 401s appear)
