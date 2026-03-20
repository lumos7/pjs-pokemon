# Rules

- No database, no auth, no ORM
- Sharp calls only in API routes (server-side)
- ElevenLabs calls only through /api/tts/ proxy
- @img/sharp-linux-x64 must stay in package.json for Vercel
- No --turbopack flag in build scripts
- Music filenames must be slug-safe (no spaces, unicode, special chars)
- Canvas dimensions: 1200x900
- Minimum touch target: 48px
- Font stack for SVG: Arial, Liberation Sans, sans-serif
