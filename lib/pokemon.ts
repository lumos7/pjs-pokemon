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
    const segments = p.url.replace(/\/$/, '').split('/')
    const id = parseInt(segments[segments.length - 1], 10)
    return { id, name: p.name }
  })

  return pokemonCache!
}

export function getOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

export function getSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function getCryUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
}

// Official Pokémon type hex colours
export const TYPE_HEX: Record<string, string> = {
  normal:   '#A8A878',
  fire:     '#F08030',
  water:    '#6890F0',
  electric: '#F8D030',
  grass:    '#78C850',
  ice:      '#98D8D8',
  fighting: '#C03028',
  poison:   '#A040A0',
  ground:   '#E0C068',
  flying:   '#A890F0',
  psychic:  '#F85888',
  bug:      '#A8B820',
  rock:     '#B8A038',
  ghost:    '#705898',
  dragon:   '#7038F8',
  dark:     '#705848',
  steel:    '#B8B8D0',
  fairy:    '#EE99AC',
}
