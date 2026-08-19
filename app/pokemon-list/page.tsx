'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pokemon, fetchAllPokemon, loadSelectedGens, saveSelectedGens, filterByGens } from '@/lib/pokemon'
import { PokemonCard } from '@/components/PokemonCard'
import { GenFilter } from '@/components/GenFilter'
import { speakName as speakPokemonName } from '@/lib/encounterAudio'

function speakName(pokemon: Pokemon) {
  void speakPokemonName(pokemon.name)
}

export default function PokemonListPage() {
  const router = useRouter()
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [selectedGens, setSelectedGens] = useState<number[]>(() => loadSelectedGens())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const loadList = () => {
    setLoading(true)
    setLoadError(false)
    fetchAllPokemon()
      .then((list) => {
        setPokemonList(list)
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }
  useEffect(() => { loadList() }, [])

  const handleGensChange = (ids: number[]) => {
    setSelectedGens(ids)
    saveSelectedGens(ids)
  }

  const searchLower = search.toLowerCase()
  const inGens = filterByGens(pokemonList, selectedGens)
  const filtered = searchLower
    ? inGens.filter((p) => p.name.toLowerCase().includes(searchLower))
    : inGens

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
          className="flex-1 min-w-[140px] rounded-full px-4 py-2 border-2 border-amber-300 focus:border-[#FFCB05] focus:outline-none text-base"
        />
        <GenFilter selectedGens={selectedGens} onChange={handleGensChange} />
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading Pokémon…</p>
      ) : loadError ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📡</div>
          <p className="text-gray-700 font-bold mb-4">Couldn&apos;t load the Pokédex!</p>
          <button
            type="button"
            onClick={loadList}
            className="bg-[#FFCB05] text-gray-900 font-bold rounded-full px-8 py-4 min-h-[52px] shadow-lg hover:bg-yellow-400 active:scale-95 transition-all"
          >
            🔄 Try Again!
          </button>
        </div>
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
