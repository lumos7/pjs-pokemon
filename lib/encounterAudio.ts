'use client'

import { getCryUrl } from '@/lib/pokemon'
import { playExclusive, stopAll, type BusClip } from '@/lib/audioBus'

export type Clip = BusClip

/** Play any clip through the exclusive audio bus (stops whatever is playing). */
export function playClip(src: string, volume: number, opts?: { revokeUrl?: boolean }): Clip {
  return playExclusive(src, volume, opts)
}

export function playCryClip(pokemonId: number, volume = 0.33, pokemonName?: string): Clip {
  return playExclusive(getCryUrl(pokemonId, pokemonName), volume)
}

export function stopClip() {
  stopAll()
}

async function requestTts(body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/**
 * Prefetched "PJ meets X" phrase clips, keyed by Pokémon name. Consumed once
 * per fetch so replays get a fresh random phrase. Play consumed URLs with
 * `revokeUrl: true` so the blob is released after playback.
 */
const phrasePrefetch = new Map<string, Promise<string | null>>()

export function prefetchTtsClip(pokemonName: string): void {
  if (!phrasePrefetch.has(pokemonName)) {
    phrasePrefetch.set(pokemonName, requestTts({ pokemonName }))
  }
}

/** Fetch a TTS "PJ meets X" line and return a playable object URL (or null). */
export async function fetchTtsClipUrl(pokemonName: string): Promise<string | null> {
  const pending = phrasePrefetch.get(pokemonName)
  if (pending) {
    phrasePrefetch.delete(pokemonName)
    return pending
  }
  return requestTts({ pokemonName })
}

/**
 * Name-only clips are deterministic ("Pikachu") so the object URL is cached
 * for the session — repeat taps replay instantly with zero network. Cached
 * URLs must NOT be revoked after playback.
 */
const nameClipCache = new Map<string, string>()

export async function fetchNameClipUrl(pokemonName: string): Promise<string | null> {
  const cached = nameClipCache.get(pokemonName)
  if (cached) return cached
  const url = await requestTts({ pokemonName, nameOnly: true })
  if (url) nameClipCache.set(pokemonName, url)
  return url
}

/** Speak the Pokémon's name; if a Pokémon id is given, chain its cry after. */
export async function speakName(pokemonName: string, pokemonId?: number): Promise<void> {
  const url = await fetchNameClipUrl(pokemonName)
  if (!url) {
    // TTS unavailable (bad/missing key, quota, offline). Never leave a tap
    // silent — the cry stands in so the button always does something.
    if (pokemonId) playCryClip(pokemonId, 0.33, pokemonName)
    return
  }
  const clip = playClip(url, 1)
  if (pokemonId) {
    const completed = await clip.done
    if (completed) playCryClip(pokemonId, 0.33, pokemonName)
  }
}
