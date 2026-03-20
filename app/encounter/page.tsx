'use client'

import { useEffect, useState } from 'react'
import { scenes } from '@/lib/scenes'
import { Pokemon } from '@/lib/pokemon'
import { SceneSelector } from '@/components/SceneSelector'
import { PokemonSelector } from '@/components/PokemonSelector'
import { SurpriseButton } from '@/components/SurpriseButton'
import { EncounterCanvas } from '@/components/EncounterCanvas'

type Region = 'kanto' | 'johto' | 'both'

const REGIONS: { value: Region; label: string }[] = [
  { value: 'both',  label: 'Both'  },
  { value: 'kanto', label: 'Kanto' },
  { value: 'johto', label: 'Johto' },
]

async function playTTS(pokemonName: string, nameOnly = false) {
  try {
    console.log('[tts-client] firing for:', pokemonName, '| nameOnly:', nameOnly)
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemonName, nameOnly }),
    })
    console.log('[tts-client] response status:', res.status)
    if (res.ok) {
      const blob = await res.blob()
      console.log('[tts-client] blob size:', blob.size)
      const audio = new Audio(URL.createObjectURL(blob))
      audio.play().catch((e) => console.error('[tts-client] play error:', e))
    } else {
      const err = await res.text()
      console.error('[tts-client] API error:', res.status, err)
    }
  } catch (e) {
    console.error('[tts-client] fetch error:', e)
  }
}

export default function EncounterPage() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [region, setRegion] = useState<Region>('both')
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingPokemon, setLoadingPokemon] = useState(true)

  // Fetch all 251 Kanto + Johto Pokemon on mount
  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=251&offset=0')
      .then((r) => {
        if (!r.ok) throw new Error(`PokeAPI error: ${r.status}`)
        return r.json()
      })
      .then((data: { results: { name: string; url: string }[] }) => {
        const list: Pokemon[] = data.results.map((p) => {
          const segments = p.url.replace(/\/$/, '').split('/')
          const id = parseInt(segments[segments.length - 1], 10)
          return { id, name: p.name }
        })
        setPokemonList(list)
        setLoadingPokemon(false)
      })
      .catch((e) => {
        console.error('Failed to load pokemon:', e)
        setLoadingPokemon(false)
      })
  }, [])

  // Auto-fire TTS when composite image is ready
  useEffect(() => {
    if (!compositeImageUrl || !selectedPokemon) return
    playTTS(selectedPokemon.name)
  }, [compositeImageUrl, selectedPokemon])

  const handleSelectPokemon = (p: Pokemon) => {
    setSelectedPokemon(p)
    // Clear generated result so stale image isn't shown and TTS doesn't fire
    if (compositeImageUrl) setCompositeImageUrl(null)
  }

  const filteredPokemon = pokemonList.filter((p) => {
    if (region === 'kanto') return p.id <= 151
    if (region === 'johto') return p.id >= 152 && p.id <= 251
    return true
  })

  const generate = async (sceneId: string, pokemon: Pokemon) => {
    setIsGenerating(true)
    setCompositeImageUrl(null)
    try {
      const res = await fetch('/api/composite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId,
          pokemonId: pokemon.id,
          pokemonName: pokemon.name,
        }),
      })
      if (!res.ok) throw new Error('Composite failed')
      const blob = await res.blob()
      setCompositeImageUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error('Generate error:', e)
      alert('Something went wrong! Try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedScene || !selectedPokemon) return
    await generate(selectedScene, selectedPokemon)
  }

  const handleSurprise = () => {
    if (filteredPokemon.length === 0) return
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)]
    const randomPokemon = filteredPokemon[Math.floor(Math.random() * filteredPokemon.length)]
    setSelectedScene(randomScene.id)
    setSelectedPokemon(randomPokemon)
    generate(randomScene.id, randomPokemon)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-[#CC0000]"
          style={{ textShadow: '2px 2px 0 #FFCB05' }}>
        Create Your Adventure!
      </h1>

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Pick a Scene</h2>
        <SceneSelector selected={selectedScene} onSelect={setSelectedScene} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800">Choose a Pokemon</h2>
          {/* Region filter */}
          <div className="flex gap-1 bg-amber-50 border border-amber-200 rounded-full p-1">
            {REGIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRegion(value)}
                className={`px-3 py-1 rounded-full text-sm font-bold transition-colors min-h-[36px] ${
                  region === value
                    ? 'bg-[#CC0000] text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loadingPokemon ? (
          <p className="text-gray-500 text-center py-4">Loading Pokemon...</p>
        ) : (
          <PokemonSelector
            pokemon={filteredPokemon}
            selected={selectedPokemon}
            onSelect={handleSelectPokemon}
          />
        )}
      </section>

      <section className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedScene || !selectedPokemon || isGenerating}
          className="flex-1 bg-[#FFCB05] text-gray-900 font-bold text-xl rounded-full px-8 py-4 min-h-[56px] shadow-lg hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate!'}
        </button>
        <SurpriseButton
          onSurprise={handleSurprise}
          disabled={isGenerating || filteredPokemon.length === 0}
        />
      </section>

      <section>
        <EncounterCanvas
          imageUrl={compositeImageUrl}
          pokemonName={selectedPokemon?.name ?? null}
          isLoading={isGenerating}
          onSpeakName={selectedPokemon ? () => playTTS(selectedPokemon.name, true) : undefined}
        />
      </section>
    </main>
  )
}
