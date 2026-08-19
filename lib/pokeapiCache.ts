'use client'

/**
 * Promise-cached PokeAPI detail fetches, shared by every component.
 *
 * Without this, scrolling the full Pokédex fires ~3 requests per card × 1025
 * cards, evolution chains are re-fetched for every family member, and cards
 * re-fetch everything on every remount (search keystrokes, filter changes).
 * Failed requests are evicted so a retry is possible.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const pokemonCache = new Map<number, Promise<any>>()
const speciesCache = new Map<number, Promise<any>>()
const evoCache = new Map<string, Promise<any>>()

function cachedFetch(cache: Map<any, Promise<any>>, key: any, url: string): Promise<any> {
  let p = cache.get(key)
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`PokeAPI ${r.status}`)
      return r.json()
    })
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return p
}

export function getPokemonDetail(id: number): Promise<any> {
  return cachedFetch(pokemonCache, id, `https://pokeapi.co/api/v2/pokemon/${id}`)
}

export function getSpeciesDetail(id: number): Promise<any> {
  return cachedFetch(speciesCache, id, `https://pokeapi.co/api/v2/pokemon-species/${id}`)
}

export function getEvolutionChain(url: string): Promise<any> {
  return cachedFetch(evoCache, url, url)
}
