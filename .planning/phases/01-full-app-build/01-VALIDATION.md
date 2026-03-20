---
phase: 1
slug: full-app-build
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual testing (no unit tests — user preference) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` to verify no TypeScript errors
- **After every plan wave:** `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full build must pass, manual browser test of core flow

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| scaffold | 01 | 1 | REQ-001 | build | `npm run build` | ❌ W0 | ⬜ pending |
| lib layer | 02 | 1 | REQ-003 | build | `npm run build` | ❌ W0 | ⬜ pending |
| api routes | 03 | 2 | REQ-004 | build | `npm run build` | ❌ W0 | ⬜ pending |
| components | 04 | 2 | REQ-005 | build | `npm run build` | ❌ W0 | ⬜ pending |
| pages | 05 | 3 | REQ-006 | build | `npm run build` | ❌ W0 | ⬜ pending |

---

## Wave 0 Requirements

- None — Wave 1 creates the project from scratch

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Music starts on first tap | REQ-009 | Browser audio policy | Open app, tap anywhere, confirm music plays |
| TTS fires after composite | REQ-008 | Audio + network | Generate encounter, confirm voice reads "Aziah meets [name]!" |
| Composite image correct | REQ-007 | Visual | Check PJ + Pokémon + scene composited, text visible |
| Download saves correct file | REQ-010 | Browser download | Click download, confirm filename aziah-meets-[name].png |
| Mobile tap targets | REQ-011 | Device testing | Open on phone/tablet, confirm large tappable buttons |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: build check after each wave
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
