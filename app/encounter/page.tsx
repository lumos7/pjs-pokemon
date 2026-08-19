'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { scenes } from '@/lib/scenes'
import { Pokemon, fetchAllPokemon, loadSelectedGens, saveSelectedGens, filterByGens } from '@/lib/pokemon'
import { SceneSelector } from '@/components/SceneSelector'
import { PokemonSelector } from '@/components/PokemonSelector'
import { SurpriseButton } from '@/components/SurpriseButton'
import { EncounterCanvas } from '@/components/EncounterCanvas'
import { GenFilter } from '@/components/GenFilter'
import { QueuePanel } from '@/components/QueuePanel'
import { useQueuePlayback } from '@/lib/useQueuePlayback'
import { fetchNameClipUrl, fetchTtsClipUrl, playClip, playCryClip } from '@/lib/encounterAudio'

function playCry(pokemonId: number, pokemonName?: string) {
  playCryClip(pokemonId, 0.33, pokemonName)
}

async function playTTS(pokemonName: string, pokemonId: number | null = null, nameOnly = false) {
  const url = nameOnly ? await fetchNameClipUrl(pokemonName) : await fetchTtsClipUrl(pokemonName)
  if (!url) return
  const clip = playClip(url, 1, { revokeUrl: !nameOnly })
  // Chain cry only if the TTS finished (not preempted by another tap)
  if (pokemonId && (await clip.done)) playCry(pokemonId, pokemonName)
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
  const [listError, setListError] = useState(false)
  const [generateError, setGenerateError] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const genRunId = useRef(0) // cancel stale generate() results

  // --- Queue ("Next Up") ---
  const [queueOpen, setQueueOpen] = useState(false)
  const [sceneLocked, setSceneLocked] = useState(false)
  const sceneName = selectedScene ? scenes.find((s) => s.id === selectedScene)?.name ?? null : null
  const lockedSceneId = sceneLocked && selectedScene ? selectedScene : null
  const playback = useQueuePlayback(lockedSceneId)

  const queueActive = playback.current !== null
  const queueActiveRef = useRef(queueActive)
  queueActiveRef.current = queueActive

  // Fetch all 1025 Pokemon on mount (module-cached across pages)
  const loadPokemonList = () => {
    setLoadingPokemon(true)
    setListError(false)
    fetchAllPokemon()
      .then((list) => {
        setPokemonList(list)
        setLoadingPokemon(false)
      })
      .catch(() => {
        setListError(true)
        setLoadingPokemon(false)
      })
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPokemonList() }, [])

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

  // Auto-fire TTS when a MANUAL composite image is ready (skip during queue mode)
  useEffect(() => {
    if (queueActiveRef.current || !compositeImageUrl || !selectedPokemon) return
    playTTS(selectedPokemon.name, selectedPokemon.id)
  }, [compositeImageUrl, selectedPokemon])

  // Open the panel the first time something lands in the queue
  const prevQueueLen = useRef(0)
  useEffect(() => {
    const len = playback.items.length
    if (prevQueueLen.current === 0 && len > 0) setQueueOpen(true)
    prevQueueLen.current = len
  }, [playback.items.length])

  const handleGensChange = (ids: number[]) => {
    setSelectedGens(ids)
    saveSelectedGens(ids)
  }

  // Track the live object URL so the previous composite blob is released
  const compositeUrlRef = useRef<string | null>(null)
  const setComposite = (url: string | null) => {
    if (compositeUrlRef.current && compositeUrlRef.current !== url) {
      URL.revokeObjectURL(compositeUrlRef.current)
    }
    compositeUrlRef.current = url
    setCompositeImageUrl(url)
  }

  const handleSelectPokemon = (p: Pokemon) => {
    setSelectedPokemon(p)
    setGenerateError(false)
    // Clear generated result so stale image isn't shown and TTS doesn't fire
    if (compositeImageUrl) setComposite(null)
  }

  const filteredPokemon = filterByGens(pokemonList, selectedGens)

  const lastGenRef = useRef<{ sceneId: string; pokemon: Pokemon } | null>(null)

  const generate = async (sceneId: string, pokemon: Pokemon) => {
    const myRun = ++genRunId.current
    lastGenRef.current = { sceneId, pokemon }
    setIsGenerating(true)
    setGenerateError(false)
    setComposite(null)
    playCry(pokemon.id, pokemon.name) // anticipation cue while Sharp works
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
      if (myRun !== genRunId.current) return // superseded by a newer generate
      setComposite(URL.createObjectURL(blob))
    } catch (e) {
      if (myRun !== genRunId.current) return
      console.error('Generate error:', e)
      setGenerateError(true)
    } finally {
      if (myRun === genRunId.current) setIsGenerating(false)
    }
  }

  const retryGenerate = () => {
    const last = lastGenRef.current
    if (last) generate(last.sceneId, last.pokemon)
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
    // Pick random scene + pokemon — generate() plays the cry
    const randomScene = scenes[Math.floor(Math.random() * scenes.length)]
    const randomPokemon = filteredPokemon[Math.floor(Math.random() * filteredPokemon.length)]
    setSelectedScene(randomScene.id)
    setSelectedPokemon(randomPokemon)
    generate(randomScene.id, randomPokemon)
  }

  // What the canvas shows: queue playback takes over when active, else manual.
  const displayImage = queueActive ? playback.imageUrl : compositeImageUrl
  const displayName = queueActive ? playback.current?.name ?? null : selectedPokemon?.name ?? null
  const displayId = queueActive ? playback.current?.id ?? null : selectedPokemon?.id ?? null
  const displayLoading = queueActive ? playback.phase === 'generating' : isGenerating

  return (
    <>
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
          ) : listError ? (
            <div className="text-center py-6 bg-red-50 border-2 border-dashed border-red-200 rounded-2xl">
              <div className="text-3xl mb-2">📡</div>
              <p className="text-gray-700 font-bold mb-3">Couldn&apos;t load the Pokémon!</p>
              <button
                type="button"
                onClick={loadPokemonList}
                className="bg-[#FFCB05] text-gray-900 font-bold rounded-full px-6 py-3 min-h-[48px] shadow hover:bg-yellow-400 active:scale-95 transition-all"
              >
                🔄 Try Again!
              </button>
            </div>
          ) : (
            <PokemonSelector
              pokemon={filteredPokemon}
              selected={selectedPokemon}
              onSelect={handleSelectPokemon}
            />
          )}
        </section>

        {generateError && !displayLoading && !queueActive ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-red-200 bg-red-50 rounded-2xl">
            <div className="text-4xl mb-3">😵</div>
            <p className="text-lg font-bold text-gray-700 mb-4">Oops! That didn&apos;t work.</p>
            <button
              type="button"
              onClick={retryGenerate}
              className="bg-[#FFCB05] text-gray-900 font-bold text-lg rounded-full px-8 py-4 min-h-[56px] shadow-lg hover:bg-yellow-400 active:scale-95 transition-all"
            >
              🔄 Try Again!
            </button>
          </div>
        ) : (
          <EncounterCanvas
            imageUrl={displayImage}
            pokemonName={displayName}
            pokemonId={displayId}
            isLoading={displayLoading}
            lockOpen={queueActive}
            speakLabel={queueActive ? '🔊 Cry again' : undefined}
            onSpeakName={
              queueActive
                ? playback.replayCry
                : selectedPokemon
                  ? () => playTTS(selectedPokemon.name, selectedPokemon.id, true)
                  : undefined
            }
            onClose={queueActive ? playback.stop : () => setComposite(null)}
          />
        )}
      </main>

      {/* Big sticky Go button — the small header Generate is easy to lose after
          scrolling the Pokémon list; kids need the CTA in view. */}
      {selectedScene && selectedPokemon && !displayImage && !displayLoading && !queueActive && !generateError && (
        <div
          className="fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
          style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={handleGenerate}
            className="pointer-events-auto bg-gradient-to-r from-[#CC0000] to-[#FF4444] text-white font-extrabold text-xl rounded-full px-10 py-4 min-h-[60px] shadow-2xl hover:scale-105 active:scale-95 transition-transform"
          >
            ✨ Go! Meet {selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}!
          </button>
        </div>
      )}

      <QueuePanel
        playback={playback}
        open={queueOpen}
        onToggleOpen={() => setQueueOpen((o) => !o)}
        sceneLocked={sceneLocked}
        onToggleSceneLock={() => setSceneLocked((s) => !s)}
        lockedSceneName={sceneName}
      />
    </>
  )
}

export default function EncounterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>}>
      <EncounterContent />
    </Suspense>
  )
}
