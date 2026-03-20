'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon, getCryUrl } from '@/lib/pokemon'
import { PokemonCard } from '@/components/PokemonCard'

type Region = 'kanto' | 'johto' | 'both'
const REGIONS: { value: Region; label: string }[] = [
  { value: 'both',  label: 'Both'  },
  { value: 'kanto', label: 'Kanto' },
  { value: 'johto', label: 'Johto' },
]

async function speakName(pokemon: Pokemon) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemonName: pokemon.name, nameOnly: true }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const audio = new Audio(URL.createObjectURL(blob))
      audio.addEventListener('ended', () => {
        new Audio(getCryUrl(pokemon.id)).play().catch(() => {})
      }, { once: true })
      audio.play().catch(() => {})
    }
  } catch { /* ignore */ }
}

export default function PokemonListPage() {
  const router = useRouter()
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [region, setRegion] = useState<Region>('both')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=251&offset=0')
      .then(r => r.json())
      .then((data: { results: { name: string; url: string }[] }) => {
        const list: Pokemon[] = data.results.map((p) => {
          const segments = p.url.replace(/\/$/, '').split('/')
          const id = parseInt(segments[segments.length - 1], 10)
          return { id, name: p.name }
        })
        setPokemonList(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = pokemonList.filter((p) => {
    const inRegion =
      region === 'kanto' ? p.id <= 151 :
      region === 'johto' ? p.id >= 152 && p.id <= 251 :
      true
    const inSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return inRegion && inSearch
  })

  const handleCardClick = (p: Pokemon) => {
    router.push(`/encounter?pokemonId=${p.id}&pokemonName=${encodeURIComponent(p.name)}`)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 pt-6 pb-24 space-y-4">
      <h1
        className="text-3xl sm:text-4xl font-extrabold text-center text-[#CC0000]"
        style={{ textShadow: '2px 2px 0 #FFCB05' }}
      >
        Pokédex
      </h1>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] rounded-full px-4 py-2 border-2 border-amber-300 focus:border-[#FFCB05] focus:outline-none text-sm"
        />
        <div className="flex gap-1 bg-amber-50 border border-amber-200 rounded-full p-1">
          {REGIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRegion(value)}
              className={`px-3 py-1 rounded-full text-sm font-bold transition-colors min-h-[36px] ${
                region === value ? 'bg-[#CC0000] text-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading Pokémon…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              onClick={handleCardClick}
              onSpeakName={speakName}
            />
          ))}
        </div>
      )}
    </main>
  )
}
