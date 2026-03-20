# PJ's Pokemon — Roadmap

## Milestone 1: Full Build

Build the complete "PJ's Pokemon" interactive kids book web app from scratch.

---

## Phase 1: Full App Build

**Goal:** Deliver a fully functional, Vercel-deployable interactive kids book web app where a child picks a scene and Pokemon, gets a composited image with PJ's character, hears TTS narration, and can download the result — with background Pokemon music throughout.

**Requirements:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013

**Plans:** 3/4 plans executed

Plans:
- [ ] 01-PLAN-01.md — Project scaffold, assets, config, memory files
- [ ] 01-PLAN-02.md — Lib layer: scenes, voices, pokemon helpers
- [ ] 01-PLAN-03.md — API routes: pokemon list, composite image, TTS proxy
- [ ] 01-PLAN-04.md — Components + pages: landing, encounter builder, full UI

**Deliverables:**
- Working Next.js app at localhost:3000
- Landing page with music + Let's Play CTA
- Encounter page: scene selector, Pokemon selector, surprise button
- Composite image generation (Sharp)
- ElevenLabs TTS auto-fire on image ready
- Download button
- Mobile responsive
- Vercel-ready with .env.local.example

**Status:** ○ Pending
