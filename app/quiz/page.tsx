'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Pokemon, getOfficialArtworkUrl, getCryUrl } from '@/lib/pokemon'
import { fisherYates } from '@/lib/scenes'

type Region = 'kanto' | 'johto' | 'both'

const REGIONS: { value: Region; label: string }[] = [
  { value: 'kanto', label: 'Kanto' },
  { value: 'johto', label: 'Johto' },
  { value: 'both',  label: 'Both'  },
]

const STORAGE_KEY = 'pjs-quiz-state'

interface QuizState {
  score: number
  round: number
  region: Region
  usedIds: number[]
}

function filterByRegion(list: Pokemon[], region: Region): Pokemon[] {
  if (region === 'kanto') return list.filter(p => p.id >= 1 && p.id <= 151)
  if (region === 'johto') return list.filter(p => p.id >= 152 && p.id <= 251)
  return list
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function QuizPage() {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
  const [region, setRegion] = useState<Region>('both')
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [usedIds, setUsedIds] = useState<number[]>([])

  // Round state
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null)
  const [choices, setChoices] = useState<Pokemon[]>([])
  const [revealed, setRevealed] = useState(false)
  const [strikes, setStrikes] = useState(0)
  const [disabledIds, setDisabledIds] = useState<Set<number>>(new Set())
  const [selectedCorrect, setSelectedCorrect] = useState(false)
  const [showNext, setShowNext] = useState(false)

  // Resume modal
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [savedState, setSavedState] = useState<QuizState | null>(null)

  const jingleRef = useRef<HTMLAudioElement | null>(null)

  // Fetch pokemon list
  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=251&offset=0')
      .then(r => r.json())
      .then(data => {
        const list: Pokemon[] = data.results.map((p: { name: string; url: string }) => {
          const segments = p.url.replace(/\/$/, '').split('/')
          const id = parseInt(segments[segments.length - 1], 10)
          return { id, name: p.name }
        })
        setAllPokemon(list)
      })
      .catch(() => {})
  }, [])

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const state: QuizState = JSON.parse(raw)
        if (state.score > 0 || state.round > 0) {
          setSavedState(state)
          setShowResumeModal(true)
        }
      }
    } catch {}
  }, [])

  // Save state to sessionStorage
  useEffect(() => {
    if (!gameStarted) return
    try {
      const state: QuizState = { score, round, region, usedIds }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [score, round, region, usedIds, gameStarted])

  const pickRound = useCallback((pool: Pokemon[], used: number[]) => {
    const available = pool.filter(p => !used.includes(p.id))
    const source = available.length > 0 ? available : pool

    const shuffled = fisherYates(source)
    const answer = shuffled[0]

    // Pick 3 wrong answers from pool (different from answer)
    const wrong = fisherYates(pool.filter(p => p.id !== answer.id)).slice(0, 3)
    const options = fisherYates([answer, ...wrong])

    setCurrentPokemon(answer)
    setChoices(options)
    setRevealed(false)
    setStrikes(0)
    setDisabledIds(new Set())
    setSelectedCorrect(false)
    setShowNext(false)

    // Play jingle
    if (jingleRef.current) {
      jingleRef.current.pause()
      jingleRef.current.currentTime = 0
    }
    const jingle = new Audio('/music/whos-that-pokemon.mp3')
    jingle.volume = 0.5
    jingle.play().catch(() => {})
    jingleRef.current = jingle

    return answer
  }, [])

  const startGame = useCallback((resumeState?: QuizState) => {
    const r = resumeState?.region ?? region
    const pool = filterByRegion(allPokemon, r)
    if (pool.length < 4) return

    const s = resumeState?.score ?? 0
    const rd = resumeState?.round ?? 0
    const used = resumeState?.usedIds ?? []

    setRegion(r)
    setScore(s)
    setRound(rd)
    setUsedIds(used)
    setGameStarted(true)
    setShowResumeModal(false)

    pickRound(pool, used)
  }, [allPokemon, region, pickRound])

  const handleAnswer = useCallback((chosen: Pokemon) => {
    if (!currentPokemon || revealed) return

    if (chosen.id === currentPokemon.id) {
      // Correct
      setSelectedCorrect(true)
      setRevealed(true)
      setShowNext(true)
      setScore(prev => prev + 1)
      setUsedIds(prev => [...prev, currentPokemon.id])

      // Play cry
      const cry = new Audio(getCryUrl(currentPokemon.id))
      cry.volume = 0.33
      cry.play().catch(() => {})
    } else {
      // Wrong
      const newStrikes = strikes + 1
      setStrikes(newStrikes)
      setDisabledIds(prev => { const s = new Set(prev); s.add(chosen.id); return s })

      if (newStrikes >= 2) {
        // Game over for this round
        setRevealed(true)
        setShowNext(true)
        setUsedIds(prev => [...prev, currentPokemon.id])
      }
    }
  }, [currentPokemon, revealed, strikes])

  const handleNext = useCallback(() => {
    const pool = filterByRegion(allPokemon, region)
    const newRound = round + 1
    setRound(newRound)
    pickRound(pool, usedIds)
  }, [allPokemon, region, round, usedIds, pickRound])

  const handleResume = useCallback(() => {
    if (savedState) startGame(savedState)
  }, [savedState, startGame])

  const handleNewGame = useCallback(() => {
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
    setSavedState(null)
    setShowResumeModal(false)
  }, [])

  // Landing screen
  if (!gameStarted && !showResumeModal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #CC0000 0%, #ff1a1a 50%, #CC0000 100%)' }}>
        {/* Diagonal rays */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute origin-center"
              style={{
                top: '50%', left: '50%',
                width: '200vmax', height: '60px',
                background: 'rgba(255,255,255,0.07)',
                transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
              }} />
          ))}
        </div>

        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl sm:text-7xl text-[#FFCB05] mb-2 drop-shadow-lg"
            style={{ fontFamily: "'Bangers', 'Impact', cursive", WebkitTextStroke: '2px #2A75BB', letterSpacing: '0.04em' }}>
            Who&apos;s That Pokémon?
          </h1>
          <p className="text-white/80 text-lg mb-8">Test your Pokémon knowledge!</p>

          {/* Region selector */}
          <div className="flex gap-2 justify-center mb-8">
            {REGIONS.map(r => (
              <button key={r.value}
                onClick={() => setRegion(r.value)}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
                  region === r.value
                    ? 'bg-[#FFCB05] text-gray-900 scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}>
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => startGame()}
            disabled={allPokemon.length === 0}
            className="bg-[#FFCB05] text-gray-900 font-bold text-xl px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {allPokemon.length === 0 ? 'Loading...' : 'Start!'}
          </button>
        </div>
      </div>
    )
  }

  // Resume modal
  if (showResumeModal && savedState) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #CC0000 0%, #ff1a1a 50%, #CC0000 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute origin-center"
              style={{
                top: '50%', left: '50%',
                width: '200vmax', height: '60px',
                background: 'rgba(255,255,255,0.07)',
                transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
              }} />
          ))}
        </div>
        <div className="relative z-10 bg-white rounded-2xl p-8 mx-4 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600 mb-6">You had <span className="font-bold text-[#CC0000]">{savedState.score}</span> points.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleResume}
              className="bg-[#FFCB05] text-gray-900 font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform">
              Continue
            </button>
            <button onClick={handleNewGame}
              className="bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-full hover:bg-gray-300 transition-colors">
              New Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Game screen
  const lives = 2 - strikes

  return (
    <div className="min-h-screen relative overflow-hidden pb-32"
      style={{ background: 'linear-gradient(135deg, #CC0000 0%, #ff1a1a 50%, #CC0000 100%)' }}>
      {/* Diagonal rays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute origin-center"
            style={{
              top: '50%', left: '50%',
              width: '200vmax', height: '60px',
              background: 'rgba(255,255,255,0.07)',
              transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
            }} />
        ))}
      </div>

      {/* HUD */}
      <div className="relative z-10 flex justify-between items-center px-4 pt-4">
        <div className="text-2xl" title={`${lives} lives remaining`}>
          {lives >= 1 ? '❤️' : '🖤'}{lives >= 2 ? '❤️' : '🖤'}
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1">
          <span className="text-white font-bold text-lg">Score: {score}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4 mt-4 sm:mt-8">
        {/* Silhouette area */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-6">
          {currentPokemon && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getOfficialArtworkUrl(currentPokemon.id)}
                alt={revealed ? capitalize(currentPokemon.name) : 'Mystery Pokémon'}
                className="w-full h-full object-contain drop-shadow-2xl"
                style={{
                  filter: revealed ? 'none' : 'brightness(0)',
                  transition: 'filter 0.5s ease-in-out',
                }}
              />
              {/* Yellow question mark */}
              {!revealed && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 text-8xl sm:text-9xl font-bold text-[#FFCB05] opacity-80 select-none"
                  style={{ fontFamily: "'Bangers', 'Impact', cursive", WebkitTextStroke: '3px #2A75BB' }}>
                  ?
                </span>
              )}
            </>
          )}
        </div>

        {/* Result text */}
        {revealed && currentPokemon && (
          <div className={`text-center mb-4 ${selectedCorrect ? 'text-green-300' : 'text-red-300'}`}>
            <p className="text-2xl sm:text-3xl font-bold drop-shadow-lg"
              style={{ fontFamily: "'Bangers', 'Impact', cursive", letterSpacing: '0.03em' }}>
              {selectedCorrect
                ? `That's right! It's ${capitalize(currentPokemon.name)}!`
                : `It was ${capitalize(currentPokemon.name)}!`}
            </p>
          </div>
        )}

        {/* Answer buttons */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
          {choices.map(choice => {
            const isCorrectChoice = currentPokemon && choice.id === currentPokemon.id
            const isDisabled = disabledIds.has(choice.id)
            const showGreen = revealed && isCorrectChoice
            const showRed = isDisabled && !isCorrectChoice

            let bg = 'bg-[#FFCB05] hover:bg-yellow-400'
            if (showGreen) bg = 'bg-green-500'
            else if (showRed) bg = 'bg-red-500'

            return (
              <button key={choice.id}
                onClick={() => handleAnswer(choice)}
                disabled={revealed || isDisabled}
                className={`${bg} text-gray-900 font-bold py-3 px-4 rounded-full text-sm sm:text-base transition-all shadow-md
                  ${revealed || isDisabled ? 'cursor-not-allowed opacity-80' : 'hover:scale-105 active:scale-95'}
                  ${showGreen ? 'text-white' : ''} ${showRed ? 'text-white' : ''}`}>
                {capitalize(choice.name)}
              </button>
            )
          })}
        </div>

        {/* Next button */}
        {showNext && (
          <button onClick={handleNext}
            className="bg-white text-[#CC0000] font-bold text-lg px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-lg">
            Next Pokémon →
          </button>
        )}
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-20 right-4 z-10">
        <span className="text-[#FFCB05] text-xl font-bold opacity-60"
          style={{ fontFamily: "'Bangers', 'Impact', cursive", WebkitTextStroke: '1px #2A75BB' }}>
          PJ&apos;s Pokémon
        </span>
      </div>
    </div>
  )
}
