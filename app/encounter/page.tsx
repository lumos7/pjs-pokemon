'use client'

import { useEffect, useState } from 'react'
import { scenes } from '@/lib/scenes'
import { Pokemon } from '@/lib/pokemon'
import { SceneSelector } from '@/components/SceneSelector'
import { PokemonSelector } from '@/components/PokemonSelector'
import { SurpriseButton } from '@/components/SurpriseButton'
import { EncounterCanvas } from '@/components/EncounterCanvas'

export default function EncounterPage() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([])
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loadingPokemon, setLoadingPokemon] = useState(true)

  // Fetch pokemon list on mount
  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=250&offset=0')
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
    const fireTTS = async () => {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pokemonName: selectedPokemon.name }),
        })
        if (res.ok) {
          const blob = await res.blob()
          const audio = new Audio(URL.createObjectURL(blob))
          audio.play().catch(() => {})
        }
      } catch (e) {
        console.error('TTS error:', e)
      }
    }
    fireTTS()
  }, [compositeImageUrl, selectedPokemon])

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
      const url = URL.createObjectURL(blob)
      setCompositeImageUrl(url)
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
    if (pokemonList.length === 0) return
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)]
    const randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)]
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
        <h2 className="text-lg font-bold text-gray-800 mb-2">Choose a Pokemon</h2>
        {loadingPokemon ? (
          <p className="text-gray-500 text-center py-4">Loading Pokemon...</p>
        ) : (
          <PokemonSelector
            pokemon={pokemonList}
            selected={selectedPokemon}
            onSelect={setSelectedPokemon}
          />
        )}
      </section>

      <section className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGenerate}
          disabled={!selectedScene || !selectedPokemon || isGenerating}
          className="flex-1 bg-[#FFCB05] text-gray-900 font-bold text-xl rounded-full px-8 py-4 min-h-[56px] shadow-lg hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate!'}
        </button>
        <SurpriseButton
          onSurprise={handleSurprise}
          disabled={isGenerating || pokemonList.length === 0}
        />
      </section>

      <section>
        <EncounterCanvas
          imageUrl={compositeImageUrl}
          pokemonName={selectedPokemon?.name ?? null}
          isLoading={isGenerating}
        />
      </section>
    </main>
  )
}
