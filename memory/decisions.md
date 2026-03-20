# Decisions

- Stack: Next.js 14 + TypeScript + Tailwind + Sharp + axios
- TTS: ElevenLabs with xi-api-key header, voice ID: EXAVITQu4vr4xnSDxMaL (Bella, free tier only)
- TTS pronunciation: "Aziah" spelled "Eye-Zy-Ah" in spoken text so ElevenLabs pronounces it correctly
- TTS modes: full sentence (auto-fires on generation) + name-only (repeat button in EncounterCanvas)
- Pokemon: PokeAPI first 251 (Kanto #1–151 + Johto #152–251), artwork from GitHub sprites CDN
- Region filter: Kanto / Johto / Both — filters PokemonSelector and Surprise Me, default Both
- Compositing: scene bg (1200x900) + Pokemon (right 60%) + PJ character + SVG caption with drop shadow
- Caption text drop shadow: feDropShadow dx=2 dy=2 stdDeviation=4 black 80% opacity
- Download filename: aziah-meets-[pokemon-name].png
- Music: random track per session, loops, starts on first user interaction, default volume 0.15
- Music controls: volume slider (hidden when muted) + Next Track button + mute toggle, fixed bottom-right
- Landing page: PJ centred with Bulbasaur/Charmander left, Squirtle/Pikachu/Eevee right, bottom-aligned
- Deploy: Vercel
