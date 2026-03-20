# PJ's Pokemon - Project Instructions

## Stack
- Next.js 14 App Router + TypeScript + Tailwind CSS
- Sharp for server-side image compositing
- ElevenLabs TTS via API route proxy
- PokéAPI for Pokemon data (first 250, cached)
- No database, no auth, no ORM

## Conventions
- Use App Router patterns (route.ts for API, page.tsx for pages)
- All Sharp/ElevenLabs calls in API routes (server-side only)
- Client components marked with 'use client'
- Tailwind for all styling, no CSS modules
- Raw fetch or axios for HTTP, no wrapper libraries
- In-memory caching (module-scope variables), no external cache

## File Structure
- app/ — pages and API routes
- components/ — React client components
- lib/ — shared utilities and config
- public/images/ — scene backgrounds + PJ character
- public/music/ — background music tracks (10 MP3s)

## Important
- Sharp on Vercel: @img/sharp-linux-x64 is a direct dependency (do not remove)
- Do NOT use --turbopack flag
- ElevenLabs header is 'xi-api-key' (NOT 'Authorization: Bearer')
- Music files are slug-safe lowercase names in public/music/
- All image compositing uses path.join(process.cwd(), 'public', ...) for file paths
- SVG text overlay for captions (paint-order: stroke fill for outline effect)

## Memory
Read memory/*.md files at session start for full project context.
