'use client'

import { useEffect, useRef, useState } from 'react'
import { MUSIC_TRACKS, fisherYates } from '@/lib/scenes'

const DEFAULT_VOLUME = 0.15
type ThemeState = 'idle' | 'playing' | 'paused'

export function MusicPlayer() {
  // Shuffle queue — built once on mount, index-based advancement
  const queueRef     = useRef<string[]>([])
  const queueIdxRef  = useRef(0)

  function buildQueue() {
    const shuffled = fisherYates(MUSIC_TRACKS)
    // If rebuilding, ensure first track of new queue isn't the last played
    if (queueRef.current.length > 0) {
      const lastPlayed = queueRef.current[queueIdxRef.current - 1]
      if (shuffled.length > 1 && shuffled[0] === lastPlayed) {
        const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1))
        ;[shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]]
      }
    }
    queueRef.current = shuffled
    queueIdxRef.current = 0
    console.log('[music] Shuffled queue:', shuffled.map((t, i) => `${i + 1}. ${t}`).join(', '))
  }

  function nextFromQueue(): string {
    // Build queue if empty or exhausted
    if (queueRef.current.length === 0 || queueIdxRef.current >= queueRef.current.length) {
      buildQueue()
    }
    const track = queueRef.current[queueIdxRef.current]
    queueIdxRef.current++
    console.log(`[music] Now playing: "${track}" (${queueIdxRef.current}/${queueRef.current.length})`)
    return track
  }

  // Web Audio API refs for BG music
  const ctxRef       = useRef<AudioContext | null>(null)
  const gainRef      = useRef<GainNode | null>(null)
  const sourceRef    = useRef<AudioBufferSourceNode | null>(null)
  const loadTokenRef = useRef(0) // cancel stale fetches on nextTrack

  // Theme player stays as HTML Audio (one-shot, independent)
  const themeRef = useRef<HTMLAudioElement | null>(null)

  const themeActiveRef = useRef(false)
  const hasStartedRef  = useRef(false)

  const [isMuted, setIsMuted]     = useState(false)
  const [volume, setVolume]       = useState(DEFAULT_VOLUME)
  const [themeState, setThemeState] = useState<ThemeState>('idle')

  // Build the Web Audio graph once and return the AudioContext
  function getCtx(): AudioContext {
    if (ctxRef.current) return ctxRef.current

    const ctx = new AudioContext()

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(-24, ctx.currentTime)
    compressor.knee.setValueAtTime(30, ctx.currentTime)
    compressor.ratio.setValueAtTime(12, ctx.currentTime)
    compressor.attack.setValueAtTime(0.003, ctx.currentTime)
    compressor.release.setValueAtTime(0.25, ctx.currentTime)
    compressor.connect(ctx.destination)

    const gain = ctx.createGain()
    gain.gain.value = DEFAULT_VOLUME
    gain.connect(compressor)

    gainRef.current = gain
    ctxRef.current  = ctx
    return ctx
  }

  // Fetch, decode, and play a track through the Web Audio graph
  async function startBgTrack(track: string, token: number) {
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()

    const res = await fetch(`/music/${encodeURIComponent(track)}`)
    const arrayBuf = await res.arrayBuffer()

    // Bail if a newer load was requested while we were fetching
    if (loadTokenRef.current !== token) return

    const audioBuf = await ctx.decodeAudioData(arrayBuf)
    if (loadTokenRef.current !== token) return

    // Stop whatever was playing
    try { sourceRef.current?.stop() } catch { /* already stopped */ }

    const source = ctx.createBufferSource()
    source.buffer  = audioBuf
    source.loop    = false  // no loop — auto-advance via onended
    source.connect(gainRef.current!)

    // When this track ends, play the next one from the queue
    source.onended = () => {
      if (loadTokenRef.current !== token) return // skip if user already skipped
      if (themeActiveRef.current) return // don't auto-advance during theme
      const next = nextFromQueue()
      const nextToken = ++loadTokenRef.current
      startBgTrack(next, nextToken).catch(() => {})
    }

    source.start()
    sourceRef.current = source
    hasStartedRef.current = true
  }

  useEffect(() => {
    // Build the initial queue on mount
    buildQueue()
    const track = nextFromQueue()

    const unlock = () => {
      if (!hasStartedRef.current && !themeActiveRef.current) {
        const token = ++loadTokenRef.current
        startBgTrack(track, token).catch(() => {})
        document.removeEventListener('click', unlock)
        document.removeEventListener('touchstart', unlock)
      }
    }

    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)

    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      try { sourceRef.current?.stop() } catch { /* ok */ }
      ctxRef.current?.close()
      themeRef.current?.pause()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- BG music controls ---

  const nextTrack = () => {
    const track = nextFromQueue()
    const token = ++loadTokenRef.current
    if (hasStartedRef.current && themeState === 'idle') {
      startBgTrack(track, token).catch(() => {})
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (gainRef.current && !isMuted) gainRef.current.gain.value = v
    if (themeRef.current) themeRef.current.volume = v
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    if (gainRef.current) gainRef.current.gain.value = next ? 0 : volume
    if (themeRef.current) themeRef.current.muted = next
  }

  // --- Theme controls (HTML Audio, independent of Web Audio graph) ---

  const resumeBg = () => {
    if (hasStartedRef.current) {
      ctxRef.current?.resume().catch(() => {})
    }
  }

  const stopTheme = () => {
    if (themeRef.current) {
      themeRef.current.pause()
      themeRef.current.currentTime = 0
      themeRef.current.onended = null
      themeRef.current = null
    }
    themeActiveRef.current = false
    setThemeState('idle')
    resumeBg()
  }

  const playTheme = () => {
    themeActiveRef.current = true
    // Suspend BG via AudioContext (preserves playback position)
    ctxRef.current?.suspend().catch(() => {})

    const theme = new Audio('/music/playtheme.mp3')
    theme.volume = volume
    theme.muted  = isMuted
    theme.onended = stopTheme
    themeRef.current = theme
    theme.play().catch(() => {})
    setThemeState('playing')
  }

  const pauseTheme = () => {
    themeRef.current?.pause()
    setThemeState('paused')
  }

  const resumeTheme = () => {
    themeRef.current?.play().catch(() => {})
    setThemeState('playing')
  }

  // --- Render ---

  const btn = 'bg-white/90 rounded-full px-3 py-2 min-h-[40px] border border-amber-200 text-sm font-bold hover:bg-white transition-colors whitespace-nowrap shadow-sm'

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t-2 border-amber-200 shadow-lg">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap justify-between">
        {/* Left: theme controls */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={themeState === 'idle' ? playTheme : stopTheme} className={btn}>
            {themeState === 'idle' ? '🎵 Play Theme' : '⏹ Stop'}
          </button>
          {themeState !== 'idle' && (
            <button
              type="button"
              onClick={themeState === 'playing' ? pauseTheme : resumeTheme}
              className={btn}
            >
              {themeState === 'playing' ? '⏸ Pause' : '▶ Resume'}
            </button>
          )}
        </div>

        {/* Right: BG music controls */}
        <div className="flex items-center gap-2">
          {!isMuted && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-28 accent-[#FFCB05] cursor-pointer"
              style={{ touchAction: 'none' }}
              aria-label="Music volume"
            />
          )}
          <button type="button" onClick={nextTrack} className={btn}>
            Next ♪
          </button>
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute music' : 'Mute music'}
            className="bg-white/90 rounded-full px-3 py-2 min-w-[40px] min-h-[40px] border border-amber-200 text-lg hover:bg-white transition-colors shadow-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  )
}
