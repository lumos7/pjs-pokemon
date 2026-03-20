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

export const TYPE_COLOURS: Record<string, string> = {
  normal:   'bg-gray-300 text-gray-800',
  fire:     'bg-orange-400 text-white',
  water:    'bg-blue-400 text-white',
  electric: 'bg-yellow-300 text-gray-800',
  grass:    'bg-green-500 text-white',
  ice:      'bg-cyan-300 text-gray-800',
  fighting: 'bg-red-600 text-white',
  poison:   'bg-purple-400 text-white',
  ground:   'bg-yellow-600 text-white',
  flying:   'bg-indigo-300 text-gray-800',
  psychic:  'bg-pink-400 text-white',
  bug:      'bg-lime-500 text-white',
  rock:     'bg-yellow-700 text-white',
  ghost:    'bg-purple-700 text-white',
  dragon:   'bg-purple-600 text-white',
  dark:     'bg-gray-700 text-white',
  steel:    'bg-gray-400 text-white',
  fairy:    'bg-pink-300 text-gray-800',
}

export const TYPE_EMOJI: Record<string, string> = {
  normal: '⬜', fire: '🔥', water: '💧', electric: '⚡', grass: '🌿',
  ice: '❄️', fighting: '🥊', poison: '☠️', ground: '🌍', flying: '🌬️',
  psychic: '🔮', bug: '🐛', rock: '🪨', ghost: '👻', dragon: '🐉',
  dark: '🌑', steel: '⚙️', fairy: '✨',
}
