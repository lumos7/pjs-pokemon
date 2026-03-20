# PJ's Pokemon — Requirements

## Phase 1 Requirements

### REQ-001: Project Scaffold
Next.js 14 App Router + TypeScript + Tailwind CSS project with Sharp, axios installed. Assets moved to public/images/ and public/music/.

### REQ-002: Memory & CLAUDE.md
memory/ directory with project.md, rules.md, decisions.md, plan.md, architecture.md. CLAUDE.md in project root.

### REQ-003: Lib Layer
- lib/scenes.ts — scene config (canyon, coast, forest, glacier)
- lib/voices.ts — ElevenLabs voice ID array + random picker
- lib/pokemon.ts — PokéAPI helper

### REQ-004: API Routes
- app/api/pokemon/route.ts — fetch first 250 Pokémon from PokéAPI, cache
- app/api/composite/route.ts — Sharp compositor (scene + Pokémon + PJ character)
- app/api/tts/route.ts — ElevenLabs TTS proxy, random voice

### REQ-005: Components
- MusicPlayer.tsx — hidden player, mute toggle, random track per session
- SceneSelector.tsx — 4 background thumbnails
- PokemonSelector.tsx — searchable dropdown, 250 Pokémon
- SurpriseButton.tsx — randomises scene + Pokémon
- EncounterCanvas.tsx — composited result + download button

### REQ-006: Pages
- app/page.tsx — landing page, music starts, "Let's Play" button
- app/encounter/page.tsx — main encounter builder UI

### REQ-007: Compositing Behaviour
- Pokémon placed randomly in right 60% of canvas, vertically centred ± random offset
- "Aziah meets [Pokémon name]!" bottom-centre, white text with dark outline, 48px minimum
- PokeMaster PJ.png composited into scene

### REQ-008: TTS Behaviour
- TTS fires automatically when composite image is ready
- Random voice from: Gsndh0O5AnuI2Hj3YUlA, O4fnkotIypvedJqBp4yb, iukn3a1vSSNFmdi5NZS4

### REQ-009: Music Behaviour
- Music starts on first user interaction
- Loops throughout session
- Random track picked per session from public/music/

### REQ-010: Download
- Download button saves composite as "aziah-meets-[pokemon-name].png"

### REQ-011: Mobile Responsive
- Primary user: child on tablet or phone
- Large tap targets, kids book feel

### REQ-012: Config Files
- .env.local.example with ELEVENLABS_API_KEY placeholder
- Vercel config for Sharp if needed

### REQ-013: Vercel Deploy
- App deploys successfully to Vercel
- Sharp configured for serverless (platform: linux/x64)
