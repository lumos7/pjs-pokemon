'use client'

import { useEffect, useRef, useState } from 'react'
import { Pokemon, getOfficialArtworkUrl, getSpriteUrl, TYPE_HEX } from '@/lib/pokemon'
import { AddToQueueButton } from '@/components/AddToQueueButton'
import { playCryClip } from '@/lib/encounterAudio'
import { getPokemonDetail, getSpeciesDetail, getEvolutionChain } from '@/lib/pokeapiCache'

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
        const [pokeJson, speciesJson] = await Promise.all([
          getPokemonDetail(pokemon.id),
          getSpeciesDetail(pokemon.id),
        ])
        if (cancelled) return

        const types: string[] = pokeJson.types.map((t: { type: { name: string } }) => t.type.name)

        const flavourEntry = speciesJson.flavor_text_entries?.find(
          (e: { language: { name: string } }) => e.language.name === 'en'
        )
        const flavourText = flavourEntry
          ? (flavourEntry.flavor_text as string).replace(/[\n\f]/g, ' ')
          : ''

        const evoJson = await getEvolutionChain(speciesJson.evolution_chain.url)
        if (cancelled) return
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

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSpeakName(pokemon)
  }

  const handleCry = (e: React.MouseEvent) => {
    e.stopPropagation()
    playCryClip(pokemon.id, 0.33, pokemon.name)
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
        crossOrigin="anonymous"
        className="w-28 h-28 object-contain mx-auto"
        loading="lazy"
      />

      {/* Name (TTS only) + cry button (cry only) — independent */}
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={handleNameClick}
          title="Say the name"
          className="text-base font-bold text-gray-900 hover:text-[#CC0000] active:scale-95 transition-all text-left min-h-[44px] flex items-center gap-1"
        >
          <span className="text-sm" aria-hidden>🗣️</span>
          {capitalize(pokemon.name)}
        </button>
        <button
          type="button"
          onClick={handleCry}
          title="Play cry"
          aria-label={`Play ${pokemon.name} cry`}
          className="text-lg leading-none hover:scale-110 active:scale-95 transition-transform flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full hover:bg-amber-50"
        >
          🔊
        </button>
      </div>

      {/* Add to Next Up queue — does not navigate */}
      <AddToQueueButton
        id={pokemon.id}
        name={pokemon.name}
        className="w-full rounded-full px-3 py-2.5 min-h-[44px] text-sm font-bold bg-amber-100 text-gray-800 hover:bg-amber-200 active:scale-95 transition-all"
      />

      {/* Type badges */}
      {data ? (
        <div className="flex flex-wrap gap-1">
          {data.types.map((t) => (
            <span
              key={t}
              className="text-xs font-bold uppercase px-2 py-0.5 rounded-full text-white tracking-wide"
              style={{ backgroundColor: TYPE_HEX[t] ?? '#A8A878' }}
            >
              {t}
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
                  crossOrigin="anonymous"
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
