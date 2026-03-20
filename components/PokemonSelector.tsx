'use client'

import { useState } from 'react'
import { Pokemon, getOfficialArtworkUrl } from '@/lib/pokemon'

interface PokemonSelectorProps {
  pokemon: Pokemon[]
  selected: Pokemon | null
  onSelect: (p: Pokemon) => void
}

export function PokemonSelector({ pokemon, selected, onSelect }: PokemonSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = pokemon.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const capitalize = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1)

  return (
    <div>
      <input
        type="text"
        placeholder="Search Pokemon..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-lg p-3 text-lg border-2 border-amber-300 focus:border-[#FFCB05] focus:outline-none bg-white"
      />
      <div className="mt-2 max-h-[300px] overflow-y-auto rounded-lg border border-amber-200 bg-white divide-y divide-amber-100">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No Pokemon found</div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`w-full flex items-center gap-3 p-2 min-h-[48px] cursor-pointer hover:bg-amber-50 transition-colors text-left ${
                selected?.id === p.id ? 'bg-yellow-100' : ''
              }`}
            >
              <img
                src={getOfficialArtworkUrl(p.id)}
                alt={p.name}
                className="w-10 h-10 object-contain flex-shrink-0"
                loading="lazy"
              />
              <span className="font-medium text-gray-900">{capitalize(p.name)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
