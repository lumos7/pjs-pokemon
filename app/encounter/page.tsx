'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { scenes } from '@/lib/scenes'
import { Pokemon, getCryUrl, loadSelectedGens, saveSelectedGens, filterByGens } from '@/lib/pokemon'
import { SceneSelector } from '@/components/SceneSelector'
import { PokemonSelector } from '@/components/PokemonSelector'
import { SurpriseButton } from '@/components/SurpriseButton'
import { EncounterCanvas } from '@/components/EncounterCanvas'
import { GenFilter } from '@/components/GenFilter'

function playCry(pokemonId: number) {
  const cry = new Audio(getCryUrl(pokemonId))
  cry.volume = 0.33
  cry.play().catch(() => {})
}

async function playTTS(pokemonName: string, pokemonId: number | null = null, nameOnly = false) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pokemonName, nameOnly }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const audio = new Audio(URL.createObjectURL(blob))
      // Chain cry after TTS ends
      if (pokemonId) audio.addEventListener('ended', () => playCry(pokemonId), { once: true })
      audio.play().catch(() => {})
    }
  } catch (e) {
    console.error('[tts-client] fetch error:', e)
  }
}

function EncounterContent() {
  const searchParams = useSearchParams()
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [selectedGens, setSelectedGens] = useState<number[]>(() => loadSelectedGens())
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingPokemon, setLoadingPokemon] = useState(true)
  const [flashActive, setFlashActive] = useState(false)

  // Fetch all 1025 Pokemon on mount
  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0')
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

  // Pre-select pokemon from URL params (coming from /pokemon-list)
  useEffect(() => {
    const idParam = searchParams.get('pokemonId')
    const nameParam = searchParams.get('pokemonName')
    if (!idParam || !nameParam || pokemonList.length === 0) return
    const id = parseInt(idParam, 10)
    const found = pokemonList.find(p => p.id === id) ?? { id, name: nameParam }
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)]
    setSelectedScene(randomScene.id)
    setSelectedPokemon(found)
    generate(randomScene.id, found)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemonList])

  // Auto-fire TTS when composite image is ready
  useEffect(() => {
    if (!compositeImageUrl || !selectedPokemon) return
    playTTS(selectedPokemon.name, selectedPokemon.id)
  }, [compositeImageUrl, selectedPokemon])

  const handleGensChange = (ids: number[]) => {
    setSelectedGens(ids)
    saveSelectedGens(ids)
  }

  const handleSelectPokemon = (p: Pokemon) => {
    setSelectedPokemon(p)
    // Clear generated result so stale image isn't shown and TTS doesn't fire
    if (compositeImageUrl) setCompositeImageUrl(null)
  }

  const filteredPokemon = filterByGens(pokemonList, selectedGens)

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
    console.log('[generate] selectedScene:', selectedScene, '| selectedPokemon:', selectedPokemon?.name)
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

  const handleRandomEncounter = () => {
    if (filteredPokemon.length === 0) return
    // Flash white
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 200)
    // Pick random scene + pokemon
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)]
    const randomPokemon = filteredPokemon[Math.floor(Math.random() * filteredPokemon.length)]
    // Play cry immediately
    playCry(randomPokemon.id)
    // Set selections and generate
    setSelectedScene(randomScene.id)
    setSelectedPokemon(randomPokemon)
    generate(randomScene.id, randomPokemon)
  }

  console.log('[state] scene:', selectedScene, '| pokemon:', selectedPokemon?.name)

  return (
    <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-6 relative">
      {/* White flash overlay */}
      {flashActive && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none animate-pulse" />
      )}

      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-[#CC0000]"
          style={{ textShadow: '2px 2px 0 #FFCB05' }}>
        Create Your Adventure!
      </h1>

      {/* Random Encounter button */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleRandomEncounter}
          disabled={isGenerating || filteredPokemon.length === 0}
          className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold text-lg rounded-full px-8 py-4 min-h-[56px] shadow-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⚡ Random Encounter!
        </button>
      </div>

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Pick a Scene</h2>
        <SceneSelector selected={selectedScene} onSelect={setSelectedScene} />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h2 className="text-lg font-bold text-gray-800 mr-1">Choose a Pokemon</h2>
          <GenFilter selectedGens={selectedGens} onChange={handleGensChange} />
          {/* Generate + Surprise Me — right side of same row */}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedScene || !selectedPokemon || isGenerating}
              className="bg-[#FFCB05] text-gray-900 font-bold text-sm rounded-full px-4 py-2 min-h-[40px] shadow hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isGenerating ? 'Generating...' : 'Generate!'}
            </button>
            <SurpriseButton
              onSurprise={handleSurprise}
              disabled={isGenerating || filteredPokemon.length === 0}
              compact
            />
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

      <EncounterCanvas
        imageUrl={compositeImageUrl}
        pokemonName={selectedPokemon?.name ?? null}
        pokemonId={selectedPokemon?.id ?? null}
        isLoading={isGenerating}
        onSpeakName={selectedPokemon ? () => playTTS(selectedPokemon.name, selectedPokemon.id, true) : undefined}
        onClose={() => setCompositeImageUrl(null)}
      />
    </main>
  )
}

export default function EncounterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>}>
      <EncounterContent />
    </Suspense>
  )
}
