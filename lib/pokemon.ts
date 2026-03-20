export interface Pokemon {
  id: number
  name: string
}

let pokemonCache: Pokemon[] | null = null

export async function fetchFirst250(): Promise<Pokemon[]> {
  if (pokemonCache) return pokemonCache

  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=250&offset=0')
  if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`)

  const data = await res.json()
  pokemonCache = data.results.map((p: { name: string; url: string }) => {
    // Extract ID from URL: https://pokeapi.co/api/v2/pokemon/25/ -> 25
    const segments = p.url.replace(/\/$/, '').split('/')
    const id = parseInt(segments[segments.length - 1], 10)
    return { id, name: p.name }
  })

  return pokemonCache!
}

export function getOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}
