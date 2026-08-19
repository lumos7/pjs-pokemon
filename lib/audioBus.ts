'use client'

/**
 * Central arbiter for one-shot audio (TTS lines, Pokémon cries, jingles).
 *
 * A SINGLE shared HTMLAudioElement plays everything, so overlapping clips are
 * physically impossible — starting a new clip replaces whatever is playing.
 * The element is "unlocked" on the first user gesture (played once inside the
 * gesture), which lets iOS Safari accept later programmatic `play()` calls
 * that happen after fetch awaits — the main cause of silent TTS on iPads.
 *
 * Dispatches `pj-audio-active` / `pj-audio-idle` on document so the
 * background MusicPlayer can duck under voice clips.
 *
 * `done` resolves `true` when the clip finished naturally, `false` when it
 * errored, was blocked, or was preempted by another clip — callers chaining
 * audio (TTS → cry) should only chain on `true`.
 */

export interface BusClip {
  audio: HTMLAudioElement
  done: Promise<boolean>
}

interface ActiveClip {
  finish: (completed: boolean) => void
}

// ~50ms of silence — played inside the first gesture to bless the element.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='

let el: HTMLAudioElement | null = null
let active: ActiveClip | null = null
let busMuted = false

function getEl(): HTMLAudioElement {
  if (!el) el = new Audio()
  return el
}

// Unlock on first gesture (module side-effect, client bundle only).
if (typeof document !== 'undefined') {
  const unlock = () => {
    document.removeEventListener('pointerdown', unlock)
    document.removeEventListener('keydown', unlock)
    if (active) return // a real clip already started inside this gesture
    const a = getEl()
    a.muted = busMuted
    a.src = SILENT_WAV
    a.play().catch(() => { /* blocked — a later gesture will retry via playExclusive */ })
  }
  document.addEventListener('pointerdown', unlock)
  document.addEventListener('keydown', unlock)
}

/** Global mute for one-shot audio — MusicPlayer's mute button drives this so
 * cries/TTS/jingles go quiet along with the background music. */
export function setBusMuted(muted: boolean) {
  busMuted = muted
  if (el) el.muted = muted
}

function dispatch(name: 'pj-audio-active' | 'pj-audio-idle') {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(name))
  }
}

export function stopAll() {
  if (!active) return
  const { finish } = active
  active = null
  const a = getEl()
  try {
    a.pause()
  } catch {
    /* already detached */
  }
  finish(false)
  dispatch('pj-audio-idle')
}

export function playExclusive(
  src: string,
  volume: number,
  opts?: { revokeUrl?: boolean },
): BusClip {
  stopAll()

  const audio = getEl()

  let resolveDone!: (completed: boolean) => void
  const done = new Promise<boolean>((resolve) => {
    resolveDone = resolve
  })

  let finished = false
  const onEnded = () => finish(true)
  const onError = () => finish(false)
  const finish = (completed: boolean) => {
    if (finished) return
    finished = true
    audio.removeEventListener('ended', onEnded)
    audio.removeEventListener('error', onError)
    if (opts?.revokeUrl) {
      try { URL.revokeObjectURL(src) } catch { /* not an object URL */ }
    }
    if (active?.finish === finish) {
      active = null
      dispatch('pj-audio-idle')
    }
    resolveDone(completed)
  }

  audio.addEventListener('ended', onEnded)
  audio.addEventListener('error', onError)
  audio.src = src
  audio.volume = Math.max(0, Math.min(1, volume))
  audio.muted = busMuted

  active = { finish }
  dispatch('pj-audio-active')
  audio.play().catch(() => finish(false))

  return { audio, done }
}
