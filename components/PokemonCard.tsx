'use client'

import { useEffect, useRef, useState } from 'react'
import { Pokemon, getOfficialArtworkUrl, getSpriteUrl, getCryUrl, TYPE_COLOURS, TYPE_EMOJI } from '@/lib/pokemon'

interface EvolutionStage {
  id: number
  name: string
}

interface CardData {
  types: string[]
  flavourText: string
  evolutions: EvolutionStage[]
}

interface PokemonCardProps {
  pokemon: Pokemon
  onClick: (p: Pokemon) => void
  onSpeakName: (p: Pokemon) => void
}

function extractEvolutions(chain: { species: { name: string; url: string }; evolves_to: unknown[] }): EvolutionStage[] {
  const stages: EvolutionStage[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any) => {
    const segments = node.species.url.replace(/\/$/, '').split('/')
    const id = parseInt(segments[segments.length - 1], 10)
    stages.push({ id, name: node.species.name })
    for (const next of node.evolves_to) walk(next)
  }
  walk(chain)
  return stages
}

export function PokemonCard({ pokemon, onClick, onSpeakName }: PokemonCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<CardData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loaded) {
          setLoaded(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loaded])

  useEffect(() => {
    if (!loaded) return
    let cancelled = false
    async function fetchData() {
      try {
        const [pokeRes, speciesRes] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`),
        ])
        if (!pokeRes.ok || !speciesRes.ok) return
        const [pokeJson, speciesJson] = await Promise.all([pokeRes.json(), speciesRes.json()])
        if (cancelled) return

        const types: string[] = pokeJson.types.map((t: { type: { name: string } }) => t.type.name)

        const flavourEntry = speciesJson.flavor_text_entries?.find(
          (e: { language: { name: string } }) => e.language.name === 'en'
        )
        const flavourText = flavourEntry
          ? (flavourEntry.flavor_text as string).replace(/[\n\f]/g, ' ')
          : ''

        const evoRes = await fetch(speciesJson.evolution_chain.url)
        if (cancelled) return
        const evoJson = await evoRes.json()
        const evolutions = extractEvolutions(evoJson.chain)

        setData({ types, flavourText, evolutions })
      } catch {
        // silently skip on error
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [loaded, pokemon.id])

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  const playCry = (e: React.MouseEvent) => {
    e.stopPropagation()
    new Audio(getCryUrl(pokemon.id)).play().catch(() => {})
  }

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSpeakName(pokemon)
  }

  return (
    <div
      ref={ref}
      onClick={() => onClick(pokemon)}
      className="bg-white rounded-2xl shadow-md border border-amber-100 p-4 cursor-pointer hover:shadow-xl hover:border-amber-300 transition-all flex flex-col gap-2"
    >
      {/* Artwork */}
      <img
        src={getOfficialArtworkUrl(pokemon.id)}
        alt={pokemon.name}
        className="w-28 h-28 object-contain mx-auto"
        loading="lazy"
      />

      {/* Name + cry button */}
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={handleNameClick}
          className="text-base font-bold text-gray-900 hover:text-[#CC0000] transition-colors text-left"
        >
          {capitalize(pokemon.name)}
        </button>
        <button
          type="button"
          onClick={playCry}
          title="Play cry"
          className="text-lg leading-none hover:scale-110 transition-transform"
        >
          🔊
        </button>
      </div>

      {/* Type badges */}
      {data ? (
        <div className="flex flex-wrap gap-1">
          {data.types.map((t) => (
            <span
              key={t}
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOURS[t] ?? 'bg-gray-200 text-gray-700'}`}
            >
              {TYPE_EMOJI[t] ?? ''} {capitalize(t)}
            </span>
          ))}
        </div>
      ) : (
        <div className="h-5 bg-amber-100 rounded-full animate-pulse w-16" />
      )}

      {/* Flavour text */}
      {data ? (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{data.flavourText}</p>
      ) : (
        <div className="space-y-1">
          <div className="h-3 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
        </div>
      )}

      {/* Evolution chain */}
      {data && data.evolutions.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap mt-1">
          {data.evolutions.map((evo, i) => (
            <div key={evo.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-400 text-xs">→</span>}
              <div className="flex flex-col items-center">
                <img
                  src={getSpriteUrl(evo.id)}
                  alt={evo.name}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
                <span className="text-xs text-gray-500">{capitalize(evo.name)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
