export interface Pokemon {
  id: number
  name: string
}

export interface Generation {
  id: number
  name: string
  label: string
  start: number
  end: number
}

export const GENERATIONS: Generation[] = [
  { id: 1, name: 'generation-i',    label: 'Gen 1 — Kanto',  start: 1,   end: 151  },
  { id: 2, name: 'generation-ii',   label: 'Gen 2 — Johto',  start: 152, end: 251  },
  { id: 3, name: 'generation-iii',  label: 'Gen 3 — Hoenn',  start: 252, end: 386  },
  { id: 4, name: 'generation-iv',   label: 'Gen 4 — Sinnoh', start: 387, end: 493  },
  { id: 5, name: 'generation-v',    label: 'Gen 5 — Unova',  start: 494, end: 649  },
  { id: 6, name: 'generation-vi',   label: 'Gen 6 — Kalos',  start: 650, end: 721  },
  { id: 7, name: 'generation-vii',  label: 'Gen 7 — Alola',  start: 722, end: 809  },
  { id: 8, name: 'generation-viii', label: 'Gen 8 — Galar',  start: 810, end: 905  },
  { id: 9, name: 'generation-ix',   label: 'Gen 9 — Paldea', start: 906, end: 1025 },
]

export const GEN_STORAGE_KEY = 'pjs-selected-gens'

export function loadSelectedGens(): number[] {
  try {
    const raw = localStorage.getItem(GEN_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return GENERATIONS.map(g => g.id)
}

export function saveSelectedGens(ids: number[]) {
  try { localStorage.setItem(GEN_STORAGE_KEY, JSON.stringify(ids)) } catch {}
}

export function filterByGens(list: Pokemon[], genIds: number[]): Pokemon[] {
  const ranges = GENERATIONS.filter(g => genIds.includes(g.id))
  return list.filter(p => ranges.some(r => p.id >= r.start && p.id <= r.end))
}

let pokemonCache: Pokemon[] | null = null

export async function fetchAllPokemon(): Promise<Pokemon[]> {
  if (pokemonCache) return pokemonCache

  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0')
  if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`)

  const data = await res.json()
  pokemonCache = data.results.map((p: { name: string; url: string }) => {
    const segments = p.url.replace(/\/$/, '').split('/')
    const id = parseInt(segments[segments.length - 1], 10)
    return { id, name: p.name }
  })

  return pokemonCache!
}

/** @deprecated use fetchAllPokemon */
export const fetchFirst250 = fetchAllPokemon

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
