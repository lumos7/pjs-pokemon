# Architecture

## Pages
- / — Landing page with music + "Let's Play" CTA
- /encounter — Scene selector, Pokemon selector, surprise button, composite result, download

## API Routes
- POST /api/pokemon — Returns first 250 Pokemon (cached in memory)
- POST /api/composite — Sharp: scene + Pokemon + PJ + SVG caption -> PNG buffer
- POST /api/tts — ElevenLabs proxy: Pokemon name -> audio/mpeg

## Lib
- lib/scenes.ts — Scene config (4 scenes: canyon, coast, forest, glacier)
- lib/voices.ts — ElevenLabs voice IDs + random picker
- lib/pokemon.ts — PokéAPI fetch helper + artwork URL builder

## Components
- MusicPlayer.tsx — Hidden audio, random track, loop, mute toggle
- SceneSelector.tsx — 4 scene thumbnail buttons
- PokemonSelector.tsx — Searchable dropdown, 250 Pokemon
- SurpriseButton.tsx — Random scene + Pokemon
- EncounterCanvas.tsx — Composite result display + download button

## Data Flow
Landing -> click "Let's Play" (unlocks audio) -> /encounter
Select scene + Pokemon (or Surprise) -> POST /api/composite -> display image
Image ready -> auto POST /api/tts -> play audio
Download button -> anchor download with filename
