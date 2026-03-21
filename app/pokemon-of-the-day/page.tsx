'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOfficialArtworkUrl, getSpriteUrl, getCryUrl, TYPE_HEX } from '@/lib/pokemon'

interface EvolutionStage { id: number; name: string }

interface DailyData {
  id: number
  name: string
  types: string[]
  flavourText: string
  evolutions: EvolutionStage[]
  stats: { name: string; value: number }[]
}

function getDailyPokemonId(total: number): number {
  const dateStr = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  let seed = 0
  for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i)
  return (seed % total) + 1
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEvolutions(chain: any): EvolutionStage[] {
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

const STAT_LABELS: Record<string, string> = {
  'hp': 'HP',
  'attack': 'Attack',
  'defense': 'Defence',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  'speed': 'Speed',
}

export default function PokemonOfTheDayPage() {
  const router = useRouter()
  const [data, setData] = useState<DailyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pokemonId = getDailyPokemonId(1025)
    let cancelled = false

    async function load() {
      try {
        const [pokeRes, speciesRes] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`),
        ])
        if (!pokeRes.ok || !speciesRes.ok) return
        const [pokeJson, speciesJson] = await Promise.all([pokeRes.json(), speciesRes.json()])
        if (cancelled) return

        const types: string[] = pokeJson.types.map((t: { type: { name: string } }) => t.type.name)
        const stats = pokeJson.stats.map((s: { stat: { name: string }; base_stat: number }) => ({
          name: s.stat.name,
          value: s.base_stat,
        }))

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

        setData({
          id: pokemonId,
          name: pokeJson.name,
          types,
          flavourText,
          evolutions,
          stats,
        })
      } catch (e) {
        console.error('Failed to load daily pokemon:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const playCry = () => {
    if (!data) return
    const cry = new Audio(getCryUrl(data.id))
    cry.volume = 0.33
    cry.play().catch(() => {})
  }

  const speakName = async () => {
    if (!data) return
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokemonName: data.name, nameOnly: true }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const audio = new Audio(URL.createObjectURL(blob))
        audio.addEventListener('ended', playCry, { once: true })
        audio.play().catch(() => {})
      }
    } catch { /* ignore */ }
  }

  const handleGenerateEncounter = () => {
    if (!data) return
    router.push(`/encounter?pokemonId=${data.id}&pokemonName=${encodeURIComponent(data.name)}`)
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 pt-12 pb-24 text-center">
        <div className="text-4xl mb-3 animate-bounce">🌟</div>
        <p className="text-xl font-bold text-gray-700">Loading today&apos;s Pokémon...</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="max-w-2xl mx-auto px-4 pt-12 pb-24 text-center">
        <p className="text-xl text-gray-500">Failed to load. Try refreshing!</p>
      </main>
    )
  }

  const primaryType = data.types[0]
  const barColour = TYPE_HEX[primaryType] ?? '#A8A878'

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-32 space-y-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-[#CC0000]"
          style={{ textShadow: '2px 2px 0 #FFCB05' }}>
        Today&apos;s Pokémon
      </h1>

      {/* Artwork */}
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getOfficialArtworkUrl(data.id)}
          alt={capitalize(data.name)}
          className="w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-xl"
        />
      </div>

      {/* Name — clickable for TTS + cry */}
      <div className="text-center">
        <button onClick={speakName}
          className="text-4xl sm:text-5xl font-extrabold text-[#CC0000] hover:text-[#ff1a1a] transition-colors"
          style={{ fontFamily: "'Bangers', 'Impact', cursive", letterSpacing: '0.04em', WebkitTextStroke: '1px #2A75BB' }}>
          {capitalize(data.name)}
        </button>
        <span className="text-gray-400 text-sm ml-2">#{data.id}</span>
      </div>

      {/* Type badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        {data.types.map(t => (
          <span key={t}
            className="text-sm font-bold uppercase px-3 py-1 rounded-full text-white tracking-wide"
            style={{ backgroundColor: TYPE_HEX[t] ?? '#A8A878' }}>
            {t}
          </span>
        ))}
      </div>

      {/* Flavour text */}
      {data.flavourText && (
        <p className="text-center text-gray-600 italic text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          &ldquo;{data.flavourText}&rdquo;
        </p>
      )}

      {/* Base stats */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-bold text-gray-800 mb-2">Base Stats</h2>
        {data.stats.map(s => (
          <div key={s.name} className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 w-16 text-right">{STAT_LABELS[s.name] ?? s.name}</span>
            <span className="text-xs font-bold text-gray-800 w-8">{s.value}</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min((s.value / 255) * 100, 100)}%`, backgroundColor: barColour }} />
            </div>
          </div>
        ))}
      </div>

      {/* Evolution chain */}
      {data.evolutions.length > 1 && (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Evolution Chain</h2>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {data.evolutions.map((evo, i) => (
              <div key={evo.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-gray-400 text-lg">→</span>}
                <div className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getSpriteUrl(evo.id)} alt={evo.name}
                    className="w-12 h-12 object-contain" loading="lazy" />
                  <span className={`text-xs font-medium ${evo.id === data.id ? 'text-[#CC0000] font-bold' : 'text-gray-500'}`}>
                    {capitalize(evo.name)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Encounter button */}
      <div className="text-center">
        <button onClick={handleGenerateEncounter}
          className="bg-[#FFCB05] text-gray-900 font-bold text-lg rounded-full px-8 py-4 min-h-[56px] hover:scale-105 transition-transform shadow-lg">
          🗺️ Generate Encounter!
        </button>
      </div>

      <p className="text-center text-white/60 text-sm bg-[#CC0000] rounded-full py-2 px-4 max-w-xs mx-auto">
        Come back tomorrow for a new Pokémon!
      </p>
    </main>
  )
}
