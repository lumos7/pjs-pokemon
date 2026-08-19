'use client'

import { scenes } from '@/lib/scenes'

/**
 * Generates and caches composited encounter images for the session.
 *
 * Cache key is `${pokemonId}:${sceneId}` so re-queuing the same Pokémon in the
 * same scene reuses the blob instead of re-compositing. `inflight` de-dupes
 * concurrent requests (e.g. prefetch racing the actual play) for the same key.
 */

const cache = new Map<string, string>() // key -> object URL (insertion-ordered)
const inflight = new Map<string, Promise<string>>()
const CACHE_MAX = 16 // ~1-2MB per composite — cap so long queue sessions don't eat RAM

function keyFor(pokemonId: number, sceneId: string): string {
  return `${pokemonId}:${sceneId}`
}

function cachePut(key: string, url: string) {
  while (cache.size >= CACHE_MAX) {
    const oldest = cache.entries().next().value
    if (!oldest) break
    cache.delete(oldest[0])
    URL.revokeObjectURL(oldest[1])
  }
  cache.set(key, url)
}

export function randomSceneId(): string {
  return scenes[Math.floor(Math.random() * scenes.length)].id
}

export function getCachedEncounter(pokemonId: number, sceneId: string): string | undefined {
  return cache.get(keyFor(pokemonId, sceneId))
}

export async function getEncounterImage(
  pokemonId: number,
  pokemonName: string,
  sceneId: string,
): Promise<string> {
  const key = keyFor(pokemonId, sceneId)

  const cached = cache.get(key)
  if (cached) return cached

  const existing = inflight.get(key)
  if (existing) return existing

  const request = (async () => {
    const res = await fetch('/api/composite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneId, pokemonId, pokemonName }),
    })
    if (!res.ok) throw new Error(`Composite failed: ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    cachePut(key, url)
    inflight.delete(key)
    return url
  })()

  inflight.set(key, request)
  request.catch(() => inflight.delete(key))
  return request
}

/** Fire-and-forget warm of the cache for an upcoming item. */
export function prefetchEncounter(pokemonId: number, pokemonName: string, sceneId: string): void {
  void getEncounterImage(pokemonId, pokemonName, sceneId).catch(() => {})
}
