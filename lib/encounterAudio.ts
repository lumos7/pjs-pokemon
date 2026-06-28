'use client'

import { getCryUrl } from '@/lib/pokemon'

/** A playing clip plus a promise that resolves when it ends (or fails). */
export interface Clip {
  audio: HTMLAudioElement
  done: Promise<void>
}

export function playClip(src: string, volume: number): Clip {
  const audio = new Audio(src)
  audio.volume = volume
  const done = new Promise<void>((resolve) => {
    audio.addEventListener('ended', () => resolve(), { once: true })
    audio.addEventListener('error', () => resolve(), { once: true })
  })
  audio.play().catch(() => {}) // resolves via 'error'/'ended' if blocked
  return { audio, done }
}

export function playCryClip(pokemonId: number, volume = 0.4): Clip {
  return playClip(getCryUrl(pokemonId), volume)
}

/** Fetch a TTS "PJ meets X" line and return a playable object URL (or null). */
export async function fetchTtsClipUrl(pokemonName: string): Promise<string | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemonName }),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

export function stopClip(audio: HTMLAudioElement | null | undefined) {
  if (!audio) return
  try {
    audio.pause()
    audio.currentTime = 0
  } catch {
    /* already detached */
  }
}
